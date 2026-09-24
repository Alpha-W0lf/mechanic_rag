import { randomUUID } from 'crypto';
import { reciprocalRankFusionMany } from '@/lib/retrieval/rrf';
import { sectionDedup } from '@/lib/retrieval/section_dedup';
import {
  ASK_SYSTEM_PROMPT,
  assembleContext,
  filterAnswerToKnownLabels,
  type Citation,
} from './citations';
import type { CrossEncoder } from './cross_encoder';
import { errorClassForEmbedFailure, toPublicAskFailure } from './ask_errors';
import { maybeDegradedAsk } from './ask_degrade';
import { extractiveFallback } from './ask_extractive';
import { logAsk, readGenAttempts } from './ask_log';
import { embedText, generateAnswer } from './providers';
import {
  lexicalSearch,
  loadChunksByIds,
  vehicleExists,
  vectorSearch,
  type ChunkRow,
} from './retrievers';
import { retrieveImageChannel } from './ask_image_channel';
import {
  type AskFailure,
  type AskSuccess,
  insufficientEvidenceResult,
} from './ask_outcome';
import { type AskRequest } from './ask_request';
import { isForceRrfOnlyEnv, rankAfterFusion } from './ask_ranking';
import { maybeAssistWithVlm, type VlmResult } from './ask_vlm';
import {
  buildVisualAssets,
  garageRoot,
  type Provenance,
} from './page_assets';

export type { AskRequest } from './ask_request';
export { validateAskRequest } from './ask_request';
export type { AskSuccess, AskFailure } from './ask_outcome';
export { extractiveFallback } from './ask_extractive';
export {
  isForceRrfOnlyEnv,
  parseCeRuntimeMode,
  rankingDiagnosticFlags,
} from './ask_ranking';

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
  let embeddingModel = process.env.EMBEDDING_MODEL || 'nomic-embed-text';
  let generatorModel = process.env.OLLAMA_MODEL || 'gemma4:e2b';
  const forceRrfOnly = isForceRrfOnlyEnv();
  let retrievedCitations: Citation[] = [];
  let retrievedRows: Map<string, ChunkRow> | null = null;
  let genMs: number | undefined;
  let genAttempts: number | undefined;
  let genStarted = 0;

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
      return await extractiveFallback({
        vehicleId: req.vehicle_id,
        question: req.question,
        topN,
        docFamily: req.doc_family,
        diagnosticsOn,
        requestId,
        error_class: embedClass,
        startedAt: t0,
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
    const ranked = await rankAfterFusion({
      question: req.question,
      fused,
      forceRrfOnly,
      ceTopN,
      ceTopK,
      ceTimeoutMs,
      defaultCeModel:
        process.env.CE_MODEL || 'cross-encoder/ms-marco-MiniLM-L-6-v2',
      ce: opts?.ce,
    });
    const {
      finalChunks,
      ablationRrfOnly,
      rerankDegraded,
      ceModel,
      ceRuntimeMode,
      ceSkipReason,
      ceError,
      ceLatencyMs,
      preCeShortlistChunkIds,
      ceRankedChunkIds,
      ceScoreSummary,
    } = ranked;

    const ids = finalChunks.map((c) => c.chunk_id);
    const rows = await loadChunksByIds(ids);
    const { labeledContext, citations, usedChunkIds } = assembleContext(
      finalChunks,
      rows,
    );
    retrievedCitations = citations;
    retrievedRows = rows;

    if (citations.length === 0) {
      logAsk({
        requestId,
        vehicle_id: req.vehicle_id,
        vector_count: vector.length,
        lexical_count: lexical.length,
        image_count: image.length,
        outcome: 'insufficient_evidence',
        total_ms: Date.now() - t0,
      });
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

    genStarted = Date.now();
    const generated = await generateAnswer(
      ASK_SYSTEM_PROMPT,
      `Vehicle: ${req.vehicle_id}\nQuestion: ${req.question}\n\nContext:\n${labeledContext}${vlmBlock}`,
    );
    genMs = Date.now() - genStarted;
    genAttempts =
      typeof generated.attempts === 'number' ? generated.attempts : 1;
    const { text, model } = generated;
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
      gen_attempts: genAttempts,
      gen_ms: genMs,
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
    if (genStarted > 0) {
      genMs = Date.now() - genStarted;
      genAttempts = readGenAttempts(err) ?? 1;
    }
    if (degraded) {
      logAsk({
        requestId,
        vehicle_id: req.vehicle_id,
        outcome: 'degraded',
        error_class: degraded.error_class,
        citation_count: degraded.citations.length,
        gen_attempts: genAttempts,
        gen_ms: genMs,
        total_ms: Date.now() - t0,
      });
      return degraded;
    }
    const failure = toPublicAskFailure(err);
    logAsk({
      requestId,
      vehicle_id: req.vehicle_id,
      outcome: 'dependency_error',
      error_class: failure.error_class,
      gen_attempts: genAttempts,
      gen_ms: genMs,
      total_ms: Date.now() - t0,
    });
    return failure;
  }
}
