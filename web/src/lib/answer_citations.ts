/** Client-safe answer marker renderer. Labels themselves are assigned server-side. */

export type AnswerCitationNode =
  | { type: 'text'; value: string }
  | { type: 'citation'; label: string; href: string; ariaLabel: string };

const CITATION_MARKER_RE = /\[(\d+)\]/g;

/** Split answer text into plain runs and links for labels present in the response. */
export function renderAnswerCitationNodes(
  answer: string,
  knownLabels: Iterable<string>,
): AnswerCitationNode[] {
  const allowed = new Set(knownLabels);
  const nodes: AnswerCitationNode[] = [];
  let last = 0;
  const re = new RegExp(CITATION_MARKER_RE.source, 'g');
  let m: RegExpExecArray | null;
  while ((m = re.exec(answer)) !== null) {
    if (m.index > last) {
      nodes.push({ type: 'text', value: answer.slice(last, m.index) });
    }
    const label = m[1];
    if (allowed.has(label)) {
      nodes.push({
        type: 'citation',
        label,
        href: `#citation-${label}`,
        ariaLabel: `Citation ${label}`,
      });
    } else {
      nodes.push({ type: 'text', value: m[0] });
    }
    last = m.index + m[0].length;
  }
  if (last < answer.length) {
    nodes.push({ type: 'text', value: answer.slice(last) });
  }
  return mergeAdjacentText(nodes);
}

function mergeAdjacentText(nodes: AnswerCitationNode[]): AnswerCitationNode[] {
  const out: AnswerCitationNode[] = [];
  for (const node of nodes) {
    const prev = out[out.length - 1];
    if (node.type === 'text' && prev?.type === 'text') {
      prev.value += node.value;
    } else {
      out.push(node.type === 'text' ? { ...node } : node);
    }
  }
  return out;
}
