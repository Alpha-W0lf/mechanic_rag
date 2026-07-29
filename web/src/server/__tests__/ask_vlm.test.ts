import { describe, expect, it } from 'vitest';

import {
  filterVlmNotesAgainstCitations,
  isVlmEnabled,
  shouldInvokeVlm,
} from '../ask_vlm';

describe('ask_vlm router', () => {
  it('defaults off', () => {
    expect(isVlmEnabled({})).toBe(false);
    expect(isVlmEnabled({ MECHANIC_VLM: '0' })).toBe(false);
    expect(isVlmEnabled({ MECHANIC_VLM: '1' })).toBe(true);
  });

  it('skips torque-only questions', () => {
    expect(
      shouldInvokeVlm({ question: 'What is the oil drain plug torque?' }),
    ).toBe(false);
  });

  it('fires on diagram heuristic or explicit flag', () => {
    expect(
      shouldInvokeVlm({
        question: 'Where is the wiring diagram for the starter circuit?',
      }),
    ).toBe(true);
    expect(
      shouldInvokeVlm({
        question: 'Show me the clutch area',
        diagramAssist: true,
      }),
    ).toBe(true);
  });
});

describe('filterVlmNotesAgainstCitations', () => {
  it('strips invented Nm not in cited text', () => {
    const out = filterVlmNotesAgainstCitations(
      'The bolt shows 99 N·m on the diagram.',
      ['Oil drain plug torque is 39 N·m (29 lbf·ft).'],
    );
    expect(out).toContain('[spec omitted — not in text citation]');
    expect(out).not.toMatch(/99/);
  });

  it('keeps numeric claim present in citations', () => {
    const out = filterVlmNotesAgainstCitations(
      'Label shows 39 N·m near the plug.',
      ['Oil drain plug torque is 39 N·m (29 lbf·ft).'],
    );
    expect(out).toContain('39 N·m');
    expect(out).not.toContain('[spec omitted');
  });
});
