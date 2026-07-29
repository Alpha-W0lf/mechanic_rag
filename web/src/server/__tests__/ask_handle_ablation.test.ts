import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { RetrieverHit } from '@/lib/retrieval/types';

const scorePairs = vi.fn(
  async (
    _q: string,
    candidates: Array<{ chunk_id: string }>,
  ): Promise<Array<{ chunk_id: string; ce_score: number }>> =>
    candidates.map((c, i) => ({ chunk_id: c.chunk_id, ce_score: i })),
);

const createCrossEncoderFromEnv = vi.fn(async () => ({
  modelId: 'mock-ce',
  runtime: 'transformers_js:classification',
  scorePairs,
}));

vi.mock('@/server/cross_encoder', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@/server/cross_encoder')>();
  return {
    ...actual,
    createCrossEncoderFromEnv,
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
  vehicleExists: (...args: unknown[]) => vehicleExists(...args),
  vectorSearch: (...args: unknown[]) => vectorSearch(...args),
  lexicalSearch: (...args: unknown[]) => lexicalSearch(...args),
  loadChunksByIds: (...args: unknown[]) => loadChunksByIds(...args),
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

vi.mock('@/server/ollama', () => ({
  embedText: vi.fn(async () => ({ embedding: [0.1, 0.2], model: 'nomic-embed-text' })),
  generateAnswer: vi.fn(async () => ({
    text: 'Torque is 39 N·m [1]',
    model: 'gemma4:e2b',
  })),
  OllamaError: class OllamaError extends Error {
    name = 'OllamaError';
  },
}));

describe('handleAsk ablation vs degrade', () => {
  beforeEach(() => {
    vi.resetModules();
    vi.clearAllMocks();
    vi.stubEnv('MECHANIC_DIAGNOSTICS', '1');
    vi.stubEnv('SECTION_DEDUP_ENABLED', '1');
  });

  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it('FORCE_RRF_ONLY skips CE and sets ablation_rrf_only (not degraded)', async () => {
    vi.stubEnv('MECHANIC_FORCE_RRF_ONLY', '1');
    const { handleAsk } = await import('@/server/ask');
    const result = await handleAsk({
      vehicle_id: 'fixture:honda-s2000-demo',
      question: 'What is the oil drain plug torque?',
    });
    expect('error' in result).toBe(false);
    if ('error' in result) return;
    expect(createCrossEncoderFromEnv).not.toHaveBeenCalled();
    expect(scorePairs).not.toHaveBeenCalled();
    expect(result.diagnostics?.ablation_rrf_only).toBe(true);
    expect(result.diagnostics?.rerank_degraded).toBe(false);
  });

  it('CE unavailable without FORCE sets rerank_degraded (not ablation)', async () => {
    vi.stubEnv('MECHANIC_FORCE_RRF_ONLY', '0');
    createCrossEncoderFromEnv.mockRejectedValueOnce(new Error('no ce'));
    const { handleAsk } = await import('@/server/ask');
    const result = await handleAsk({
      vehicle_id: 'fixture:honda-s2000-demo',
      question: 'What is the oil drain plug torque?',
    });
    expect('error' in result).toBe(false);
    if ('error' in result) return;
    expect(result.diagnostics?.ablation_rrf_only).toBe(false);
    expect(result.diagnostics?.rerank_degraded).toBe(true);
    expect(result.diagnostics?.ce_error).toBe('ce_unavailable');
  });

  it('healthy CE path records ce_runtime_mode and no ablation', async () => {
    vi.stubEnv('MECHANIC_FORCE_RRF_ONLY', '0');
    const { handleAsk } = await import('@/server/ask');
    const result = await handleAsk({
      vehicle_id: 'fixture:honda-s2000-demo',
      question: 'What is the oil drain plug torque?',
    });
    expect('error' in result).toBe(false);
    if ('error' in result) return;
    expect(createCrossEncoderFromEnv).toHaveBeenCalled();
    expect(result.diagnostics?.ablation_rrf_only).toBe(false);
    expect(result.diagnostics?.rerank_degraded).toBe(false);
    expect(result.diagnostics?.ce_runtime_mode).toBe('classification');
  });
});
