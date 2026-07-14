import { randomUUID } from 'crypto';
import { reciprocalRankFusion } from '@/lib/retrieval/rrf';
import { sectionDedup } from '@/lib/retrieval/section_dedup';
import type { CeResult, RrfResult } from '@/lib/retrieval/types';
import {
  ASK_SYSTEM_PROMPT,
  INSUFFICIENT_EVIDENCE_ANSWER,
  assembleContext,
  filterAnswerToKnownLabels,
  type Citation,
} from './citations';
import {
  createCrossEncoderFromEnv,
  rerankWithDegrade,
  type CrossEncoder,
} from './cross_encoder';
import { embedText, generateAnswer, OllamaError } from './ollama';
import {
  lexicalSearch,
  loadChunksByIds,
  vehicleExists,
  vectorSearch,
} from './retrievers';

export type AskRequest = {
  vehicle_id: string;
  question: string;
  doc_family?: string;
};

export type AskSuccess = {
  answer: string;
  citations: Citation[];
  outcome: 'answered' | 'insufficient_evidence';
  diagnostics: Record<string, unknown> | null;
};

export type AskFailure = {
  error: string;
  status: number;
};

const MAX_QUESTION = 4000;

/** Env-gated Guide 02 ablation: skip CE intentionally (≠ natural degrade). */
export function isForceRrfOnlyEnv(
  env: NodeJS.ProcessEnv = process.env,
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

export function validateAskRequest(
  body: unknown,
): { ok: true; value: AskRequest } | { ok: false; error: string; status: number } {
  if (!body || typeof body !== 'object') {
    return { ok: false, error: 'Invalid JSON body', status: 400 };
  }
  const b = body as Record<string, unknown>;
  // Reject stub shape
  if ('query' in b && !('question' in b)) {
    return {
      ok: false,
      error: 'Use { vehicle_id, question } — stub { query } is retired',
      status: 400,
    };
  }
  const vehicle_id = typeof b.vehicle_id === 'string' ? b.vehicle_id.trim() : '';
  const question = typeof b.question === 'string' ? b.question.trim() : '';
  if (!vehicle_id) {
    return { ok: false, error: 'vehicle_id is required', status: 400 };
  }
  if (!question) {
    return { ok: false, error: 'question is required', status: 400 };
  }
  if (question.length > MAX_QUESTION) {
    return { ok: false, error: 'question too long', status: 400 };
  }
  const doc_family =
    typeof b.doc_family === 'string' ? b.doc_family.trim() : undefined;
  return { ok: true, value: { vehicle_id, question, doc_family } };
}

export async function handleAsk(
  req: AskRequest,
  opts?: { ce?: CrossEncoder },
): Promise<AskSuccess | AskFailure> {
  const requestId = randomUUID();
  const diagnosticsOn = process.env.MECHANIC_DIAGNOSTICS === '1';
  const topN = Number(process.env.RETRIEVE_TOP_N || 50);
  const rrfK = Number(process.env.RRF_K || 60);
  const ceTopN = Number(process.env.CE_TOP_N || 20);
  const ceTopK = Number(process.env.CE_TOP_K || 8);
  const ceTimeoutMs = Number(process.env.CE_TIMEOUT_MS || 8000);
  const dedupEnabled = process.env.SECTION_DEDUP_ENABLED !== '0';

  const t0 = Date.now();
  let vectorMs = 0;
  let lexicalMs = 0;
  let ceLatencyMs = 0;
  let rerankDegraded = false;
  let ablationRrfOnly = false;
  let ceError: string | undefined;
  let ceRuntimeMode: string | undefined;
  let ceModel = process.env.CE_MODEL || 'cross-encoder/ms-marco-MiniLM-L-6-v2';
  let embeddingModel = process.env.EMBEDDING_MODEL || 'nomic-embed-text';
  let generatorModel = process.env.OLLAMA_MODEL || 'gemma4:e2b';
  const forceRrfOnly = isForceRrfOnlyEnv();

  try {
    const exists = await vehicleExists(req.vehicle_id);
    if (!exists) {
      return { error: 'unknown vehicle_id', status: 404 };
    }

    const embStarted = Date.now();
    const { embedding, model: embModel } = await embedText(req.question);
    embeddingModel = embModel;
    const embedMs = Date.now() - embStarted;

    const vStarted = Date.now();
    const vector = await vectorSearch(
      req.vehicle_id,
      embedding,
      topN,
      req.doc_family,
    );
    vectorMs = Date.now() - vStarted;

    const lStarted = Date.now();
    const lexical = await lexicalSearch(
      req.vehicle_id,
      req.question,
      topN,
      req.doc_family,
    );
    lexicalMs = Date.now() - lStarted;

    let fused = reciprocalRankFusion(vector, lexical, rrfK, topN);
    const rrfSize = fused.length;
    let dedupDrops = 0;
    if (dedupEnabled && fused.length > 0) {
      const before = fused.length;
      fused = sectionDedup(fused, 0.4, Math.max(ceTopN, ceTopK));
      dedupDrops = Math.max(0, before - fused.length);
    }

    if (fused.length === 0) {
      logAsk({
        requestId,
        vehicle_id: req.vehicle_id,
        vector_count: vector.length,
        lexical_count: lexical.length,
        vector_ms: vectorMs,
        lexical_ms: lexicalMs,
        embed_ms: embedMs,
        rrf_size: rrfSize,
        dedup_drops: dedupDrops,
        ce_n: ceTopN,
        ce_k: ceTopK,
        ce_latency_ms: 0,
        rerank_degraded: false,
        chunk_ids: [],
        embedding_model: embeddingModel,
        generator_model: generatorModel,
        ce_model: ceModel,
        outcome: 'insufficient_evidence',
        total_ms: Date.now() - t0,
      });
      return {
        answer: INSUFFICIENT_EVIDENCE_ANSWER,
        citations: [],
        outcome: 'insufficient_evidence',
        diagnostics: diagnosticsOn
          ? {
              request_id: requestId,
              vector_count: vector.length,
              lexical_count: lexical.length,
              rrf_size: rrfSize,
              dedup_drops: dedupDrops,
              rerank_degraded: false,
              ablation_rrf_only: forceRrfOnly,
            }
          : null,
      };
    }

    // Ablation: intentional RRF(+dedup)-only — distinct from natural CE degrade.
    let finalChunks: Array<RrfResult | CeResult> = fused.slice(0, ceTopK);
    if (forceRrfOnly) {
      const flags = rankingDiagnosticFlags({
        forceRrfOnly: true,
        ceFailedOrUnavailable: false,
      });
      ablationRrfOnly = flags.ablation_rrf_only;
      rerankDegraded = flags.rerank_degraded;
      ceModel = 'skipped_ablation';
      ceRuntimeMode = undefined;
      // Do not create/call CE when ablating (opts.ce still available for tests
      // when FORCE is unset).
    } else {
      const ce = opts?.ce ?? (await createCrossEncoderFromEnv().catch(() => null));
      if (!ce) {
        const flags = rankingDiagnosticFlags({
          forceRrfOnly: false,
          ceFailedOrUnavailable: true,
        });
        ablationRrfOnly = flags.ablation_rrf_only;
        rerankDegraded = flags.rerank_degraded;
        ceError = 'ce_unavailable';
      } else {
        ceModel = ce.modelId;
        ceRuntimeMode = parseCeRuntimeMode(ce.runtime);
        const rerank = await rerankWithDegrade(req.question, fused, ce, {
          topN: ceTopN,
          topK: ceTopK,
          timeoutMs: ceTimeoutMs,
        });
        finalChunks = rerank.results;
        const flags = rankingDiagnosticFlags({
          forceRrfOnly: false,
          ceFailedOrUnavailable: rerank.rerank_degraded,
        });
        ablationRrfOnly = flags.ablation_rrf_only;
        rerankDegraded = flags.rerank_degraded;
        ceLatencyMs = rerank.ce_latency_ms;
        ceError = rerank.ce_error;
      }
    }

    const ids = finalChunks.map((c) => c.chunk_id);
    const rows = await loadChunksByIds(ids);
    const { labeledContext, citations, usedChunkIds } = assembleContext(
      finalChunks,
      rows,
    );

    if (citations.length === 0) {
      return {
        answer: INSUFFICIENT_EVIDENCE_ANSWER,
        citations: [],
        outcome: 'insufficient_evidence',
        diagnostics: diagnosticsOn ? { request_id: requestId } : null,
      };
    }

    const { text, model } = await generateAnswer(
      ASK_SYSTEM_PROMPT,
      `Vehicle: ${req.vehicle_id}\nQuestion: ${req.question}\n\nContext:\n${labeledContext}`,
    );
    generatorModel = model;
    const filtered = filterAnswerToKnownLabels(text, citations);

    logAsk({
      requestId,
      vehicle_id: req.vehicle_id,
      vector_count: vector.length,
      lexical_count: lexical.length,
      vector_ms: vectorMs,
      lexical_ms: lexicalMs,
      embed_ms: embedMs,
      rrf_size: rrfSize,
      dedup_drops: dedupDrops,
      ce_n: ceTopN,
      ce_k: ceTopK,
      ce_latency_ms: ceLatencyMs,
      rerank_degraded: rerankDegraded,
      ablation_rrf_only: ablationRrfOnly,
      ce_error: ceError,
      ce_runtime_mode: ceRuntimeMode,
      chunk_ids: usedChunkIds,
      embedding_model: embeddingModel,
      generator_model: generatorModel,
      ce_model: ceModel,
      outcome: 'answered',
      total_ms: Date.now() - t0,
    });

    return {
      answer: filtered.answer,
      citations: filtered.citations,
      outcome: 'answered',
      diagnostics: diagnosticsOn
        ? {
            request_id: requestId,
            vector_count: vector.length,
            lexical_count: lexical.length,
            vector_ms: vectorMs,
            lexical_ms: lexicalMs,
            rrf_size: rrfSize,
            dedup_drops: dedupDrops,
            ce_n: ceTopN,
            ce_k: ceTopK,
            ce_latency_ms: ceLatencyMs,
            rerank_degraded: rerankDegraded,
            ablation_rrf_only: ablationRrfOnly,
            ce_error: ceError,
            ce_runtime_mode: ceRuntimeMode,
            chunk_ids: usedChunkIds,
            embedding_model: embeddingModel,
            generator_model: generatorModel,
            ce_model: ceModel,
          }
        : null,
    };
  } catch (err) {
    if (err instanceof OllamaError || (err as { name?: string })?.name === 'AbortError') {
      logAsk({
        requestId,
        vehicle_id: req.vehicle_id,
        outcome: 'dependency_error',
        error: err instanceof Error ? err.message : String(err),
        total_ms: Date.now() - t0,
      });
      return { error: 'Upstream dependency failure (Ollama)', status: 503 };
    }
    // Postgres / unexpected
    logAsk({
      requestId,
      vehicle_id: req.vehicle_id,
      outcome: 'dependency_error',
      error: err instanceof Error ? err.message : String(err),
      total_ms: Date.now() - t0,
    });
    return { error: 'Upstream dependency failure (database or internal)', status: 503 };
  }
}

function logAsk(fields: Record<string, unknown>) {
  // Structured ask log — never private chunk bodies.
  console.log(JSON.stringify({ event: 'ask', ...fields }));
}
