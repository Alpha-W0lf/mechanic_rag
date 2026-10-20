/** Shared Ask copy — safe for client and server. */

export const DEGRADED_ASK_BANNER =
  'The summary model is busy, so here are short citations to the manual pages that answer this.';

export const DEGRADED_OUTCOME_LABEL = 'Cited excerpts';
export const ASK_IN_FLIGHT_STATUS = 'Searching the manuals…';
export const ASK_QUESTION_PLACEHOLDER =
  'e.g. What is the engine displacement of the F20C?';
export const RETRY_SUMMARY_LABEL = 'Retry summary';

export const HEADER_TAGLINE =
  'Ask a service question and get an answer that cites the manual page it came from.';

export const CORPUS_COVERS_SUMMARY =
  'The demo covers the Honda S2000 service manual, owner’s manual and wiring diagrams: maintenance procedures, specifications, fluid capacities and electrical schematics.';

const DOC_FAMILY_LABELS: Record<string, string> = {
  service_manual: 'Service manual',
  owners_manual: 'Owner’s manual',
  wiring: 'Wiring diagrams',
  connectors: 'Connector views',
};

/** Human label for a citation's document family. */
export function docFamilyLabel(docFamily: string): string {
  return DOC_FAMILY_LABELS[docFamily] ?? docFamily.replace(/_/g, ' ');
}

/** A real section heading, or null when the stored path is only a file/page locator. */
export function readableSection(sectionPath: string | null): string | null {
  if (!sectionPath) return null;
  if (/\.pdf\b/i.test(sectionPath) || /(^|\/)page-\d+$/i.test(sectionPath))
    return null;
  return sectionPath;
}

export function stripDegradedBanner(answer: string): string {
  if (answer.startsWith(DEGRADED_ASK_BANNER)) {
    return answer.slice(DEGRADED_ASK_BANNER.length).trim();
  }
  return answer;
}
