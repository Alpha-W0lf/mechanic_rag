import type { CeResult, RrfResult } from '@/lib/retrieval/types';
import type { ChunkRow } from './retrievers';

export type Citation = {
  label: string;
  chunk_id: string;
  vehicle_id: string;
  doc_family: string;
  document_id: string;
  section_path: string | null;
  page_start: number | null;
  page_end: number | null;
};

const MAX_CONTEXT_CHARS = 12_000;

export function assembleContext(
  chunks: Array<RrfResult | CeResult>,
  rows: Map<string, ChunkRow>,
): { labeledContext: string; citations: Citation[]; usedChunkIds: string[] } {
  const citations: Citation[] = [];
  const parts: string[] = [];
  const usedChunkIds: string[] = [];
  let total = 0;
  let label = 1;

  for (const c of chunks) {
    const row = rows.get(c.chunk_id);
    if (!row) continue;
    const block = `[${label}] ${row.content}`;
    if (total + block.length > MAX_CONTEXT_CHARS && citations.length > 0) {
      break;
    }
    parts.push(block);
    total += block.length;
    usedChunkIds.push(row.chunk_id);
    citations.push({
      label: String(label),
      chunk_id: row.chunk_id,
      vehicle_id: row.vehicle_id,
      doc_family: row.doc_family,
      document_id: row.document_id,
      section_path: row.section_path,
      page_start: row.page_start,
      page_end: row.page_end,
    });
    label += 1;
  }

  return {
    labeledContext: parts.join('\n\n'),
    citations,
    usedChunkIds,
  };
}

/** Keep only citation labels the model actually referenced; drop unknown labels. */
export function filterAnswerToKnownLabels(
  answer: string,
  citations: Citation[],
): { answer: string; citations: Citation[] } {
  const allowed = new Set(citations.map((c) => c.label));
  const referenced = new Set<string>();
  const re = /\[(\d+)\]/g;
  let m: RegExpExecArray | null;
  while ((m = re.exec(answer)) !== null) {
    if (allowed.has(m[1])) referenced.add(m[1]);
    // Unknown labels are simply not added — do not invent citations.
  }
  // Always return DB-backed citation list for used context; filter to referenced if any.
  if (referenced.size === 0) {
    return { answer, citations };
  }
  return {
    answer,
    citations: citations.filter((c) => referenced.has(c.label)),
  };
}

export const INSUFFICIENT_EVIDENCE_ANSWER =
  'Insufficient evidence in the indexed manuals for this vehicle to answer safely. I will not invent torque specs or procedures. Try rephrasing or confirming the vehicle selection.';

export const ASK_SYSTEM_PROMPT = `You are Mechanic RAG, an advisory automotive assistant.
Answer ONLY from the labeled context blocks. Cite sources using [1], [2], etc.
If the context is insufficient, say so clearly and do not invent specs or procedures.
Do not mention chunks that lack a label.`;
