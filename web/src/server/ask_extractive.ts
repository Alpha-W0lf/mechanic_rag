/**
 * Embed-fail lexical fallback (JH-46 embedding_unavailable).
 * Generator-fail extractive degrade stays in ask_degrade.ts.
 */

import { DEGRADED_ASK_BANNER } from '@/lib/ask_copy';
import { buildExtractiveCitedAnswer } from './ask_degrade';
import type { AskErrorClass } from './ask_errors';
import { logAsk } from './ask_log';
import { type AskSuccess, insufficientEvidenceResult } from './ask_outcome';
import type { Citation } from './citations';
import { lexicalSearch, type ChunkRow } from './retrievers';

export type ExtractiveArgs = {
  vehicleId: string;
  question: string;
  topN: number;
  docFamily?: string;
  diagnosticsOn: boolean;
  requestId: string;
  error_class: AskErrorClass;
  startedAt: number;
};

/**
 * Serverless degrade path: when no embedding provider is reachable,
 * skip vector/image channels and answer extractively from lexical retrieval.
 * Banner is shared honest copy (not “local Ollama only”).
 * HTTP 200 + outcome=degraded when lexical hits exist; zero hits stay
 * insufficient_evidence.
 */
export async function extractiveFallback(args: ExtractiveArgs): Promise<AskSuccess> {
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
    logAsk({
      requestId: args.requestId,
      vehicle_id: args.vehicleId,
      outcome: 'insufficient_evidence',
      error_class: args.error_class,
      lexical_count: 0,
      lexical_ms: lexicalMs,
      total_ms: Date.now() - args.startedAt,
    });
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

  logAsk({
    requestId: args.requestId,
    vehicle_id: args.vehicleId,
    outcome: 'degraded',
    error_class: args.error_class,
    lexical_count: hits.length,
    lexical_ms: lexicalMs,
    total_ms: Date.now() - args.startedAt,
  });

  return {
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
}
