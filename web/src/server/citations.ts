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
  /** Short plain-text excerpt of the cited chunk, so readers can check the answer. */
  excerpt?: string;
};

const MAX_CONTEXT_CHARS = 12_000;
export const EXCERPT_CHARS = 150;

/** First ~150 characters of a chunk, whitespace collapsed, cut at a word boundary. */
export function citationExcerpt(content: string): string {
  const flat = content.replace(/\s+/g, ' ').trim();
  if (flat.length <= EXCERPT_CHARS) return flat;
  const cut = flat.slice(0, EXCERPT_CHARS);
  const space = cut.lastIndexOf(' ');
  return `${(space > EXCERPT_CHARS * 0.6 ? cut.slice(0, space) : cut).trimEnd()}…`;
}

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
      excerpt: citationExcerpt(row.content),
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

/**
 * Rewrite grouped markers such as `[1, 3, 5]` or `[2-4]` as single markers
 * (`[1], [3], [5]`) so the label filter and the UI see one label per bracket.
 * A bracket is split only when it is a pure list of labels and every number
 * is between 1 and maxLabel; anything else (e.g. `[1,000]`) is left as written.
 */
function splitGroupedCitationMarkers(answer: string, maxLabel: number): string {
  const inRange = (n: number) => n >= 1 && n <= maxLabel;
  return answer.replace(
    /\[(\d+(?:\s*(?:,|-|\u2013)\s*\d+)+)\]/g,
    (whole, inner: string) => {
      const labels: number[] = [];
      for (const part of inner.split(/\s*,\s*/)) {
        const range = part.match(/^(\d+)\s*(?:-|\u2013)\s*(\d+)$/);
        if (!range) {
          if (!/^\d+$/.test(part) || !inRange(Number(part))) return whole;
          labels.push(Number(part));
          continue;
        }
        const lo = Number(range[1]);
        const hi = Number(range[2]);
        if (hi < lo || !inRange(lo) || !inRange(hi)) return whole;
        for (let n = lo; n <= hi; n += 1) labels.push(n);
      }
      return labels.map((n) => `[${n}]`).join(', ');
    },
  );
}

/** Keep referenced assembled labels (stable, possibly sparse); strip unknown `[n]`. */
export function filterAnswerToKnownLabels(
  rawAnswer: string,
  citations: Citation[],
): { answer: string; citations: Citation[] } {
  const answer = splitGroupedCitationMarkers(rawAnswer, citations.length);
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
