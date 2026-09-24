/**
 * JH-53 UI renderer: known [n] → #citation-n; unknown stays plain text.
 * Pure function — no testing-library in this repo.
 */
import { describe, expect, it } from 'vitest';
import { renderAnswerCitationNodes } from '@/lib/answer_citations';

describe('renderAnswerCitationNodes', () => {
  it('links [3] to #citation-3 and leaves unknown [7] as plain text', () => {
    const nodes = renderAnswerCitationNodes('See [3] and [7].', ['3']);
    expect(nodes).toEqual([
      { type: 'text', value: 'See ' },
      {
        type: 'citation',
        label: '3',
        href: '#citation-3',
        ariaLabel: 'Citation 3',
      },
      { type: 'text', value: ' and [7].' },
    ]);
    const links = nodes.filter((n) => n.type === 'citation');
    expect(links).toHaveLength(1);
    expect(links[0]).toMatchObject({ href: '#citation-3', label: '3' });
    expect(nodes.some((n) => n.type === 'citation' && n.label === '7')).toBe(
      false,
    );
    const text = nodes
      .filter((n) => n.type === 'text')
      .map((n) => n.value)
      .join('');
    expect(text).toContain('[7]');
    expect(text).not.toContain('[3]');
  });

  it('does not treat [10] as a link to citation 1', () => {
    const nodes = renderAnswerCitationNodes('See [1] and [10].', ['1']);
    expect(nodes).toEqual([
      { type: 'text', value: 'See ' },
      {
        type: 'citation',
        label: '1',
        href: '#citation-1',
        ariaLabel: 'Citation 1',
      },
      { type: 'text', value: ' and [10].' },
    ]);
  });

  it('returns a single text node when there are no markers', () => {
    expect(renderAnswerCitationNodes('Plain answer.', ['1'])).toEqual([
      { type: 'text', value: 'Plain answer.' },
    ]);
  });
});
