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

/**
 * Remove `[n]` whose n is not in the assembled set.
 * Cleanup is local to each removed marker: at most one adjacent list
 * separator (` ,` / `, `) or a single space/tab on one side. Everything
 * else is copied byte-identical — no whole-answer whitespace/punct rewrite.
 */
function stripUnknownCitationMarkers(
  answer: string,
  allowed: ReadonlySet<string>,
): string {
  const re = /\[(\d+)\]/g;
  let out = '';
  let last = 0;
  let m: RegExpExecArray | null;
  while ((m = re.exec(answer)) !== null) {
    if (allowed.has(m[1])) continue;
    let start = m.index;
    let end = m.index + m[0].length;
    const prefix = answer.slice(0, start);
    const suffix = answer.slice(end);
    const leftComma = prefix.match(/,[ \t]*$/)?.[0].length ?? 0;
    const rightComma = suffix.match(/^,[ \t]*/)?.[0].length ?? 0;
    const leftSpace = prefix.match(/[ \t]$/)?.[0].length ?? 0;
    const rightSpace = suffix.match(/^[ \t]/)?.[0].length ?? 0;
    if (leftComma) start -= leftComma;
    else if (rightComma) end += rightComma;
    else if (leftSpace) start -= leftSpace;
    else if (rightSpace) end += rightSpace;
    out += answer.slice(last, start);
    last = end;
  }
  if (last === 0) return answer;
  return out + answer.slice(last);
}

/** Keep referenced assembled labels (stable, possibly sparse); strip unknown `[n]`. */
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
    // Unknown labels are rejected — never invent citations.
  }
  const cleaned = stripUnknownCitationMarkers(answer, allowed);
  // Always return DB-backed citation list for used context; filter to referenced if any.
  if (referenced.size === 0) {
    return { answer: cleaned, citations };
  }
  return {
    answer: cleaned,
    citations: citations.filter((c) => referenced.has(c.label)),
  };
}

export const INSUFFICIENT_EVIDENCE_ANSWER =
  'Insufficient evidence in the indexed manuals for this vehicle to answer safely. I will not invent torque specs or procedures. Try rephrasing or confirming the vehicle selection.';

/**
 * Detect when generator text refuses or signals insufficient evidence
 * so true misses return outcome=insufficient_evidence with empty/minimal citations.
 */
export function isEvidenceInsufficient(text: string): boolean {
  if (!text) return true;
  const lower = text.toLowerCase();
  return (
    lower.includes('insufficient evidence') ||
    lower.includes('insufficient information') ||
    lower.includes('insufficient context') ||
    lower.includes('not enough information') ||
    lower.includes('not sufficient information') ||
    /context does not (?:contain|mention|provide|have)/i.test(text) ||
    /provided (?:context|text|manuals?|documents?) (?:does not|do not) (?:contain|provide|mention|have)/i.test(text) ||
    /no (?:information|mention|evidence) (?:is provided|in the provided|in the context)/i.test(text) ||
    /cannot (?:answer|find|determine) (?:.*?) (?:in|from|based on) (?:the )?(?:provided )?(?:context|information|evidence)/i.test(text) ||
    /cannot (?:answer|find|determine) (?:this|from|based on) (?:the )?(?:provided )?(?:context|information|evidence)/i.test(text)
  );
}

export const ASK_SYSTEM_PROMPT = `You are Mechanic RAG, an advisory automotive assistant.
Answer ONLY from the labeled context blocks. Cite sources using [1], [2], etc.
If the context is insufficient, say so clearly and do not invent specs or procedures.
Do not mention chunks that lack a label.`;
