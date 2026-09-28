import { describe, expect, it } from 'vitest';

import {
  filterVlmNotesAgainstCitations,
  isVlmEnabled,
  maybeAssistWithVlmSafe,
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

describe('maybeAssistWithVlmSafe', () => {
  it('maps a thrown assist to vlm_internal_error', async () => {
    const result = await maybeAssistWithVlmSafe(
      {
        question: 'Where is the wiring diagram?',
        vehicleId: 'fixture:honda-s2000-demo',
        citations: [],
        citedTexts: [],
      },
      async () => {
        throw new Error('boom');
      },
    );
    expect(result).toEqual({
      invoked: true,
      notes: null,
      degraded: true,
      reason: 'vlm_internal_error',
    });
  });

  it('returns the assist result when VLM is off', async () => {
    const result = await maybeAssistWithVlmSafe({
      question: 'What is the oil drain plug torque?',
      vehicleId: 'fixture:honda-s2000-demo',
      citations: [],
      citedTexts: [],
      env: { NODE_ENV: 'test' },
    });
    expect(result).toEqual({
      invoked: false,
      notes: null,
      degraded: false,
      reason: 'vlm_disabled',
    });
  });
});
