/**
 * Cross-encoder adapter boundary (server-only).
 * Fake CE for tests; transformers.js classification uses text_pair + raw logits.
 */

import type { RrfResult, CeResult } from '@/lib/retrieval/types';

/** Degenerate when max(score) - min(score) ≤ this ε (guide Soft pin). */
export const CE_SCORE_DEGENERATE_EPS = 1e-3;

export type CrossEncoder = {
  readonly modelId: string;
  readonly runtime: string;
  scorePairs(
    query: string,
    candidates: RrfResult[],
  ): Promise<Array<{ chunk_id: string; ce_score: number }>>;
};

export type CeScoreSummary = {
  ce_score_min: number;
  ce_score_max: number;
  ce_score_mean: number;
  ce_score_variance: number;
  ce_score_degenerate: boolean;
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

/**
 * Map model logits output → one float per pair.
 * Supports Tensor { data, dims }, nested lists, or flat number[].
 * For [batch, labels] takes the first label (MS MARCO regression head = 1).
 */
export function logitsToPairScores(
  logits: unknown,
  pairCount: number,
): number[] {
  if (pairCount <= 0) return [];

  if (Array.isArray(logits) && logits.every((x) => typeof x === 'number')) {
    if (logits.length !== pairCount) {
      throw new Error(
        `logits length ${logits.length} !== pairCount ${pairCount}`,
      );
    }
    return logits.map(Number);
  }

  const tensor = logits as {
    data?: ArrayLike<number>;
    dims?: number[];
    tolist?: () => unknown;
  };

  if (tensor && typeof tensor.tolist === 'function') {
    return logitsToPairScores(tensor.tolist(), pairCount);
  }

  if (tensor?.data != null) {
    const data = Array.from(tensor.data as ArrayLike<number>).map(Number);
    const dims = tensor.dims;
    if (!dims || dims.length === 1) {
      if (data.length !== pairCount) {
        throw new Error(
          `logits data length ${data.length} !== pairCount ${pairCount}`,
        );
      }
      return data;
    }
    if (dims.length === 2) {
      const [batch, labels] = dims;
      if (batch !== pairCount) {
        throw new Error(
          `logits batch ${batch} !== pairCount ${pairCount}`,
        );
      }
      if (labels < 1) {
        throw new Error(`logits labels dim invalid: ${labels}`);
      }
      const out: number[] = [];
      for (let i = 0; i < pairCount; i++) {
        out.push(data[i * labels]!);
      }
      return out;
    }
    throw new Error(`unsupported logits dims: ${JSON.stringify(dims)}`);
  }

  if (Array.isArray(logits)) {
    // Nested: [[8.6], [-11.2]] or [[8.6, …], …]
    const out: number[] = [];
    for (const row of logits) {
      if (typeof row === 'number') {
        out.push(row);
      } else if (Array.isArray(row) && row.length >= 1) {
        out.push(Number(row[0]));
      } else {
        throw new Error('malformed nested logits row');
      }
    }
    if (out.length !== pairCount) {
      throw new Error(
        `nested logits length ${out.length} !== pairCount ${pairCount}`,
      );
    }
    return out;
  }

  throw new Error('unable to extract raw logits from model output');
}

export function summarizeCeScores(scores: number[]): CeScoreSummary | null {
  if (scores.length === 0) return null;
  let min = scores[0]!;
  let max = scores[0]!;
  let sum = 0;
  for (const s of scores) {
    if (s < min) min = s;
    if (s > max) max = s;
    sum += s;
  }
  const mean = sum / scores.length;
  let varAcc = 0;
  for (const s of scores) {
    const d = s - mean;
    varAcc += d * d;
  }
  const variance = varAcc / scores.length;
  return {
    ce_score_min: min,
    ce_score_max: max,
    ce_score_mean: mean,
    ce_score_variance: variance,
    ce_score_degenerate: max - min <= CE_SCORE_DEGENERATE_EPS,
  };
}

/**
 * Full CE-sorted shortlist IDs (≤ N) — for rank metrics.
 * Does NOT slice to K (product applyCeScores keeps that contract).
 */
export function sortScoredChunkIds(
  candidates: RrfResult[],
  scores: Array<{ chunk_id: string; ce_score: number }>,
): string[] | null {
  const byId = new Map(candidates.map((c) => [c.chunk_id, c]));
  const valid: Array<{ chunk_id: string; ce_score: number }> = [];
  for (const s of scores) {
    if (!byId.has(s.chunk_id)) continue;
    valid.push(s);
  }
  if (valid.length === 0) return null;
  return valid
    .sort((a, b) => b.ce_score - a.ce_score)
    .map((s) => s.chunk_id);
}

/** Lazy transformers.js CE — degrades if load/infer fails. */
export async function getTransformersCrossEncoder(): Promise<CrossEncoder> {
  if (transformersCe) return transformersCe;
  const modelId =
    process.env.CE_MODEL || 'Xenova/ms-marco-MiniLM-L-6-v2';
  const {
    AutoTokenizer,
    AutoModelForSequenceClassification,
    pipeline,
  } = await import('@xenova/transformers');

  // Prefer true CE: text_pair + raw logits. Cosine is degrade/alternate only —
  // never report as CE lift (runtime transformers_js:cosine).
  let mode: 'classification' | 'cosine' = 'classification';
  let tokenizer: Awaited<ReturnType<typeof AutoTokenizer.from_pretrained>> | null =
    null;
  let model: Awaited<
    ReturnType<typeof AutoModelForSequenceClassification.from_pretrained>
  > | null = null;
  let extractor: Awaited<ReturnType<typeof pipeline>> | null = null;

  try {
    tokenizer = await AutoTokenizer.from_pretrained(modelId);
    model = await AutoModelForSequenceClassification.from_pretrained(modelId);
  } catch {
    mode = 'cosine';
    extractor = await pipeline('feature-extraction', modelId);
  }

  transformersCe = {
    modelId,
    runtime: `transformers_js:${mode}`,
    async scorePairs(query, candidates) {
      const out: Array<{ chunk_id: string; ce_score: number }> = [];
      if (mode === 'classification' && tokenizer && model) {
        if (candidates.length === 0) return out;
        const queries = candidates.map(() => query);
        const passages = candidates.map((c) => c.content);
        const inputs = tokenizer(queries, {
          text_pair: passages,
          padding: true,
          truncation: true,
          max_length: 512,
        });
        const outputs = await model(inputs);
        const logits = (outputs as { logits?: unknown }).logits ?? outputs;
        const scores = logitsToPairScores(logits, candidates.length);
        for (let i = 0; i < candidates.length; i++) {
          out.push({
            chunk_id: candidates[i]!.chunk_id,
            ce_score: scores[i]!,
          });
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
        for (let i = 0; i < n; i++) dot += q[i]! * d[i]!;
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
 * (caller should degrade). Slices to topK — product citation path.
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
  pre_ce_shortlist_chunk_ids: string[];
  ce_ranked_chunk_ids: string[];
  ce_score_summary: CeScoreSummary | null;
}> {
  const shortlist = candidates.slice(0, opts.topN);
  const pre_ce_shortlist_chunk_ids = shortlist.map((c) => c.chunk_id);
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
    const fullIds = sortScoredChunkIds(shortlist, scores);
    const ce_score_summary = summarizeCeScores(
      scores
        .filter((s) => shortlist.some((c) => c.chunk_id === s.chunk_id))
        .map((s) => s.ce_score),
    );
    const ce_latency_ms = Date.now() - started;
    if (!ranked || !fullIds) {
      return {
        results: shortlist.slice(0, opts.topK),
        rerank_degraded: true,
        ce_latency_ms,
        ce_error: 'empty_or_invalid_ids',
        pre_ce_shortlist_chunk_ids,
        ce_ranked_chunk_ids: pre_ce_shortlist_chunk_ids,
        ce_score_summary,
      };
    }
    return {
      results: ranked,
      rerank_degraded: false,
      ce_latency_ms,
      pre_ce_shortlist_chunk_ids,
      ce_ranked_chunk_ids: fullIds,
      ce_score_summary,
    };
  } catch (err) {
    return {
      results: shortlist.slice(0, opts.topK),
      rerank_degraded: true,
      ce_latency_ms: Date.now() - started,
      ce_error: err instanceof Error ? err.message : String(err),
      pre_ce_shortlist_chunk_ids,
      ce_ranked_chunk_ids: pre_ce_shortlist_chunk_ids,
      ce_score_summary: null,
    };
  }
}
