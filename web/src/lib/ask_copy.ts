/** Shared Ask copy — safe for client and server. */

export const DEGRADED_ASK_BANNER =
  'AI summary temporarily unavailable; showing the most relevant manual excerpts.';

export const HOSTED_CE_OFF_CHIP = 'CE off on hosted';
export const HOSTED_CE_SKIP_REASON = 'ce_skip_reason=hosted_ce_disabled';
export const HOSTED_CE_OFF_LINE =
  'Hosted cross-encoder is off (ce_skip_reason=hosted_ce_disabled) · hybrid RRF + section dedup (local CE optional).';

export const CORPUS_COVERS_CHIP = 'Corpus covers';
export const CORPUS_COVERS_SUMMARY =
  'Corpus covers Honda S2000 service manual, owners manual, and wiring diagrams (maintenance procedures, specifications, fluid capacities, electrical schematics).';

export function stripDegradedBanner(answer: string): string {
  if (answer.startsWith(DEGRADED_ASK_BANNER)) {
    return answer.slice(DEGRADED_ASK_BANNER.length).trim();
  }
  return answer;
}
