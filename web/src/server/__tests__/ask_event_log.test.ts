/**
 * JH-50: handleAsk emits exactly one event:ask line per outcome.
 * Not gated by MECHANIC_DIAGNOSTICS. Public diagnostics stay gated.
 */
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { RetrieverHit } from '@/lib/retrieval/types';
import { GeminiError } from '@/server/providers';
import { PUBLIC_ASK_ERROR } from '@/server/ask_errors';

const scorePairs = vi.fn(
  async (
    _q: string,
    candidates: Array<{ chunk_id: string }>,
  ): Promise<Array<{ chunk_id: string; ce_score: number }>> =>
    candidates.map((c, i) => ({ chunk_id: c.chunk_id, ce_score: i })),
);

vi.mock('@/server/cross_encoder', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@/server/cross_encoder')>();
  return {
    ...actual,
    createCrossEncoderFromEnv: vi.fn(async () => ({
      modelId: 'mock-ce',
      runtime: 'transformers_js:classification',
      scorePairs,
    })),
  };
});

function hit(chunk_id: string): RetrieverHit {
  return {
    chunk_id,
    document_id: 'doc1',
    content: `content ${chunk_id}`,
    section_path: 'Oil',
    page_start: 1,
    page_end: 1,
    modality: 'vector',
    retriever_score: 0.9,
  };
}

const vehicleExists = vi.fn(async () => true);
const vectorSearch = vi.fn(async () => [hit('a')]);
const lexicalSearch = vi.fn(async () => [hit('a')]);
const loadChunksByIds = vi.fn(async (ids: string[]) => {
  const map = new Map();
  for (const id of ids) {
    map.set(id, {
      chunk_id: id,
      document_id: 'doc1',
      vehicle_id: 'fixture:honda-s2000-demo',
      doc_family: 'service_manual',
      content: `Oil drain plug torque is 39 N·m (${id}). Replace the washer.`,
      section_path: '1-1 Specification',
      page_start: 1,
      page_end: 1,
      document_name: 'demo',
      provenance: null,
    });
  }
  return map;
});

vi.mock('@/server/retrievers', () => ({
  vehicleExists: (...args: never[]) =>
    (vehicleExists as (...a: never[]) => unknown)(...args),
  vectorSearch: (...args: never[]) =>
    (vectorSearch as (...a: never[]) => unknown)(...args),
  lexicalSearch: (...args: never[]) =>
    (lexicalSearch as (...a: never[]) => unknown)(...args),
  loadChunksByIds: (...args: never[]) =>
    (loadChunksByIds as (...a: never[]) => unknown)(...args),
}));

const retrieveImageChannel = vi.fn(async () => ({
  hits: [],
  ms: 0,
  degraded: true,
  reason: 'clip_query_unavailable',
}));

vi.mock('@/server/ask_image_channel', () => ({
  retrieveImageChannel: (...args: never[]) =>
    (retrieveImageChannel as (...a: never[]) => unknown)(...args),
  isImageChannelEnabled: () => true,
}));

const embedText = vi.fn(async () => ({
  embedding: [0.1, 0.2],
  model: 'gemini-embedding-001',
  dim: 2,
}));
const generateAnswer = vi.fn();

vi.mock('@/server/providers', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@/server/providers')>();
  return {
    ...actual,
    embedText: (...args: never[]) =>
      (embedText as (...a: never[]) => unknown)(...args),
    generateAnswer: (...args: never[]) =>
      (generateAnswer as (...a: never[]) => unknown)(...args),
  };
});

function askLogs(
  logSpy: ReturnType<typeof vi.spyOn>,
): Array<Record<string, unknown>> {
  return logSpy.mock.calls
    .map(([msg]) => {
      if (typeof msg !== 'string') return null;
      try {
        return JSON.parse(msg) as Record<string, unknown>;
      } catch {
        return null;
      }
    })
    .filter(
      (row): row is Record<string, unknown> => row != null && row.event === 'ask',
    );
}

function isFailure(
  result: unknown,
): result is { error: string; status: number; error_class?: string } {
  if (!result || typeof result !== 'object') return false;
  return 'status' in result && 'error' in result;
}

const REQ = {
  vehicle_id: 'fixture:honda-s2000-demo',
  question: 'What is the oil drain plug torque?',
};

describe('handleAsk event:ask line (JH-50)', () => {
  beforeEach(() => {
    vi.resetModules();
    vi.clearAllMocks();
    vi.stubEnv('MECHANIC_FORCE_RRF_ONLY', '1');
    vi.stubEnv('MECHANIC_DIAGNOSTICS', '0');
    vehicleExists.mockResolvedValue(true);
    vectorSearch.mockResolvedValue([hit('a')]);
    lexicalSearch.mockResolvedValue([hit('a')]);
    retrieveImageChannel.mockResolvedValue({
      hits: [],
      ms: 0,
      degraded: true,
      reason: 'clip_query_unavailable',
    });
    embedText.mockResolvedValue({
      embedding: [0.1, 0.2],
      model: 'gemini-embedding-001',
      dim: 2,
    });
    generateAnswer.mockResolvedValue({
      text: 'Torque is 39 N·m [1]',
      model: 'gemma-4-26b-a4b-it',
      attempts: 1,
    });
  });

  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it('answered: one line with gen_attempts / gen_ms; diagnostics stay null', async () => {
    const logSpy = vi.spyOn(console, 'log').mockImplementation(() => undefined);
    const { handleAsk } = await import('@/server/ask');
    const result = await handleAsk(REQ);
    expect(isFailure(result)).toBe(false);
    if (isFailure(result)) return;
    expect(result.outcome).toBe('answered');
    expect(result.diagnostics).toBeNull();
    const logged = askLogs(logSpy);
    expect(logged).toHaveLength(1);
    expect(logged[0]?.outcome).toBe('answered');
    expect(logged[0]?.error_class).toBeUndefined();
    expect(logged[0]?.gen_attempts).toBe(1);
    expect(typeof logged[0]?.gen_ms).toBe('number');
    expect(logged[0]?.embedding_model).toBe('gemini-embedding-001');
    expect(logged[0]?.generator_model).toBe('gemma-4-26b-a4b-it');
    expect(logged[0]?.image_degraded).toBeUndefined();
    expect(logged[0]?.image_degrade_reason).toBeUndefined();
    expect(JSON.stringify(logged[0])).not.toMatch(/oil drain plug|postgres:\/\//i);
    logSpy.mockRestore();
  });

  it('degraded (generator): one line with outcome + error_class + gen_*', async () => {
    generateAnswer.mockRejectedValue(
      new GeminiError('gemini generate failed: 503', 503, 'UNAVAILABLE', 4),
    );
    const logSpy = vi.spyOn(console, 'log').mockImplementation(() => undefined);
    const { handleAsk } = await import('@/server/ask');
    const result = await handleAsk(REQ);
    expect(isFailure(result)).toBe(false);
    if (isFailure(result)) return;
    expect(result.outcome).toBe('degraded');
    expect(result.error_class).toBe('generator_unavailable');
    expect(result.diagnostics).toBeNull();
    const logged = askLogs(logSpy);
    expect(logged).toHaveLength(1);
    expect(logged[0]?.outcome).toBe('degraded');
    expect(logged[0]?.error_class).toBe('generator_unavailable');
    expect(logged[0]?.gen_attempts).toBe(4);
    expect(typeof logged[0]?.gen_ms).toBe('number');
    expect(logged[0]?.error).toBeUndefined();
    logSpy.mockRestore();
  });

  it('degraded (embedding): one line, not gated, no extractive_fallback', async () => {
    embedText.mockRejectedValue(
      new GeminiError('gemini embed failed: 503', 503, 'UNAVAILABLE'),
    );
    const logSpy = vi.spyOn(console, 'log').mockImplementation(() => undefined);
    const { handleAsk } = await import('@/server/ask');
    const result = await handleAsk(REQ);
    expect(isFailure(result)).toBe(false);
    if (isFailure(result)) return;
    expect(result.outcome).toBe('degraded');
    expect(result.error_class).toBe('embedding_unavailable');
    expect(result.diagnostics).toBeNull();
    const logged = askLogs(logSpy);
    expect(logged).toHaveLength(1);
    expect(logged[0]?.outcome).toBe('degraded');
    expect(logged[0]?.error_class).toBe('embedding_unavailable');
    expect(logged[0]?.gen_attempts).toBeUndefined();
    expect(logged[0]?.lexical_count).toBeGreaterThanOrEqual(1);
    expect(JSON.stringify(logged)).not.toMatch(/extractive_fallback/);
    logSpy.mockRestore();
  });

  it('insufficient_evidence: one line', async () => {
    vectorSearch.mockResolvedValue([]);
    lexicalSearch.mockResolvedValue([]);
    const logSpy = vi.spyOn(console, 'log').mockImplementation(() => undefined);
    const { handleAsk } = await import('@/server/ask');
    const result = await handleAsk(REQ);
    expect(isFailure(result)).toBe(false);
    if (isFailure(result)) return;
    expect(result.outcome).toBe('insufficient_evidence');
    const logged = askLogs(logSpy);
    expect(logged).toHaveLength(1);
    expect(logged[0]?.outcome).toBe('insufficient_evidence');
    expect(logged[0]?.error_class).toBeUndefined();
    expect(logged[0]?.image_degraded).toBeUndefined();
    logSpy.mockRestore();
  });

  it('database_unavailable: one line with error_class, no raw driver text', async () => {
    const dbErr = new Error(
      '(ENOTFOUND) tenant/user postgres.abcdefghijklmnopqrst not found',
    );
    (dbErr as { code?: string }).code = 'ENOTFOUND';
    vehicleExists.mockRejectedValue(dbErr);
    const logSpy = vi.spyOn(console, 'log').mockImplementation(() => undefined);
    const { handleAsk } = await import('@/server/ask');
    const result = await handleAsk(REQ);
    expect(result).toEqual({
      error: PUBLIC_ASK_ERROR.database_unavailable,
      error_class: 'database_unavailable',
      status: 503,
    });
    const logged = askLogs(logSpy);
    expect(logged).toHaveLength(1);
    expect(logged[0]?.outcome).toBe('dependency_error');
    expect(logged[0]?.error_class).toBe('database_unavailable');
    expect(logged[0]?.error).toBeUndefined();
    expect(JSON.stringify(logged[0])).not.toMatch(
      /ENOTFOUND|abcdefghijklmnopqrst|postgres/i,
    );
    logSpy.mockRestore();
  });

  it('hosted CE skip: log omits ce_n/ce_k/ce_ranked_chunk_ids; diagnostics keep them when on', async () => {
    vi.stubEnv('MECHANIC_FORCE_RRF_ONLY', '0');
    vi.stubEnv('MECHANIC_DIAGNOSTICS', '1');
    vi.stubEnv('GEMINI_API_KEY', 'test-hosted-key');
    const logSpy = vi.spyOn(console, 'log').mockImplementation(() => undefined);
    const { handleAsk } = await import('@/server/ask');
    const result = await handleAsk(REQ);
    expect(isFailure(result)).toBe(false);
    if (isFailure(result)) return;
    expect(result.diagnostics?.ce_skip_reason).toBe('hosted_ce_disabled');
    expect(result.diagnostics?.ce_n).toBe(20);
    expect(result.diagnostics?.ce_k).toBe(8);
    expect(result.diagnostics?.image_degraded).toBe(true);
    expect(result.diagnostics?.image_degrade_reason).toBe(
      'clip_query_unavailable',
    );
    const logged = askLogs(logSpy);
    expect(logged).toHaveLength(1);
    expect(logged[0]?.ce_skip_reason).toBe('hosted_ce_disabled');
    expect(logged[0]?.ce_n).toBeUndefined();
    expect(logged[0]?.ce_k).toBeUndefined();
    expect(logged[0]?.ce_ranked_chunk_ids).toBeUndefined();
    expect(logged[0]?.image_degraded).toBeUndefined();
    expect(logged[0]?.image_degrade_reason).toBeUndefined();
    logSpy.mockRestore();
  });
});
