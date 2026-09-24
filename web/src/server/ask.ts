import { randomUUID } from 'crypto';
import { reciprocalRankFusionMany } from '@/lib/retrieval/rrf';
import { sectionDedup } from '@/lib/retrieval/section_dedup';
import type { CeResult, RrfResult } from '@/lib/retrieval/types';
import {
  ASK_SYSTEM_PROMPT,
  assembleContext,
  filterAnswerToKnownLabels,
  type Citation,
} from './citations';
import {
  createCrossEncoderFromEnv,
  HOSTED_CE_SKIP_REASON,
  rerankWithDegrade,
  type CrossEncoder,
} from './cross_encoder';
import { DEGRADED_ASK_BANNER } from '@/lib/ask_copy';
import {
  errorClassForEmbedFailure,
  toPublicAskFailure,
  type AskErrorClass,
} from './ask_errors';
import { maybeDegradedAsk, buildExtractiveCitedAnswer } from './ask_degrade';
import { embedText, generateAnswer, isGeminiServing } from './providers';
import {
  lexicalSearch,
  loadChunksByIds,
  vehicleExists,
  vectorSearch,
  type ChunkRow,
} from './retrievers';
import { retrieveImageChannel } from './ask_image_channel';
import { insufficientEvidenceResult } from './ask_outcome';
import { type AskRequest } from './ask_request';
import { maybeAssistWithVlm, type VlmResult } from './ask_vlm';
import {
  buildVisualAssets,
  garageRoot,
  type Provenance,
  type VisualAsset,
} from './page_assets';

export type { AskRequest } from './ask_request';
export { validateAskRequest } from './ask_request';

export type AskSuccess = {
  answer: string;
  citations: Citation[];
  outcome: 'answered' | 'insufficient_evidence' | 'degraded';
  diagnostics: Record<string, unknown> | null;
  visual_assets: VisualAsset[];
  /** Present when outcome is `degraded` — the generator failure class. */
  error_class?: AskErrorClass;
};

export type AskFailure = {
  error: string;
  status: number;
  error_class?: AskErrorClass;
};

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
  let ceSkipReason: string | undefined;
  let ceRuntimeMode: string | undefined;
  let ceModel = process.env.CE_MODEL || 'cross-encoder/ms-marco-MiniLM-L-6-v2';
  let embeddingModel = process.env.EMBEDDING_MODEL || 'nomic-embed-text';
  let generatorModel = process.env.OLLAMA_MODEL || 'gemma4:e2b';
  const forceRrfOnly = isForceRrfOnlyEnv();
  let retrievedCitations: Citation[] = [];
  let retrievedRows: Map<string, ChunkRow> | null = null;

  try {
    const exists = await vehicleExists(req.vehicle_id);
    if (!exists) {
      return { error: 'unknown vehicle_id', status: 404 };
    }

    let embedding: number[] = [];
    let embedMs = 0;
    try {
      const embStarted = Date.now();
      const emb = await embedText(req.question);
      embedding = emb.embedding;
      embeddingModel = emb.model;
      embedMs = Date.now() - embStarted;
    } catch (embedErr) {
      // Embedding provider unreachable (hosted Gemini quota / local Ollama
      // down). Degrade to lexical-only extractive answers instead of 503.
      const embedClass = errorClassForEmbedFailure(embedErr);
      logAsk({
        requestId,
        vehicle_id: req.vehicle_id,
        outcome: 'extractive_fallback',
        error_class: embedClass,
        reason: embedErr instanceof Error ? embedErr.message : String(embedErr),
      });
      return await extractiveFallback({
        vehicleId: req.vehicle_id,
        question: req.question,
        topN,
        docFamily: req.doc_family,
        diagnosticsOn,
        requestId,
        error_class: embedClass,
      });
    }

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

    const imageCh = await retrieveImageChannel({
      vehicleId: req.vehicle_id,
      question: req.question,
      topN,
      docFamily: req.doc_family,
    });
    const image = imageCh.hits;
    const imageMs = imageCh.ms;

    let fused = reciprocalRankFusionMany([vector, lexical, image], rrfK, topN);
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
        image_count: image.length,
        vector_ms: vectorMs,
        lexical_ms: lexicalMs,
        image_ms: imageMs,
        image_degraded: imageCh.degraded,
        image_degrade_reason: imageCh.reason,
        embed_ms: embedMs,
        rrf_size: rrfSize,
        dedup_drops: dedupDrops,
        outcome: 'insufficient_evidence',
        total_ms: Date.now() - t0,
      });
      return insufficientEvidenceResult({
        diagnosticsOn,
        requestId,
        vectorCount: vector.length,
        lexicalCount: lexical.length,
        imageCount: image.length,
        rrfSize,
        dedupDrops,
        forceRrfOnly,
        imageDegraded: imageCh.degraded,
        imageReason: imageCh.reason,
      });
    }

    // Ablation: intentional RRF(+dedup)-only — distinct from natural CE degrade
    // and from hosted Gemini CE skip (never import @xenova/transformers).
    let finalChunks: Array<RrfResult | CeResult> = fused.slice(0, ceTopK);
    const preCeShortlistIds = fused.slice(0, ceTopN).map((c) => c.chunk_id);
    let preCeShortlistChunkIds: string[] | undefined = preCeShortlistIds;
    let ceRankedChunkIds: string[] | undefined = preCeShortlistIds;
    let ceScoreSummary: Record<string, unknown> | undefined;
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
      // when FORCE is unset). Rank metrics use RRF shortlist order on both arms.
    } else if (isGeminiServing()) {
      const flags = rankingDiagnosticFlags({
        forceRrfOnly: false,
        ceFailedOrUnavailable: false,
      });
      ablationRrfOnly = flags.ablation_rrf_only;
      rerankDegraded = flags.rerank_degraded;
      ceModel = 'skipped_hosted';
      ceRuntimeMode = undefined;
      ceSkipReason = HOSTED_CE_SKIP_REASON;
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
        preCeShortlistChunkIds = rerank.pre_ce_shortlist_chunk_ids;
        ceRankedChunkIds = rerank.ce_ranked_chunk_ids;
        if (rerank.ce_score_summary) {
          ceScoreSummary = { ...rerank.ce_score_summary };
        }
      }
    }

    const ids = finalChunks.map((c) => c.chunk_id);
    const rows = await loadChunksByIds(ids);
    const { labeledContext, citations, usedChunkIds } = assembleContext(
      finalChunks,
      rows,
    );
    retrievedCitations = citations;
    retrievedRows = rows;

    if (citations.length === 0) {
      return insufficientEvidenceResult({
        diagnosticsOn,
        requestId,
        minimal: true,
      });
    }

    const citedTexts = usedChunkIds
      .map((id) => rows.get(id)?.content || '')
      .filter(Boolean);
    let vlm: VlmResult = {
      invoked: false,
      notes: null,
      degraded: false,
      reason: 'vlm_disabled',
    };
    try {
      vlm = await maybeAssistWithVlm({
        question: req.question,
        vehicleId: req.vehicle_id,
        citations,
        citedTexts,
        diagramAssist: req.diagram_assist === true,
      });
    } catch {
      // Business rule: VLM must never take down text ask.
      vlm = {
        invoked: true,
        notes: null,
        degraded: true,
        reason: 'vlm_internal_error',
      };
    }
    const vlmBlock =
      vlm.notes && vlm.notes.trim()
        ? `\n\nDiagram assist (layout only; specs must come from citations):\n${vlm.notes.trim()}\n`
        : '';

    const { text, model } = await generateAnswer(
      ASK_SYSTEM_PROMPT,
      `Vehicle: ${req.vehicle_id}\nQuestion: ${req.question}\n\nContext:\n${labeledContext}${vlmBlock}`,
    );
    generatorModel = model;
    const filtered = filterAnswerToKnownLabels(text, citations);

    const provenanceByDocumentId = new Map<
      string,
      Provenance | string | null | undefined
    >();
    for (const c of filtered.citations) {
      if (provenanceByDocumentId.has(c.document_id)) continue;
      const row = rows.get(c.chunk_id);
      provenanceByDocumentId.set(
        c.document_id,
        (row?.provenance as Provenance | string | null | undefined) ?? null,
      );
    }
    const visual_assets = buildVisualAssets({
      citations: filtered.citations,
      provenanceByDocumentId,
      garageRootPath: garageRoot(),
    });

    const diag = {
      request_id: requestId,
      vector_count: vector.length,
      lexical_count: lexical.length,
      image_count: image.length,
      vector_ms: vectorMs,
      lexical_ms: lexicalMs,
      image_ms: imageMs,
      image_degraded: imageCh.degraded,
      image_degrade_reason: imageCh.reason,
      image_model: imageCh.model,
      embed_ms: embedMs,
      rrf_size: rrfSize,
      dedup_drops: dedupDrops,
      ce_n: ceTopN,
      ce_k: ceTopK,
      ce_latency_ms: ceLatencyMs,
      rerank_degraded: rerankDegraded,
      ablation_rrf_only: ablationRrfOnly,
      ce_error: ceError,
      ce_skip_reason: ceSkipReason,
      ce_runtime_mode: ceRuntimeMode,
      chunk_ids: usedChunkIds,
      pre_ce_shortlist_chunk_ids: preCeShortlistChunkIds,
      ce_ranked_chunk_ids: ceRankedChunkIds,
      ...(ceScoreSummary ?? {}),
      embedding_model: embeddingModel,
      generator_model: generatorModel,
      ce_model: ceModel,
      visual_asset_count: visual_assets.length,
      vlm_invoked: vlm.invoked,
      vlm_degraded: vlm.degraded,
      vlm_degrade_reason: vlm.reason,
      vlm_model: vlm.model,
      vlm_ms: vlm.ms,
      vlm_pages: vlm.pages,
    };
    logAsk({
      requestId,
      vehicle_id: req.vehicle_id,
      ...diag,
      outcome: 'answered',
      total_ms: Date.now() - t0,
    });

    return {
      answer: filtered.answer,
      citations: filtered.citations,
      outcome: 'answered',
      visual_assets,
      diagnostics: diagnosticsOn ? diag : null,
    };
  } catch (err) {
    const degraded = maybeDegradedAsk({
      err,
      citations: retrievedCitations,
      rows: retrievedRows,
      diagnosticsOn,
      requestId,
    });
    if (degraded) {
      logAsk({
        requestId,
        vehicle_id: req.vehicle_id,
        outcome: 'degraded',
        error_class: degraded.error_class,
        citation_count: degraded.citations.length,
        error: err instanceof Error ? err.message : String(err),
        total_ms: Date.now() - t0,
      });
      return degraded;
    }
    const failure = toPublicAskFailure(err);
    logAsk({
      requestId,
      vehicle_id: req.vehicle_id,
      outcome: 'dependency_error',
      error: err instanceof Error ? err.message : String(err),
      error_class: failure.error_class,
      total_ms: Date.now() - t0,
    });
    return failure;
  }
}

type ExtractiveArgs = {
  vehicleId: string;
  question: string;
  topN: number;
  docFamily?: string;
  diagnosticsOn: boolean;
  requestId: string;
  error_class: AskErrorClass;
};

/**
 * Serverless degrade path: when no embedding provider is reachable,
 * skip vector/image channels and answer extractively from lexical retrieval.
 * Banner is shared honest copy (not “local Ollama only”).
 * HTTP 200 + outcome=degraded when lexical hits exist; zero hits stay
 * insufficient_evidence.
 */
export async function extractiveFallback(args: ExtractiveArgs) {
  const lStarted = Date.now();
  let hits = await lexicalSearch(
    args.vehicleId,
    args.question,
    args.topN,
    args.docFamily,
  );
  // Recall tier: AND-match often misses multi-word questions; retry OR.
  let matchTier: 'and' | 'or' = 'and';
  if (hits.length === 0) {
    hits = await lexicalSearch(
      args.vehicleId,
      args.question,
      args.topN,
      args.docFamily,
      'or',
    );
    matchTier = 'or';
  }
  const lexicalMs = Date.now() - lStarted;

  if (hits.length === 0) {
    return insufficientEvidenceResult({
      diagnosticsOn: args.diagnosticsOn,
      requestId: args.requestId,
      vectorCount: 0,
      lexicalCount: 0,
    });
  }

  const citations: Citation[] = hits.slice(0, 3).map((h, i) => ({
    label: String(i + 1),
    chunk_id: h.chunk_id,
    vehicle_id: h.vehicle_id ?? args.vehicleId,
    doc_family: h.doc_family ?? '',
    document_id: h.document_id,
    section_path: h.section_path ?? null,
    page_start: h.page_start ?? null,
    page_end: h.page_end ?? null,
  }));
  const rows = new Map<string, ChunkRow>();
  for (const h of hits.slice(0, 3)) {
    rows.set(h.chunk_id, {
      chunk_id: h.chunk_id,
      document_id: h.document_id,
      vehicle_id: h.vehicle_id ?? args.vehicleId,
      doc_family: h.doc_family ?? '',
      content: h.content,
      section_path: h.section_path ?? null,
      page_start: h.page_start ?? null,
      page_end: h.page_end ?? null,
      document_name: h.document_name ?? null,
      provenance: null,
    });
  }
  const built = buildExtractiveCitedAnswer(citations, rows);
  const answer = built?.answer ?? DEGRADED_ASK_BANNER;
  const usedCitations = built?.citations ?? citations;

  if (args.diagnosticsOn) {
    logAsk({
      requestId: args.requestId,
      vehicle_id: args.vehicleId,
      outcome: 'degraded',
      error_class: args.error_class,
      lexical_count: hits.length,
      lexical_ms: lexicalMs,
    });
  }

  const result: AskSuccess = {
    answer,
    citations: usedCitations,
    outcome: 'degraded',
    error_class: args.error_class,
    visual_assets: [],
    diagnostics: args.diagnosticsOn
      ? {
          request_id: args.requestId,
          mode: 'extractive_lexical_fallback',
          error_class: args.error_class,
          match_tier: matchTier,
          lexical_count: hits.length,
          lexical_ms: lexicalMs,
        }
      : null,
  };
  return result;
}

function logAsk(fields: Record<string, unknown>) {
  // Structured ask log — never private chunk bodies.
  console.log(JSON.stringify({ event: 'ask', ...fields }));
}
