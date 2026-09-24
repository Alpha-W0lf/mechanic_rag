/**
 * handleAsk must classify Gemini generate failures as generator, not database.
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
    embedText: (...args: unknown[]) => embedText(...args),
    generateAnswer: (...args: unknown[]) => generateAnswer(...args),
  };
});

const LEAK = /ENOTFOUND|tenant\/user|npliiuigpenkrqaewtdf|FATAL/i;

describe('handleAsk error taxonomy', () => {
  beforeEach(() => {
    vi.resetModules();
    vi.clearAllMocks();
    vi.stubEnv('MECHANIC_FORCE_RRF_ONLY', '1');
    vehicleExists.mockResolvedValue(true);
  });

  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it('Gemini 503 generate maps to generator_unavailable (not database)', async () => {
    generateAnswer.mockRejectedValue(
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
    expect(JSON.stringify(result)).not.toMatch(LEAK);
    expect(JSON.stringify(result)).not.toMatch(/database/i);
  });

  it('Gemini 429 maps to rate_limited', async () => {
    generateAnswer.mockRejectedValue(
      new GeminiError('gemini generate failed: 429', 429, 'RESOURCE_EXHAUSTED'),
    );
    const { handleAsk } = await import('@/server/ask');
    const result = await handleAsk({
      vehicle_id: 'fixture:honda-s2000-demo',
      question: 'What is the oil drain plug torque?',
    });
    expect(result).toEqual({
      error: PUBLIC_ASK_ERROR.rate_limited,
      error_class: 'rate_limited',
      status: 429,
    });
  });

  it('pooler FATAL from vehicleExists maps to database_unavailable without leak', async () => {
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
    expect(JSON.stringify(result)).not.toMatch(LEAK);
    expect(generateAnswer).not.toHaveBeenCalled();
  });
});
