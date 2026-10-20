/**
 * Numeric grounding for generated answers, run after generation with no model
 * calls. For each claim that states a number and carries citation markers,
 * the cited chunk must contain that number. If it doesn't, the marker is
 * re-pointed to the retrieved chunk that contains the most of the claim's
 * numbers, or dropped when none does. The answer text is never changed apart
 * from its markers. Labels are then renumbered 1..n by first appearance (each
 * marker group in ascending order), and each citation's excerpt is centred on
 * the value it supports.
 */
import {
  citationExcerpt,
  EXCERPT_CHARS,
  filterAnswerToKnownLabels,
  type Citation,
} from './citations';
import type { ChunkRow } from './retrievers';

export type GroundingStats = {
  /** Marker + claim pairs whose claim states at least one number. */
  numericClaims: number;
  /** Of those, cited chunks that already contained every stated number. */
  grounded: number;
  repointed: number;
  dropped: number;
};

// A value: digits with optional thousands separators or decimals, not glued
// to letters (so "F20C" and "cm3" are not values).
const NUMBER_RE =
  /(?<![\p{L}\d.,])\d{1,3}(?:,\d{3})+(?:\.\d+)?(?![\p{L}\d])|(?<![\p{L}\d.,])\d+(?:\.\d+)?(?![\p{L}\d])/gu;
// "[1], [2]", "[1] [2]" and "[1][2]" are all one group.
const MARKER_GROUP_RE = /\[\d+\](?:[ \t]*,?[ \t]*\[\d+\])*/g;
const LIST_PREFIX_RE = /^\s*(?:[-*•]\s+|\d+[.)]\s+)/;

function normalizeText(s: string): string {
  return s.replace(/[   ]/g, ' ').replace(/[‐-―−]/g, '-');
}

/** Number tokens with their positions; "1,000" is read as "1000". */
function numberTokens(
  text: string,
): Array<{ raw: string; value: string; index: number }> {
  const out: Array<{ raw: string; value: string; index: number }> = [];
  for (const m of normalizeText(text).matchAll(NUMBER_RE)) {
    out.push({ raw: m[0], value: m[0].replace(/,/g, ''), index: m.index ?? 0 });
  }
  return out;
}

function numberSet(text: string): Set<string> {
  return new Set(numberTokens(text).map((t) => t.value));
}

/** ~150 characters centred on the first occurrence of value in content. */
export function excerptAround(content: string, value: string): string | null {
  const flat = content.replace(/\s+/g, ' ').trim();
  const hit = numberTokens(flat).find((t) => t.value === value);
  if (!hit) return null;
  if (flat.length <= EXCERPT_CHARS) return flat;
  let start = Math.max(0, hit.index - Math.floor(EXCERPT_CHARS / 2));
  start = Math.min(start, flat.length - EXCERPT_CHARS);
  let end = start + EXCERPT_CHARS;
  if (start > 0) {
    const space = flat.indexOf(' ', start);
    if (space > 0 && space < hit.index) start = space + 1;
  }
  if (end < flat.length) {
    const space = flat.lastIndexOf(' ', end);
    if (space > hit.index) end = space;
  }
  const body = flat.slice(start, end).trim();
  return `${start > 0 ? '…' : ''}${body}${end < flat.length ? '…' : ''}`;
}

type Claim = {
  start: number;
  end: number;
  labels: string[];
  numbers: string[];
};

/** Marker groups with the numbers stated in the text each group closes. */
function claims(answer: string): Claim[] {
  const out: Claim[] = [];
  let spanStart = 0;
  for (const m of answer.matchAll(MARKER_GROUP_RE)) {
    const index = m.index ?? 0;
    const lineStart = answer.lastIndexOf('\n', index - 1) + 1;
    const before = answer.slice(Math.max(spanStart, lineStart), index);
    // The claim is the text since the last sentence end inside this span.
    const sentence = before.split(/(?<=[.!?;])\s+(?=\S)/).pop() ?? before;
    const text = sentence.replace(LIST_PREFIX_RE, '');
    // A bare single digit ("Step 2", "in 2 passes") is a count, not a spec.
    const values = numberTokens(text).filter((t) => !/^\d$/.test(t.raw));
    out.push({
      start: index,
      end: index + m[0].length,
      labels: [...m[0].matchAll(/\[(\d+)\]/g)].map((x) => x[1]),
      numbers: [...new Set(values.map((t) => t.value))],
    });
    spanStart = index + m[0].length;
  }
  return out;
}

function overlap(numbers: string[], have: Set<string>): number {
  return numbers.filter((n) => have.has(n)).length;
}

export function finalizeCitations(
  text: string,
  assembled: Citation[],
  rows: Map<string, ChunkRow>,
): { answer: string; citations: Citation[]; grounding: GroundingStats } {
  const filtered = filterAnswerToKnownLabels(text, assembled);
  const answer = filtered.answer;
  const stats: GroundingStats = {
    numericClaims: 0,
    grounded: 0,
    repointed: 0,
    dropped: 0,
  };
  const byLabel = new Map(assembled.map((c) => [c.label, c]));
  const numbersByLabel = new Map(
    assembled.map((c) => [
      c.label,
      numberSet(rows.get(c.chunk_id)?.content ?? ''),
    ]),
  );
  const matchedValue = new Map<string, string>();

  let rebuilt = '';
  let last = 0;
  for (const claim of claims(answer)) {
    const labels: string[] = [];
    for (const label of claim.labels) {
      let chosen: string | null = label;
      if (claim.numbers.length > 0) {
        stats.numericClaims += 1;
        const all = claim.numbers.length;
        const scoreOf = (l: string) =>
          overlap(claim.numbers, numbersByLabel.get(l) ?? new Set());
        const score = scoreOf(label);
        if (score === all) {
          stats.grounded += 1;
        } else {
          // Move to a chunk with every value. Failing that, a chunk with some
          // of them stays (the rest may be stray numbers in the sentence), and
          // one with none goes to the closest match or is dropped.
          let best = { label: score > 0 ? label : null, score };
          for (const c of assembled) {
            const s = scoreOf(c.label);
            if (s === all || (score === 0 && s > best.score)) {
              best = { label: c.label, score: s };
              if (s === all) break;
            }
          }
          chosen = best.label;
          if (!chosen) stats.dropped += 1;
          else if (chosen !== label) stats.repointed += 1;
        }
        if (chosen && !matchedValue.has(chosen)) {
          const have2 = numbersByLabel.get(chosen) ?? new Set<string>();
          const value = claim.numbers.find((n) => have2.has(n));
          if (value) matchedValue.set(chosen, value);
        }
      }
      if (chosen && !labels.includes(chosen)) labels.push(chosen);
    }
    let head = answer.slice(last, claim.start);
    if (labels.length === 0) head = head.replace(/[ \t]+$/, '');
    rebuilt += head + labels.map((l) => `[${l}]`).join(', ');
    last = claim.end;
  }
  rebuilt += answer.slice(last);

  // Renumber 1..n in order of first appearance; markers and cards stay in step.
  const order: string[] = [];
  for (const m of rebuilt.matchAll(/\[(\d+)\]/g)) {
    if (!order.includes(m[1])) order.push(m[1]);
  }
  // No markers left: return every assembled source, as for an answer that
  // never had markers.
  if (order.length === 0) {
    return { answer: rebuilt, citations: assembled, grounding: stats };
  }
  const newLabel = new Map(order.map((old, i) => [old, String(i + 1)]));
  // Each group is renumbered as a unit and listed in ascending order.
  const finalAnswer = rebuilt.replace(MARKER_GROUP_RE, (group) =>
    [...group.matchAll(/\[(\d+)\]/g)]
      .map((x) => Number(newLabel.get(x[1]) ?? x[1]))
      .sort((a, b) => a - b)
      .map((l) => `[${l}]`)
      .join(', '),
  );
  const citations = order.map((old) => {
    const c = byLabel.get(old)!;
    const content = rows.get(c.chunk_id)?.content ?? '';
    const value = matchedValue.get(old);
    const excerpt =
      (value && excerptAround(content, value)) || citationExcerpt(content);
    return { ...c, label: newLabel.get(old)!, excerpt };
  });
  return { answer: finalAnswer, citations, grounding: stats };
}
