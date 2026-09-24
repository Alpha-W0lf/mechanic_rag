/**
 * Post-fusion ranking / CE path selection.
 * Distinct from handleAsk orchestration (ask.ts) and from CE internals
 * (cross_encoder.ts). Hosted Gemini never imports @xenova/transformers.
 */

import type { CeResult, RrfResult } from '@/lib/retrieval/types';
import {
  createCrossEncoderFromEnv,
  HOSTED_CE_SKIP_REASON,
  rerankWithDegrade,
  type CrossEncoder,
} from './cross_encoder';
import { isGeminiServing } from './providers';

/** Env-gated Guide 02 ablation: skip CE intentionally (≠ natural degrade). */
export function isForceRrfOnlyEnv(
  env: NodeJS.Dict<string> = process.env,
): boolean {
  return env.MECHANIC_FORCE_RRF_ONLY === '1';
}

/** Parse `transformers_js:classification` → `classification` (or passthrough). */
export function parseCeRuntimeMode(runtime: string | undefined): string | undefined {
  if (!runtime) return undefined;
  const idx = runtime.lastIndexOf(':');
  return idx >= 0 ? runtime.slice(idx + 1) : runtime;
}

/**
 * Diagnostic flags for post-fusion ranking.
 * Ablation must never be labeled as `rerank_degraded`.
 */
export function rankingDiagnosticFlags(input: {
  forceRrfOnly: boolean;
  ceFailedOrUnavailable: boolean;
}): { ablation_rrf_only: boolean; rerank_degraded: boolean } {
  if (input.forceRrfOnly) {
    return { ablation_rrf_only: true, rerank_degraded: false };
  }
  return {
    ablation_rrf_only: false,
    rerank_degraded: input.ceFailedOrUnavailable,
  };
}

export type PostFusionRanking = {
  finalChunks: Array<RrfResult | CeResult>;
  ablationRrfOnly: boolean;
  rerankDegraded: boolean;
  ceModel: string;
  ceRuntimeMode: string | undefined;
  ceSkipReason: string | undefined;
  ceError: string | undefined;
  ceLatencyMs: number;
  preCeShortlistChunkIds: string[] | undefined;
  ceRankedChunkIds: string[] | undefined;
  ceScoreSummary: Record<string, unknown> | undefined;
};

/**
 * Ablation → hosted skip → CE rerank-or-degrade.
 * Behavior matches the former inline block in handleAsk.
 */
export async function rankAfterFusion(input: {
  question: string;
  fused: RrfResult[];
  forceRrfOnly: boolean;
  ceTopN: number;
  ceTopK: number;
  ceTimeoutMs: number;
  defaultCeModel: string;
  ce?: CrossEncoder;
}): Promise<PostFusionRanking> {
  let finalChunks: Array<RrfResult | CeResult> = input.fused.slice(
    0,
    input.ceTopK,
  );
  const preCeShortlistIds = input.fused
    .slice(0, input.ceTopN)
    .map((c) => c.chunk_id);
  let preCeShortlistChunkIds: string[] | undefined = preCeShortlistIds;
  let ceRankedChunkIds: string[] | undefined = preCeShortlistIds;
  let ceScoreSummary: Record<string, unknown> | undefined;
  let ceLatencyMs = 0;
  let ceError: string | undefined;
  let ceSkipReason: string | undefined;
  let ceRuntimeMode: string | undefined;
  let ceModel = input.defaultCeModel;

  if (input.forceRrfOnly) {
    const flags = rankingDiagnosticFlags({
      forceRrfOnly: true,
      ceFailedOrUnavailable: false,
    });
    return {
      finalChunks,
      ablationRrfOnly: flags.ablation_rrf_only,
      rerankDegraded: flags.rerank_degraded,
      ceModel: 'skipped_ablation',
      ceRuntimeMode: undefined,
      ceSkipReason,
      ceError,
      ceLatencyMs,
      preCeShortlistChunkIds,
      ceRankedChunkIds,
      ceScoreSummary,
    };
  }

  if (isGeminiServing()) {
    const flags = rankingDiagnosticFlags({
      forceRrfOnly: false,
      ceFailedOrUnavailable: false,
    });
    return {
      finalChunks,
      ablationRrfOnly: flags.ablation_rrf_only,
      rerankDegraded: flags.rerank_degraded,
      ceModel: 'skipped_hosted',
      ceRuntimeMode: undefined,
      ceSkipReason: HOSTED_CE_SKIP_REASON,
      ceError,
      ceLatencyMs,
      preCeShortlistChunkIds,
      ceRankedChunkIds,
      ceScoreSummary,
    };
  }

  const ce =
    input.ce ?? (await createCrossEncoderFromEnv().catch(() => null));
  if (!ce) {
    const flags = rankingDiagnosticFlags({
      forceRrfOnly: false,
      ceFailedOrUnavailable: true,
    });
    return {
      finalChunks,
      ablationRrfOnly: flags.ablation_rrf_only,
      rerankDegraded: flags.rerank_degraded,
      ceModel,
      ceRuntimeMode,
      ceSkipReason,
      ceError: 'ce_unavailable',
      ceLatencyMs,
      preCeShortlistChunkIds,
      ceRankedChunkIds,
      ceScoreSummary,
    };
  }

  ceModel = ce.modelId;
  ceRuntimeMode = parseCeRuntimeMode(ce.runtime);
  const rerank = await rerankWithDegrade(input.question, input.fused, ce, {
    topN: input.ceTopN,
    topK: input.ceTopK,
    timeoutMs: input.ceTimeoutMs,
  });
  finalChunks = rerank.results;
  const flags = rankingDiagnosticFlags({
    forceRrfOnly: false,
    ceFailedOrUnavailable: rerank.rerank_degraded,
  });
  ceLatencyMs = rerank.ce_latency_ms;
  ceError = rerank.ce_error;
  preCeShortlistChunkIds = rerank.pre_ce_shortlist_chunk_ids;
  ceRankedChunkIds = rerank.ce_ranked_chunk_ids;
  if (rerank.ce_score_summary) {
    ceScoreSummary = { ...rerank.ce_score_summary };
  }
  return {
    finalChunks,
    ablationRrfOnly: flags.ablation_rrf_only,
    rerankDegraded: flags.rerank_degraded,
    ceModel,
    ceRuntimeMode,
    ceSkipReason,
    ceError,
    ceLatencyMs,
    preCeShortlistChunkIds,
    ceRankedChunkIds,
    ceScoreSummary,
  };
}
