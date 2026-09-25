/**
 * JH-53 citation-marker hygiene.
 * Test plan written first — strip/unknown cases must fail before the filter rewrite.
 */
import { describe, expect, it } from 'vitest';
import {
  assembleContext,
  filterAnswerToKnownLabels,
  isEvidenceInsufficient,
  type Citation,
} from '@/server/citations';
import type { ChunkRow } from '@/server/retrievers';
import type { RrfResult } from '@/lib/retrieval/types';

function row(chunk_id: string, content: string): ChunkRow {
  return {
    chunk_id,
    document_id: 'doc1',
    vehicle_id: 'fixture:honda-s2000-demo',
    doc_family: 'service_manual',
    content,
    section_path: '1-1',
    page_start: 1,
    page_end: 1,
    document_name: 'demo',
    provenance: null,
  };
}

function rrf(chunk_id: string, content: string, score: number): RrfResult {
  return {
    chunk_id,
    document_id: 'doc1',
    content,
    modality: 'fusion',
    rrf_score: score,
  };
}

function citation(label: string, chunk_id: string): Citation {
  return {
    label,
    chunk_id,
    vehicle_id: 'v',
    doc_family: 'service_manual',
    document_id: 'd',
    section_path: null,
    page_start: null,
    page_end: null,
  };
}

describe('filterAnswerToKnownLabels — label-stable subset', () => {
  it('keeps original labels for a sparse [1], [3] answer (maps 3 → chunk c)', () => {
    const rows = new Map([
      ['a', row('a', 'Alpha torque 39 N·m.')],
      ['b', row('b', 'Bravo oil 4.8 L.')],
      ['c', row('c', 'Charlie crush washer.')],
    ]);
    const { citations } = assembleContext(
      [
        rrf('a', 'Alpha torque 39 N·m.', 0.3),
        rrf('b', 'Bravo oil 4.8 L.', 0.2),
        rrf('c', 'Charlie crush washer.', 0.1),
      ],
      rows,
    );
    expect(citations.map((c) => c.label)).toEqual(['1', '2', '3']);
    expect(citations.map((c) => c.chunk_id)).toEqual(['a', 'b', 'c']);

    const filtered = filterAnswerToKnownLabels(
      'Torque is 39 N·m [1], [3].',
      citations,
    );
    expect(filtered.citations.map((c) => c.label)).toEqual(['1', '3']);
    expect(filtered.citations.map((c) => c.chunk_id)).toEqual(['a', 'c']);
    expect(filtered.answer).toBe('Torque is 39 N·m [1], [3].');
    expect(filtered.answer).toContain('[1]');
    expect(filtered.answer).toContain('[3]');
    expect(filtered.citations.find((c) => c.label === '3')?.chunk_id).toBe('c');
  });

  it('returns the full assembled list when the answer has no markers', () => {
    const assembled = [
      citation('1', 'a'),
      citation('2', 'b'),
      citation('3', 'c'),
    ];
    const filtered = filterAnswerToKnownLabels(
      'No citations in this answer.',
      assembled,
    );
    expect(filtered.citations).toEqual(assembled);
    expect(filtered.answer).toBe('No citations in this answer.');
  });

  it('returns an answer with no unknown markers byte-identical', () => {
    const answer = 'Torque : 30 N·m [1].\n  - sub item';
    const filtered = filterAnswerToKnownLabels(answer, [citation('1', 'a')]);
    expect(filtered.answer).toBe(answer);
    expect(filtered.citations.map((c) => c.label)).toEqual(['1']);
  });
});

describe('filterAnswerToKnownLabels — unknown markers stripped', () => {
  it('strips [99] cleanly and keeps the referenced array as ["1"]', () => {
    const filtered = filterAnswerToKnownLabels('See [1] and [99].', [
      citation('1', 'a'),
    ]);
    expect(filtered.citations.map((c) => c.label)).toEqual(['1']);
    expect(filtered.answer).toBe('See [1] and.');
    expect(filtered.answer).not.toMatch(/\[99\]/);
    expect(filtered.answer).toContain('[1]');
    expect(filtered.answer).not.toMatch(/  /);
  });

  it('cleans comma-separated unknown markers without leftover punctuation', () => {
    const one = filterAnswerToKnownLabels('See [1], [99].', [
      citation('1', 'a'),
    ]);
    expect(one.answer).toBe('See [1].');
    expect(one.citations.map((c) => c.label)).toEqual(['1']);

    const both = filterAnswerToKnownLabels('See [1], [99], [2].', [
      citation('1', 'a'),
      citation('2', 'b'),
    ]);
    expect(both.answer).toBe('See [1], [2].');
    expect(both.citations.map((c) => c.label)).toEqual(['1', '2']);

    const leading = filterAnswerToKnownLabels('See [99], [1].', [
      citation('1', 'a'),
    ]);
    expect(leading.answer).toBe('See [1].');

    const leadingBare = filterAnswerToKnownLabels('[99], see [1]', [
      citation('1', 'a'),
    ]);
    expect(leadingBare.answer).toBe('see [1]');
  });

  it('handles adjacent markers [1][3] and leaves known ones untouched', () => {
    const filtered = filterAnswerToKnownLabels('See [1][99][3].', [
      citation('1', 'a'),
      citation('3', 'c'),
    ]);
    expect(filtered.answer).toBe('See [1][3].');
    expect(filtered.citations.map((c) => c.label)).toEqual(['1', '3']);
  });

  it('treats [10] as label 10, not as [1]', () => {
    const onlyOne = filterAnswerToKnownLabels('Keep [1] drop [10].', [
      citation('1', 'a'),
    ]);
    expect(onlyOne.answer).toBe('Keep [1] drop.');
    expect(onlyOne.citations.map((c) => c.label)).toEqual(['1']);
    expect(onlyOne.answer).not.toMatch(/\[10\]/);

    const oneAndTen = filterAnswerToKnownLabels(
      'See [1] and [10] plus [11].',
      [citation('1', 'a'), citation('10', 'j')],
    );
    expect(oneAndTen.answer).toBe('See [1] and [10] plus.');
    expect(oneAndTen.citations.map((c) => c.label)).toEqual(['1', '10']);
    expect(oneAndTen.answer).toContain('[10]');
    expect(oneAndTen.answer).not.toMatch(/\[11\]/);
  });

  it('strips an unknown marker when nothing assembled matches it', () => {
    const filtered = filterAnswerToKnownLabels('Invented [3] only.', [
      citation('1', 'a'),
      citation('2', 'b'),
    ]);
    expect(filtered.answer).toBe('Invented only.');
    // No known label referenced → existing branch: keep full assembled list.
    expect(filtered.citations.map((c) => c.label)).toEqual(['1', '2']);
  });

  it('does not rewrite an indented list line when stripping [99] elsewhere', () => {
    const answer = 'Intro [99].\n  - sub item\nMore [1].';
    const filtered = filterAnswerToKnownLabels(answer, [citation('1', 'a')]);
    expect(filtered.answer.split('\n')[1]).toBe(answer.split('\n')[1]);
    expect(filtered.answer.split('\n')[1]).toBe('  - sub item');
    expect(filtered.answer).not.toMatch(/\[99\]/);
    expect(filtered.answer).toContain('[1]');
  });

  it('does not strip spaces before punctuation away from the removed marker', () => {
    const filtered = filterAnswerToKnownLabels('Torque : 30 N·m [99].', [
      citation('1', 'a'),
    ]);
    expect(filtered.answer.startsWith('Torque : 30 N·m')).toBe(true);
    expect(filtered.answer).toBe('Torque : 30 N·m.');
    expect(filtered.answer).not.toMatch(/\[99\]/);
  });
});

describe('JH-73: isEvidenceInsufficient detection for true misses', () => {
  it('detects standard refusal phrases and returns true', () => {
    expect(
      isEvidenceInsufficient(
        'The provided context does not contain information about the front brake pads.',
      ),
    ).toBe(true);
    expect(
      isEvidenceInsufficient(
        'Insufficient evidence in the indexed manuals for this vehicle.',
      ),
    ).toBe(true);
    expect(
      isEvidenceInsufficient(
        'I cannot find any information about the ABS module pinout in the provided context.',
      ),
    ).toBe(true);
    expect(
      isEvidenceInsufficient(
        'There is not enough information in the context to determine the torque spec.',
      ),
    ).toBe(true);
  });

  it('returns false for actual answers with citation grounding', () => {
    expect(
      isEvidenceInsufficient(
        'The front brake pad thickness should be inspected according to [1]. Minimum thickness is 1.6 mm.',
      ),
    ).toBe(false);
    expect(
      isEvidenceInsufficient(
        'The oil drain plug torque is 39 N·m (29 lbf·ft) [1].',
      ),
    ).toBe(false);
  });
});
