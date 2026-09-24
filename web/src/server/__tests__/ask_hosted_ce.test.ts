/**
 * JH-38: hosted Gemini serving must never import @xenova/transformers.
 * Distinct from Guide 02 ablation (MECHANIC_FORCE_RRF_ONLY) and from
 * natural CE degrade (ce_unavailable / rerank_degraded).
 */
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { RetrieverHit } from '@/lib/retrieval/types';

const transformersImported = vi.hoisted(() => vi.fn());

vi.mock('@xenova/transformers', () => {
  transformersImported();
  return {
    AutoTokenizer: {
      from_pretrained: vi.fn(async () => {
        throw new Error('no tokenizer');
      }),
    },
    AutoModelForSequenceClassification: {
      from_pretrained: vi.fn(async () => {
        throw new Error('no model');
      }),
    },
    pipeline: vi.fn(async () => {
      throw new Error('no pipeline');
    }),
  };
});

const embedText = vi.fn(async () => ({
  embedding: [0.1, 0.2],
  model: 'gemini-embedding-001',
}));
const generateAnswer = vi.fn(async () => ({
  text: 'Torque is 39 N·m [1]',
  model: 'gemma-4-26b-a4b-it',
}));

vi.mock('@/server/providers', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@/server/providers')>();
  return {
    ...actual,
    embedText,
    generateAnswer,
  };
});

function hit(chunk_id: string, section: string): RetrieverHit {
  return {
    chunk_id,
    document_id: 'doc1',
    content: `content ${chunk_id}`,
    section_path: section,
    page_start: 1,
    page_end: 1,
    modality: 'vector',
    retriever_score: 0.9,
  };
}

const vehicleExists = vi.fn(async () => true);
const vectorSearch = vi.fn(async () => [hit('a', 'Oil'), hit('b', 'Clutch')]);
const lexicalSearch = vi.fn(async () => [hit('a', 'Oil')]);
const loadChunksByIds = vi.fn(async (ids: string[]) => {
  const map = new Map();
  for (const id of ids) {
    map.set(id, {
      chunk_id: id,
      document_id: 'doc1',
      vehicle_id: 'fixture:honda-s2000-demo',
      doc_family: 'service_manual',
      content: `Oil drain plug torque is 39 N·m (${id})`,
      section_path: '1-1 Specification',
      page_start: 1,
      page_end: 1,
      document_name: 'demo',
    });
  }
  return map;
});

vi.mock('@/server/retrievers', () => ({
  vehicleExists: (...args: never[]) => (vehicleExists as (...a: never[]) => unknown)(...args),
  vectorSearch: (...args: never[]) => (vectorSearch as (...a: never[]) => unknown)(...args),
  lexicalSearch: (...args: never[]) => (lexicalSearch as (...a: never[]) => unknown)(...args),
  loadChunksByIds: (...args: never[]) => (loadChunksByIds as (...a: never[]) => unknown)(...args),
}));

vi.mock('@/server/ask_image_channel', () => ({
  retrieveImageChannel: vi.fn(async () => ({
    hits: [],
    ms: 0,
    degraded: true,
    reason: 'image_index_empty_or_no_hits',
  })),
  isImageChannelEnabled: () => true,
}));

function askLogs(logSpy: ReturnType<typeof vi.spyOn>): Array<Record<string, unknown>> {
  return logSpy.mock.calls
    .map(([msg]) => {
      if (typeof msg !== 'string') return null;
      try {
        return JSON.parse(msg) as Record<string, unknown>;
      } catch {
        return null;
      }
    })
    .filter((row): row is Record<string, unknown> => row != null && row.event === 'ask');
}

describe('hosted CE hard-disable (JH-38)', () => {
  beforeEach(() => {
    vi.resetModules();
    transformersImported.mockClear();
    embedText.mockClear();
    generateAnswer.mockClear();
    vi.stubEnv('MECHANIC_DIAGNOSTICS', '1');
    vi.stubEnv('SECTION_DEDUP_ENABLED', '1');
    vi.stubEnv('MECHANIC_FORCE_RRF_ONLY', '0');
  });

  afterEach(() => {
    vi.unstubAllEnvs();
    vi.restoreAllMocks();
  });

  it('Ask on hosted Gemini skips CE and never imports transformers', async () => {
    vi.stubEnv('GEMINI_API_KEY', 'test-hosted-key');
    const logSpy = vi.spyOn(console, 'log').mockImplementation(() => undefined);
    const { handleAsk } = await import('@/server/ask');
    const result = await handleAsk({
      vehicle_id: 'fixture:honda-s2000-demo',
      question: 'What is the oil drain plug torque?',
    });
    expect('error' in result).toBe(false);
    if ('error' in result) return;
    expect(transformersImported).not.toHaveBeenCalled();
    expect(result.diagnostics?.ce_skip_reason).toBe('hosted_ce_disabled');
    expect(result.diagnostics?.ce_model).toBe('skipped_hosted');
    expect(result.diagnostics?.ablation_rrf_only).toBe(false);
    expect(result.diagnostics?.rerank_degraded).toBe(false);
    expect(result.diagnostics?.ce_error).toBeUndefined();
    const logged = askLogs(logSpy);
    expect(logged.some((row) => row.ce_skip_reason === 'hosted_ce_disabled')).toBe(
      true,
    );
  });

  it('FORCE ablation on hosted keeps ablation meaning (not hosted skip, no import)', async () => {
    vi.stubEnv('GEMINI_API_KEY', 'test-hosted-key');
    vi.stubEnv('MECHANIC_FORCE_RRF_ONLY', '1');
    const { handleAsk } = await import('@/server/ask');
    const result = await handleAsk({
      vehicle_id: 'fixture:honda-s2000-demo',
      question: 'What is the oil drain plug torque?',
    });
    expect('error' in result).toBe(false);
    if ('error' in result) return;
    expect(transformersImported).not.toHaveBeenCalled();
    expect(result.diagnostics?.ablation_rrf_only).toBe(true);
    expect(result.diagnostics?.rerank_degraded).toBe(false);
    expect(result.diagnostics?.ce_model).toBe('skipped_ablation');
    expect(result.diagnostics?.ce_skip_reason).toBeUndefined();
  });

  it('local path (no Gemini key) still constructs CE and does not set hosted skip', async () => {
    vi.stubEnv('GEMINI_API_KEY', '');
    vi.stubEnv('CE_RUNTIME', 'fake');
    const { handleAsk } = await import('@/server/ask');
    const result = await handleAsk({
      vehicle_id: 'fixture:honda-s2000-demo',
      question: 'What is the oil drain plug torque?',
    });
    expect('error' in result).toBe(false);
    if ('error' in result) return;
    expect(transformersImported).not.toHaveBeenCalled();
    expect(result.diagnostics?.ce_skip_reason).toBeUndefined();
    expect(result.diagnostics?.ablation_rrf_only).toBe(false);
    expect(result.diagnostics?.rerank_degraded).toBe(false);
    expect(result.diagnostics?.ce_model).toBe('fake-ce');
  });

  it('createCrossEncoderFromEnv on hosted rejects before transformers import', async () => {
    vi.stubEnv('GEMINI_API_KEY', 'test-hosted-key');
    vi.stubEnv('CE_RUNTIME', 'transformers_js');
    const { createCrossEncoderFromEnv, HOSTED_CE_SKIP_REASON } = await import(
      '@/server/cross_encoder'
    );
    await expect(createCrossEncoderFromEnv()).rejects.toThrow(HOSTED_CE_SKIP_REASON);
    expect(transformersImported).not.toHaveBeenCalled();
  });

  it('getTransformersCrossEncoder on hosted never reaches the import', async () => {
    vi.stubEnv('GEMINI_API_KEY', 'test-hosted-key');
    const { getTransformersCrossEncoder, HOSTED_CE_SKIP_REASON } = await import(
      '@/server/cross_encoder'
    );
    await expect(getTransformersCrossEncoder()).rejects.toThrow(
      HOSTED_CE_SKIP_REASON,
    );
    expect(transformersImported).not.toHaveBeenCalled();
  });

  it('local transformers path still reaches the @xenova/transformers import', async () => {
    vi.stubEnv('GEMINI_API_KEY', '');
    vi.stubEnv('CE_RUNTIME', 'transformers_js');
    const { getTransformersCrossEncoder } = await import('@/server/cross_encoder');
    await expect(getTransformersCrossEncoder()).rejects.toThrow();
    expect(transformersImported).toHaveBeenCalled();
  });
});
