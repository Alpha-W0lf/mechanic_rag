/**
 * Cross-encoder adapter boundary (server-only).
 * Fake CE for tests; transformers.js candidate for local MiniLM.
 */

import type { RrfResult, CeResult } from '@/lib/retrieval/types';

export type CrossEncoder = {
  readonly modelId: string;
  readonly runtime: string;
  scorePairs(
    query: string,
    candidates: RrfResult[],
  ): Promise<Array<{ chunk_id: string; ce_score: number }>>;
};

export class FakeCrossEncoder implements CrossEncoder {
  readonly modelId = 'fake-ce';
  readonly runtime = 'fake';

  constructor(
    private readonly mode: 'success' | 'empty' | 'invalid' | 'throw' = 'success',
    private readonly delayMs = 0,
  ) {}

  async scorePairs(
    _query: string,
    candidates: RrfResult[],
  ): Promise<Array<{ chunk_id: string; ce_score: number }>> {
    if (this.delayMs > 0) {
      await new Promise((r) => setTimeout(r, this.delayMs));
    }
    if (this.mode === 'throw') {
      throw new Error('fake CE failure');
    }
    if (this.mode === 'empty') {
      return [];
    }
    if (this.mode === 'invalid') {
      return [{ chunk_id: 'does-not-exist', ce_score: 99 }];
    }
    // Reverse RRF order so tests can observe CE reordering
    return candidates.map((c, i) => ({
      chunk_id: c.chunk_id,
      ce_score: i,
    }));
  }
}

let transformersCe: CrossEncoder | null = null;

/** Lazy transformers.js CE — degrades if load/infer fails. */
export async function getTransformersCrossEncoder(): Promise<CrossEncoder> {
  if (transformersCe) return transformersCe;
  // Architecture candidate: cross-encoder/ms-marco-MiniLM-L-6-v2
  // transformers.js uses the Xenova ONNX port when available.
  const modelId =
    process.env.CE_MODEL || 'Xenova/ms-marco-MiniLM-L-6-v2';
  const { pipeline } = await import('@xenova/transformers');

  // Prefer sequence-classification (true CE logits). If the port only exposes
  // feature-extraction, score (query, chunk) via cosine of pooled vectors —
  // still pair-conditioned at the adapter boundary, but not frozen as CE lift.
  let mode: 'classification' | 'cosine' = 'classification';
  let ranker: Awaited<ReturnType<typeof pipeline>> | null = null;
  let extractor: Awaited<ReturnType<typeof pipeline>> | null = null;
  try {
    ranker = await pipeline('text-classification', modelId);
  } catch {
    mode = 'cosine';
    extractor = await pipeline('feature-extraction', modelId);
  }

  transformersCe = {
    modelId,
    runtime: `transformers_js:${mode}`,
    async scorePairs(query, candidates) {
      const out: Array<{ chunk_id: string; ce_score: number }> = [];
      if (mode === 'classification' && ranker) {
        for (const c of candidates) {
          const result = await ranker(`${query} [SEP] ${c.content}`, {
            topk: 1,
          });
          const score = Array.isArray(result)
            ? Number((result[0] as { score?: number }).score ?? 0)
            : Number((result as { score?: number }).score ?? 0);
          out.push({ chunk_id: c.chunk_id, ce_score: score });
        }
        return out;
      }
      if (!extractor) {
        throw new Error('CE extractor unavailable');
      }
      const qTensor = await extractor(query, {
        pooling: 'mean',
        normalize: true,
      });
      const q = Array.from(qTensor.data as Float32Array);
      for (const c of candidates) {
        const dTensor = await extractor(c.content, {
          pooling: 'mean',
          normalize: true,
        });
        const d = Array.from(dTensor.data as Float32Array);
        let dot = 0;
        const n = Math.min(q.length, d.length);
        for (let i = 0; i < n; i++) dot += q[i] * d[i];
        out.push({ chunk_id: c.chunk_id, ce_score: dot });
      }
      return out;
    },
  };
  return transformersCe;
}

export function createCrossEncoderFromEnv(): Promise<CrossEncoder> {
  const runtime = (process.env.CE_RUNTIME || 'transformers_js').toLowerCase();
  if (runtime === 'fake') {
    return Promise.resolve(new FakeCrossEncoder('success'));
  }
  return getTransformersCrossEncoder();
}

/**
 * Apply CE scores; ignore unknown IDs. Returns null if no valid scores
 * (caller should degrade).
 */
export function applyCeScores(
  candidates: RrfResult[],
  scores: Array<{ chunk_id: string; ce_score: number }>,
  topK: number,
): CeResult[] | null {
  const byId = new Map(candidates.map((c) => [c.chunk_id, c]));
  const valid: CeResult[] = [];
  for (const s of scores) {
    const base = byId.get(s.chunk_id);
    if (!base) continue;
    valid.push({ ...base, ce_score: s.ce_score });
  }
  if (valid.length === 0) return null;
  return valid.sort((a, b) => b.ce_score - a.ce_score).slice(0, topK);
}

export async function rerankWithDegrade(
  query: string,
  candidates: RrfResult[],
  ce: CrossEncoder,
  opts: { topN: number; topK: number; timeoutMs: number },
): Promise<{
  results: Array<RrfResult | CeResult>;
  rerank_degraded: boolean;
  ce_latency_ms: number;
  ce_error?: string;
}> {
  const shortlist = candidates.slice(0, opts.topN);
  const started = Date.now();
  try {
    const scores = await Promise.race([
      ce.scorePairs(query, shortlist),
      new Promise<never>((_, reject) =>
        setTimeout(
          () => reject(new Error('CE timeout')),
          opts.timeoutMs,
        ),
      ),
    ]);
    const ranked = applyCeScores(shortlist, scores, opts.topK);
    const ce_latency_ms = Date.now() - started;
    if (!ranked) {
      return {
        results: shortlist.slice(0, opts.topK),
        rerank_degraded: true,
        ce_latency_ms,
        ce_error: 'empty_or_invalid_ids',
      };
    }
    return { results: ranked, rerank_degraded: false, ce_latency_ms };
  } catch (err) {
    return {
      results: shortlist.slice(0, opts.topK),
      rerank_degraded: true,
      ce_latency_ms: Date.now() - started,
      ce_error: err instanceof Error ? err.message : String(err),
    };
  }
}
