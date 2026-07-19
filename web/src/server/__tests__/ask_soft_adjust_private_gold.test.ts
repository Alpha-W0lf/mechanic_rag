/**
 * Guide 15 Soft Adjust — PrivateGold ask plane (unit attestation).
 * HTTP smoke optional when Compose/Next/Ollama up; CI Met = this file.
 */
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { RetrieverHit } from '@/lib/retrieval/types';

const SOFT_ADJUST_VID = 'cat:demo-synthetic-f150';
const FIXTURE_VID = 'fixture:honda-s2000-demo';

const scorePairs = vi.fn(
  async (
    _q: string,
    candidates: Array<{ chunk_id: string }>,
  ): Promise<Array<{ chunk_id: string; ce_score: number }>> =>
    candidates.map((c, i) => ({ chunk_id: c.chunk_id, ce_score: 1 - i * 0.01 })),
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
    document_id: 'synth-f150-oil-service',
    content: `content ${chunk_id}`,
    section_path: section,
    page_start: 1,
    page_end: 1,
    modality: 'vector',
    retriever_score: 0.9,
  };
}

const vehicleExists = vi.fn(async () => true);
const vectorSearch = vi.fn(async () => [
  hit('sa-oil-1', 'lubrication/oil_capacity'),
]);
const lexicalSearch = vi.fn(async () => [
  hit('sa-oil-1', 'lubrication/oil_capacity'),
]);
const loadChunksByIds = vi.fn(async (ids: string[]) => {
  const map = new Map();
  for (const id of ids) {
    map.set(id, {
      chunk_id: id,
      document_id: 'synth-f150-oil-service',
      vehicle_id: SOFT_ADJUST_VID,
      doc_family: 'service_manual',
      content:
        'Synthetic fixture — AP1 oil capacity procedure (demo only). Drain oil with vehicle level.',
      section_path: 'lubrication/oil_capacity',
      page_start: 1,
      page_end: 1,
      document_name: 'synth-soft-adjust',
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

vi.mock('@/server/ollama', () => ({
  embedText: vi.fn(async () => ({ embedding: [0.1, 0.2], model: 'nomic-embed-text' })),
  generateAnswer: vi.fn(async () => ({
    text: 'Drain oil with the vehicle level, then refill with specified viscosity [1]',
    model: 'gemma4:e2b',
  })),
  OllamaError: class OllamaError extends Error {
    name = 'OllamaError';
  },
}));

describe('Guide 15 Soft Adjust PrivateGold ask plane', () => {
  beforeEach(() => {
    vi.resetModules();
    vi.clearAllMocks();
    vi.stubEnv('MECHANIC_DIAGNOSTICS', '1');
    vi.stubEnv('SECTION_DEDUP_ENABLED', '1');
    vi.stubEnv('MECHANIC_FORCE_RRF_ONLY', '1');
    vehicleExists.mockResolvedValue(true);
    vectorSearch.mockResolvedValue([hit('sa-oil-1', 'lubrication/oil_capacity')]);
    lexicalSearch.mockResolvedValue([hit('sa-oil-1', 'lubrication/oil_capacity')]);
    loadChunksByIds.mockImplementation(async (ids: string[]) => {
      const map = new Map();
      for (const id of ids) {
        map.set(id, {
          chunk_id: id,
          document_id: 'synth-f150-oil-service',
          vehicle_id: SOFT_ADJUST_VID,
          doc_family: 'service_manual',
          content:
            'Synthetic fixture — AP1 oil capacity procedure (demo only). Drain oil with vehicle level.',
          section_path: 'lubrication/oil_capacity',
          page_start: 1,
          page_end: 1,
          document_name: 'synth-soft-adjust',
        });
      }
      return map;
    });
  });

  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it('unknown Soft Adjust vehicle_id → 404', async () => {
    vehicleExists.mockResolvedValueOnce(false);
    const { handleAsk } = await import('@/server/ask');
    const result = await handleAsk({
      vehicle_id: SOFT_ADJUST_VID,
      question: 'What is the oil capacity procedure?',
    });
    expect(result).toEqual({ error: 'unknown vehicle_id', status: 404 });
    expect(vectorSearch).not.toHaveBeenCalled();
  });

  it('Soft Adjust ask scopes retrieval to Soft Adjust vehicle_id', async () => {
    const { handleAsk } = await import('@/server/ask');
    const result = await handleAsk({
      vehicle_id: SOFT_ADJUST_VID,
      question: 'Drain oil with vehicle level — what is the oil capacity procedure?',
    });
    expect('error' in result).toBe(false);
    if ('error' in result) return;
    expect(vehicleExists).toHaveBeenCalledWith(SOFT_ADJUST_VID);
    expect(vectorSearch).toHaveBeenCalledWith(
      SOFT_ADJUST_VID,
      expect.any(Array),
      expect.any(Number),
      undefined,
    );
    expect(lexicalSearch).toHaveBeenCalledWith(
      SOFT_ADJUST_VID,
      expect.any(String),
      expect.any(Number),
      undefined,
    );
    expect(['answered', 'insufficient_evidence']).toContain(result.outcome);
  });

  it('Soft Adjust answered citations stay Soft Adjust — no fixture S2000 leak', async () => {
    const { handleAsk } = await import('@/server/ask');
    const result = await handleAsk({
      vehicle_id: SOFT_ADJUST_VID,
      question: 'Drain oil with vehicle level — what is the oil capacity procedure?',
    });
    expect('error' in result).toBe(false);
    if ('error' in result) return;
    expect(result.outcome).toBe('answered');
    expect(result.citations.length).toBeGreaterThan(0);
    for (const c of result.citations) {
      expect(c.vehicle_id).toBe(SOFT_ADJUST_VID);
      expect(c.vehicle_id).not.toBe(FIXTURE_VID);
    }
  });

  it('Soft Adjust empty retrieval → insufficient_evidence (incomplete Gold OK)', async () => {
    vectorSearch.mockResolvedValueOnce([]);
    lexicalSearch.mockResolvedValueOnce([]);
    const { handleAsk } = await import('@/server/ask');
    const result = await handleAsk({
      vehicle_id: SOFT_ADJUST_VID,
      question: 'What is the oil capacity procedure?',
    });
    expect('error' in result).toBe(false);
    if ('error' in result) return;
    expect(result.outcome).toBe('insufficient_evidence');
    expect(result.citations).toEqual([]);
  });
});
