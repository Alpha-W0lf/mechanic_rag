import { describe, expect, it } from 'vitest';
import {
  parseAnswerBlocks,
  vehicleLabel,
  visibleVehicles,
} from '@/lib/answer_markdown';

describe('parseAnswerBlocks', () => {
  it('turns ### headings and * bullets into blocks instead of raw markdown', () => {
    const answer = [
      '### Brake fluid',
      'Use **DOT 3** brake fluid [1].',
      '',
      '*   Bleed the rear right caliper first [2].',
      '*   Then the rear left [2].',
      '',
      '1. Fill the reservoir.',
      '2. Check the level.',
    ].join('\n');
    expect(parseAnswerBlocks(answer)).toEqual([
      { kind: 'heading', level: 3, text: 'Brake fluid' },
      { kind: 'paragraph', text: 'Use **DOT 3** brake fluid [1].' },
      {
        kind: 'list',
        ordered: false,
        items: [
          'Bleed the rear right caliper first [2].',
          'Then the rear left [2].',
        ],
      },
      {
        kind: 'list',
        ordered: true,
        items: ['Fill the reservoir.', 'Check the level.'],
      },
    ]);
  });

  it('keeps a plain one-line answer as one paragraph', () => {
    expect(parseAnswerBlocks('Tire pressure is 32 psi [3].')).toEqual([
      { kind: 'paragraph', text: 'Tire pressure is 32 psi [3].' },
    ]);
  });

  it('never produces markup: HTML in the answer stays text', () => {
    const blocks = parseAnswerBlocks('<img src=x onerror=alert(1)> torque [1]');
    expect(blocks).toEqual([
      { kind: 'paragraph', text: '<img src=x onerror=alert(1)> torque [1]' },
    ]);
  });
});

describe('vehicle labels', () => {
  it('labels catalog ids for people', () => {
    expect(vehicleLabel('cat:2003-honda-s2000')).toBe('2003 Honda S2000');
    expect(vehicleLabel('fixture:honda-s2000-demo')).toBe(
      'Honda S2000 (synthetic demo)',
    );
  });

  it('hides synthetic fixtures when real manuals are indexed', () => {
    expect(
      visibleVehicles(['fixture:honda-s2000-demo', 'cat:2003-honda-s2000']),
    ).toEqual(['cat:2003-honda-s2000']);
    expect(visibleVehicles(['fixture:honda-s2000-demo'])).toEqual([
      'fixture:honda-s2000-demo',
    ]);
  });
});
