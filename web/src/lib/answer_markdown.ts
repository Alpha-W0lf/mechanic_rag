/**
 * Split a generated answer into display blocks: headings, lists and
 * paragraphs. Pure and client-safe. Inline text (bold, citation markers)
 * is rendered later by renderAnswerCitationNodes; nothing here produces
 * HTML, so model output can never inject markup.
 */

export type AnswerBlock =
  | { kind: 'heading'; level: 1 | 2 | 3; text: string }
  | { kind: 'list'; ordered: boolean; items: string[] }
  | { kind: 'paragraph'; text: string };

const HEADING_RE = /^(#{1,6})\s+(.*)$/;
const BULLET_RE = /^\s*[-*•]\s+(.*)$/;
const ORDERED_RE = /^\s*\d+[.)]\s+(.*)$/;

export function parseAnswerBlocks(answer: string): AnswerBlock[] {
  const blocks: AnswerBlock[] = [];
  let paragraph: string[] = [];

  const flushParagraph = () => {
    if (paragraph.length) {
      blocks.push({ kind: 'paragraph', text: paragraph.join('\n') });
      paragraph = [];
    }
  };

  for (const raw of answer.replace(/\r\n/g, '\n').split('\n')) {
    const line = raw.trimEnd();
    if (!line.trim()) {
      flushParagraph();
      continue;
    }
    const heading = line.match(HEADING_RE);
    if (heading) {
      flushParagraph();
      const level = Math.min(heading[1].length, 3) as 1 | 2 | 3;
      blocks.push({ kind: 'heading', level, text: heading[2].trim() });
      continue;
    }
    const bullet = line.match(BULLET_RE);
    const numbered = bullet ? null : line.match(ORDERED_RE);
    if (bullet || numbered) {
      flushParagraph();
      const ordered = !bullet;
      const item = (bullet ?? numbered)![1].trim();
      const prev = blocks[blocks.length - 1];
      if (prev?.kind === 'list' && prev.ordered === ordered) {
        prev.items.push(item);
      } else {
        blocks.push({ kind: 'list', ordered, items: [item] });
      }
      continue;
    }
    paragraph.push(line);
  }
  flushParagraph();
  return blocks;
}

/** Turn a catalog id into a label people read, e.g. "2003 Honda S2000". */
export function vehicleLabel(vehicleId: string): string {
  const [prefix, slug = ''] = vehicleId.split(':', 2);
  const words = slug
    .split('-')
    .filter(Boolean)
    .map((w) => (/^\d+$/.test(w) ? w : w.charAt(0).toUpperCase() + w.slice(1)));
  if (prefix === 'fixture') {
    const base = words.filter((w) => w.toLowerCase() !== 'demo').join(' ');
    return `${base} (synthetic demo)`;
  }
  return words.join(' ') || vehicleId;
}

/** The hosted catalog hides synthetic fixtures when real manuals are indexed. */
export function visibleVehicles(ids: string[]): string[] {
  const catalog = ids.filter((id) => !id.startsWith('fixture:'));
  return catalog.length ? catalog : ids;
}
