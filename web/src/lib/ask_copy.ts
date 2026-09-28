/** Shared Ask copy — safe for client and server. */

export const DEGRADED_ASK_BANNER =
  'Free Gemini summary hit a temporary rate limit — ranked manual excerpts below (citations intact).';

export const DEGRADED_OUTCOME_LABEL = 'Cited excerpts';
export const ASK_IN_FLIGHT_STATUS =
  'Asking free-tier Gemini… (retries on rate limits)';
export const ASK_QUESTION_PLACEHOLDER =
  'e.g. What is the engine displacement of the F20C?';
export const RETRY_SUMMARY_LABEL = 'Retry summary';

export const HOSTED_CE_OFF_CHIP = 'CE off on hosted';
export const HOSTED_CE_SKIP_REASON = 'ce_skip_reason=hosted_ce_disabled';
export const HOSTED_CE_OFF_LINE =
  'Hosted cross-encoder is off (ce_skip_reason=hosted_ce_disabled) · hybrid RRF + section dedup (local CE optional).';

export const HOSTED_FREE_TIER_CHIP =
  'Free-tier Gemini · excerpts if summary is rate-limited';

export const CORPUS_COVERS_CHIP = 'Corpus covers';
export const CORPUS_COVERS_SUMMARY =
  'Corpus covers Honda S2000 service manual, owners manual, and wiring diagrams (maintenance procedures, specifications, fluid capacities, electrical schematics).';

export function stripDegradedBanner(answer: string): string {
  if (answer.startsWith(DEGRADED_ASK_BANNER)) {
    return answer.slice(DEGRADED_ASK_BANNER.length).trim();
  }
  return answer;
}
