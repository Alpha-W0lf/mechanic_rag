/** Shared Ask copy — safe for client and server. */

export const DEGRADED_ASK_BANNER =
  'AI summary temporarily unavailable; showing the most relevant manual excerpts.';

export function stripDegradedBanner(answer: string): string {
  if (answer.startsWith(DEGRADED_ASK_BANNER)) {
    return answer.slice(DEGRADED_ASK_BANNER.length).trim();
  }
  return answer;
}
