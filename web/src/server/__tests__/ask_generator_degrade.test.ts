/**
 * JH-46 handleAsk: Gemini generate failure after retrieval → extractive degrade.
 */
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { RetrieverHit } from '@/lib/retrieval/types';
import { DEGRADED_ASK_BANNER } from '@/lib/ask_copy';
import { PUBLIC_ASK_ERROR } from '@/server/ask_errors';
import { GeminiError, OllamaError } from '@/server/providers';

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
    embedText: (...args: never[]) => (embedText as (...a: never[]) => unknown)(...args),
    generateAnswer: (...args: never[]) => (generateAnswer as (...a: never[]) => unknown)(...args),
  };
});

function isFailure(
  result: unknown,
): result is { error: string; status: number; error_class?: string } {
  if (!result || typeof result !== 'object') return false;
  return 'status' in result && 'error' in result;
}

describe('handleAsk generator degrade (JH-46)', () => {
  beforeEach(() => {
    vi.resetModules();
    vi.clearAllMocks();
    vi.stubEnv('MECHANIC_FORCE_RRF_ONLY', '1');
    vehicleExists.mockResolvedValue(true);
    vectorSearch.mockResolvedValue([hit('a')]);
    lexicalSearch.mockResolvedValue([hit('a')]);
    embedText.mockResolvedValue({
      embedding: [0.1, 0.2],
      model: 'gemini-embedding-001',
      dim: 2,
    });
  });

  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it('Gemini 503 after retries with chunks → HTTP-shaped 200 degraded + citations', async () => {
    generateAnswer.mockRejectedValue(
      new GeminiError('gemini generate failed: 503', 503, 'UNAVAILABLE'),
    );
    const { handleAsk } = await import('@/server/ask');
    const result = await handleAsk({
      vehicle_id: 'fixture:honda-s2000-demo',
      question: 'What is the oil drain plug torque?',
    });
    expect(isFailure(result)).toBe(false);
    if (isFailure(result)) return;
    expect(result.outcome).toBe('degraded');
    expect(result.error_class).toBe('generator_unavailable');
    expect(result.citations.length).toBeGreaterThanOrEqual(1);
    expect(result.answer).toContain(DEGRADED_ASK_BANNER);
    expect(result.answer).toContain('39 N·m');
    expect(result.answer).toContain('[1]');
    expect(result.answer).not.toMatch(/local Ollama/i);
    expect(result.citations[0]?.chunk_id).toBeTruthy();
  });

  it('Gemini 429 after retries with chunks → degraded + rate_limited', async () => {
    generateAnswer.mockRejectedValue(
      new GeminiError('gemini generate failed: 429', 429, 'RESOURCE_EXHAUSTED'),
    );
    const { handleAsk } = await import('@/server/ask');
    const result = await handleAsk({
      vehicle_id: 'fixture:honda-s2000-demo',
      question: 'What is the oil drain plug torque?',
    });
    expect(isFailure(result)).toBe(false);
    if (isFailure(result)) return;
    expect(result.outcome).toBe('degraded');
    expect(result.error_class).toBe('rate_limited');
    expect(result.citations.length).toBeGreaterThanOrEqual(1);
  });

  it('zero chunks + generator failure → error, not degraded', async () => {
    generateAnswer.mockRejectedValue(
      new GeminiError('gemini generate failed: 503', 503, 'UNAVAILABLE'),
    );
    vectorSearch.mockResolvedValue([]);
    lexicalSearch.mockResolvedValue([]);
    const { handleAsk } = await import('@/server/ask');
    const result = await handleAsk({
      vehicle_id: 'fixture:honda-s2000-demo',
      question: 'What is the oil drain plug torque?',
    });
    // Retrieval empty → existing insufficient_evidence (generate never runs).
    expect(isFailure(result)).toBe(false);
    if (isFailure(result)) return;
    expect(result.outcome).toBe('insufficient_evidence');
    expect(result.citations).toEqual([]);
    expect(result.error_class).toBeUndefined();
    expect(generateAnswer).not.toHaveBeenCalled();
  });

  it('generator error before any chunks are retrieved stays an error', async () => {
    vehicleExists.mockRejectedValue(
      new GeminiError('gemini generate failed: 503', 503, 'UNAVAILABLE'),
    );
    const { handleAsk } = await import('@/server/ask');
    const result = await handleAsk({
      vehicle_id: 'fixture:honda-s2000-demo',
      question: 'What is the oil drain plug torque?',
    });
    expect(result).toEqual({
      error: PUBLIC_ASK_ERROR.generator_unavailable,
      error_class: 'generator_unavailable',
      status: 503,
    });
  });

  it('database failure is database_unavailable, not degraded', async () => {
    const dbErr = new Error(
      '(ENOTFOUND) tenant/user postgres.npliiuigpenkrqaewtdf not found',
    );
    (dbErr as { code?: string }).code = 'ENOTFOUND';
    vehicleExists.mockRejectedValue(dbErr);
    const { handleAsk } = await import('@/server/ask');
    const result = await handleAsk({
      vehicle_id: 'fixture:honda-s2000-demo',
      question: 'What is the oil drain plug torque?',
    });
    expect(result).toEqual({
      error: PUBLIC_ASK_ERROR.database_unavailable,
      error_class: 'database_unavailable',
      status: 503,
    });
    expect(JSON.stringify(result)).not.toMatch(/degraded/i);
    expect(generateAnswer).not.toHaveBeenCalled();
  });

  it('happy path is unchanged: outcome answered, no error_class', async () => {
    generateAnswer.mockResolvedValue({
      text: 'Torque is 39 N·m [1]',
      model: 'gemma-4-26b-a4b-it',
    });
    const { handleAsk } = await import('@/server/ask');
    const result = await handleAsk({
      vehicle_id: 'fixture:honda-s2000-demo',
      question: 'What is the oil drain plug torque?',
    });
    expect(isFailure(result)).toBe(false);
    if (isFailure(result)) return;
    expect(result.outcome).toBe('answered');
    expect(result.error_class).toBeUndefined();
    expect(result.answer).toContain('Torque is 39 N·m');
    expect(result.citations.length).toBeGreaterThanOrEqual(1);
    expect(result.answer).not.toContain(DEGRADED_ASK_BANNER);
  });

  it('local Ollama generate failure stays an error (not degraded)', async () => {
    generateAnswer.mockRejectedValue(new OllamaError('generate failed: 503', 503));
    const { handleAsk } = await import('@/server/ask');
    const result = await handleAsk({
      vehicle_id: 'fixture:honda-s2000-demo',
      question: 'What is the oil drain plug torque?',
    });
    expect(result).toEqual({
      error: PUBLIC_ASK_ERROR.generator_unavailable,
      error_class: 'generator_unavailable',
      status: 503,
    });
  });

  it('embed failure with lexical hits → degraded + embedding_unavailable', async () => {
    embedText.mockRejectedValue(
      new GeminiError('gemini embed failed: 503', 503, 'UNAVAILABLE'),
    );
    const { handleAsk } = await import('@/server/ask');
    const result = await handleAsk({
      vehicle_id: 'fixture:honda-s2000-demo',
      question: 'What is the oil drain plug torque?',
    });
    expect(isFailure(result)).toBe(false);
    if (isFailure(result)) return;
    expect(result.outcome).toBe('degraded');
    expect(result.error_class).toBe('embedding_unavailable');
    expect(result.error_class).not.toBe('generator_unavailable');
    expect(result.answer).toContain(DEGRADED_ASK_BANNER);
    expect(result.answer).not.toMatch(/local Ollama/i);
    expect(result.citations.length).toBeGreaterThanOrEqual(1);
    expect(generateAnswer).not.toHaveBeenCalled();
  });

  it('embed 429 with lexical hits → degraded + rate_limited', async () => {
    embedText.mockRejectedValue(
      new GeminiError('gemini embed failed: 429', 429, 'RESOURCE_EXHAUSTED'),
    );
    const { handleAsk } = await import('@/server/ask');
    const result = await handleAsk({
      vehicle_id: 'fixture:honda-s2000-demo',
      question: 'What is the oil drain plug torque?',
    });
    expect(isFailure(result)).toBe(false);
    if (isFailure(result)) return;
    expect(result.outcome).toBe('degraded');
    expect(result.error_class).toBe('rate_limited');
  });

  it('embed failure with zero lexical hits → insufficient_evidence unchanged', async () => {
    embedText.mockRejectedValue(
      new GeminiError('gemini embed failed: 503', 503, 'UNAVAILABLE'),
    );
    lexicalSearch.mockResolvedValue([]);
    const { handleAsk } = await import('@/server/ask');
    const result = await handleAsk({
      vehicle_id: 'fixture:honda-s2000-demo',
      question: 'What is the oil drain plug torque?',
    });
    expect(isFailure(result)).toBe(false);
    if (isFailure(result)) return;
    expect(result.outcome).toBe('insufficient_evidence');
    expect(result.citations).toEqual([]);
    expect(result.error_class).toBeUndefined();
    expect(generateAnswer).not.toHaveBeenCalled();
  });

  it('local Ollama embed failure still extractive-degrades (not a 503)', async () => {
    embedText.mockRejectedValue(new OllamaError('embed failed: 503', 503));
    const { handleAsk } = await import('@/server/ask');
    const result = await handleAsk({
      vehicle_id: 'fixture:honda-s2000-demo',
      question: 'What is the oil drain plug torque?',
    });
    expect(isFailure(result)).toBe(false);
    if (isFailure(result)) return;
    expect(result.outcome).toBe('degraded');
    expect(result.error_class).toBe('embedding_unavailable');
    expect(result.citations.length).toBeGreaterThanOrEqual(1);
  });
});
