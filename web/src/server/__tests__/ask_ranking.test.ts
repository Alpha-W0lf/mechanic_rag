import { afterEach, describe, expect, it, vi } from 'vitest';
import type { RrfResult } from '@/lib/retrieval/types';
import { HOSTED_CE_SKIP_REASON } from '@/server/cross_encoder';

const isGeminiServing = vi.fn(() => false);
const scorePairs = vi.fn(
  async (
    _q: string,
    candidates: Array<{ chunk_id: string }>,
  ): Promise<Array<{ chunk_id: string; ce_score: number }>> =>
    candidates.map((c, i) => ({ chunk_id: c.chunk_id, ce_score: 10 - i })),
);
const createCrossEncoderFromEnv = vi.fn(async () => ({
  modelId: 'mock-ce',
  runtime: 'transformers_js:classification',
  scorePairs,
}));

vi.mock('@/server/providers', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@/server/providers')>();
  return { ...actual, isGeminiServing };
});

vi.mock('@/server/cross_encoder', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@/server/cross_encoder')>();
  return { ...actual, createCrossEncoderFromEnv };
});

function fused(id: string, score: number): RrfResult {
  return {
    chunk_id: id,
    document_id: 'doc1',
    content: `c ${id}`,
    modality: 'fusion',
    rrf_score: score,
  };
}

const BASE = {
  question: 'torque?',
  fused: [fused('a', 0.9), fused('b', 0.5)],
  ceTopN: 20,
  ceTopK: 8,
  ceTimeoutMs: 8000,
  defaultCeModel: 'cross-encoder/ms-marco-MiniLM-L-6-v2',
};

describe('rankAfterFusion', () => {
  afterEach(() => {
    vi.clearAllMocks();
    isGeminiServing.mockReturnValue(false);
    vi.unstubAllEnvs();
  });

  it('ablation skips CE construct and sets skipped_ablation', async () => {
    const { rankAfterFusion } = await import('@/server/ask_ranking');
    const out = await rankAfterFusion({ ...BASE, forceRrfOnly: true });
    expect(createCrossEncoderFromEnv).not.toHaveBeenCalled();
    expect(scorePairs).not.toHaveBeenCalled();
    expect(out.ceModel).toBe('skipped_ablation');
    expect(out.ablationRrfOnly).toBe(true);
    expect(out.rerankDegraded).toBe(false);
    expect(out.ceSkipReason).toBeUndefined();
    expect(out.finalChunks.map((c) => c.chunk_id)).toEqual(['a', 'b']);
  });

  it('hosted Gemini skip does not construct CE', async () => {
    isGeminiServing.mockReturnValue(true);
    const { rankAfterFusion } = await import('@/server/ask_ranking');
    const out = await rankAfterFusion({ ...BASE, forceRrfOnly: false });
    expect(createCrossEncoderFromEnv).not.toHaveBeenCalled();
    expect(out.ceModel).toBe('skipped_hosted');
    expect(out.ceSkipReason).toBe(HOSTED_CE_SKIP_REASON);
    expect(out.ablationRrfOnly).toBe(false);
    expect(out.rerankDegraded).toBe(false);
  });

  it('CE unavailable without FORCE sets rerank_degraded', async () => {
    isGeminiServing.mockReturnValue(false);
    createCrossEncoderFromEnv.mockRejectedValueOnce(new Error('no ce'));
    const { rankAfterFusion } = await import('@/server/ask_ranking');
    const out = await rankAfterFusion({ ...BASE, forceRrfOnly: false });
    expect(out.rerankDegraded).toBe(true);
    expect(out.ablationRrfOnly).toBe(false);
    expect(out.ceError).toBe('ce_unavailable');
    expect(out.ceModel).toBe(BASE.defaultCeModel);
  });
});
