/**
 * Normalize a natural-language question for Postgres `plainto_tsquery('simple', …)`.
 *
 * Config `simple` does not drop English stopwords, so AND-ing "what is the …"
 * against manual text returns zero hits. Strip a small stopword set + short
 * tokens before FTS. Column `content_tsv` stays `simple` (architecture lock).
 */
const STOP = new Set([
  'a',
  'an',
  'the',
  'is',
  'are',
  'was',
  'were',
  'be',
  'been',
  'being',
  'what',
  'which',
  'who',
  'whom',
  'whose',
  'this',
  'that',
  'these',
  'those',
  'do',
  'does',
  'did',
  'how',
  'when',
  'where',
  'why',
  'to',
  'of',
  'for',
  'in',
  'on',
  'at',
  'by',
  'with',
  'from',
  'or',
  'and',
  'as',
  'it',
  'its',
  'my',
  'your',
  'our',
  'their',
  'can',
  'could',
  'should',
  'would',
  'will',
  'may',
  'might',
  'must',
  'i',
  'you',
  'we',
  'they',
  'he',
  'she',
]);

export function lexicalQueryFromQuestion(question: string): string {
  const tokens = question
    .toLowerCase()
    .replace(/[^a-z0-9.\-/\s]/g, ' ')
    .split(/\s+/)
    .map((t) => t.trim())
    .filter((t) => t.length >= 2 && !STOP.has(t));
  return tokens.join(' ');
}
