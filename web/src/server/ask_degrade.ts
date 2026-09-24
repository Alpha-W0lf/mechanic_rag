/**
 * JH-46: extractive Ask degrade when the hosted Gemini generator fails
 * after its retry budget and retrieval already returned citations.
 *
 * Local Ollama generate failures stay errors (see shouldDegradeAsk).
 * Database failures never degrade.
 */

import { DEGRADED_ASK_BANNER } from '@/lib/ask_copy';
import { classifyAskError } from './ask_errors';
import type { Citation } from './citations';
import {
  buildVisualAssets,
  garageRoot,
  type Provenance,
  type VisualAsset,
} from './page_assets';
import { GeminiError } from './providers';
import type { ChunkRow } from './retrievers';

export const EXTRACTIVE_MAX_CHUNKS = 3;
export const EXTRACTIVE_SNIPPET_CHARS = 480;

export type DegradedAskSuccess = {
  answer: string;
  citations: Citation[];
  outcome: 'degraded';
  error_class: 'generator_unavailable' | 'rate_limited';
  diagnostics: Record<string, unknown> | null;
  visual_assets: VisualAsset[];
};

function isGeminiError(err: unknown): boolean {
  return err instanceof GeminiError || (err as { name?: string })?.name === 'GeminiError';
}

export function shouldDegradeAsk(err: unknown, citationCount: number): boolean {
  if (citationCount < 1) return false;
  const cls = classifyAskError(err);
  if (cls !== 'generator_unavailable' && cls !== 'rate_limited') return false;
  // Retry-budget failures are GeminiError. Local Ollama stays an error.
  return isGeminiError(err);
}

/** Sentence-bounded prefix; never invents text beyond `content`. */
export function extractiveSnippet(
  content: string,
  maxChars = EXTRACTIVE_SNIPPET_CHARS,
): string {
  const raw = content.trim();
  if (!raw) return '';
  const cut = raw.slice(0, maxChars);
  const lastStop = Math.max(cut.lastIndexOf('. '), cut.lastIndexOf('.\n'));
  return (lastStop > 120 ? cut.slice(0, lastStop + 1) : cut).trim();
}

export function buildExtractiveCitedAnswer(
  citations: Citation[],
  rows: Map<string, ChunkRow>,
): { answer: string; citations: Citation[] } | null {
  const used: Citation[] = [];
  const parts: string[] = [];
  for (const c of citations) {
    if (used.length >= EXTRACTIVE_MAX_CHUNKS) break;
    const snippet = extractiveSnippet(rows.get(c.chunk_id)?.content ?? '');
    if (!snippet) continue;
    used.push(c);
    parts.push(`[${c.label}] ${snippet}`);
  }
  if (used.length === 0) return null;
  return {
    answer: `${DEGRADED_ASK_BANNER}\n\n${parts.join('\n\n')}`,
    citations: used,
  };
}

export function maybeDegradedAsk(input: {
  err: unknown;
  citations: Citation[];
  rows: Map<string, ChunkRow> | null;
  diagnosticsOn: boolean;
  requestId: string;
}): DegradedAskSuccess | null {
  if (!input.rows || !shouldDegradeAsk(input.err, input.citations.length)) {
    return null;
  }
  const built = buildExtractiveCitedAnswer(input.citations, input.rows);
  if (!built) return null;

  const cls = classifyAskError(input.err);
  const error_class =
    cls === 'rate_limited' ? 'rate_limited' : 'generator_unavailable';

  const provenanceByDocumentId = new Map<
    string,
    Provenance | string | null | undefined
  >();
  for (const c of built.citations) {
    if (provenanceByDocumentId.has(c.document_id)) continue;
    provenanceByDocumentId.set(
      c.document_id,
      (input.rows.get(c.chunk_id)?.provenance as
        | Provenance
        | string
        | null
        | undefined) ?? null,
    );
  }

  return {
    answer: built.answer,
    citations: built.citations,
    outcome: 'degraded',
    error_class,
    visual_assets: buildVisualAssets({
      citations: built.citations,
      provenanceByDocumentId,
      garageRootPath: garageRoot(),
    }),
    diagnostics: input.diagnosticsOn
      ? {
          request_id: input.requestId,
          mode: 'extractive_generator_degrade',
          generator_degraded: true,
          error_class,
          chunk_ids: built.citations.map((c) => c.chunk_id),
        }
      : null,
  };
}
