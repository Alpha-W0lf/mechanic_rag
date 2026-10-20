import { describe, expect, it } from 'vitest';
import type { Citation } from '@/server/citations';
import { finalizeCitations } from '@/server/citation_grounding';
import type { ChunkRow } from '@/server/retrievers';

function row(chunk_id: string, content: string): ChunkRow {
  return {
    chunk_id,
    document_id: 'service_manual--demo',
    vehicle_id: 'cat:2003-honda-s2000',
    doc_family: 'service_manual',
    content,
    section_path: null,
    page_start: 1,
    page_end: 1,
    document_name: 'demo',
    provenance: null,
  };
}

function setup(contents: string[]): {
  citations: Citation[];
  rows: Map<string, ChunkRow>;
} {
  const rows = new Map<string, ChunkRow>();
  const citations = contents.map((content, i) => {
    const id = `c${i + 1}`;
    rows.set(id, row(id, content));
    return {
      label: String(i + 1),
      chunk_id: id,
      vehicle_id: 'cat:2003-honda-s2000',
      doc_family: 'service_manual',
      document_id: 'service_manual--demo',
      section_path: null,
      page_start: i + 1,
      page_end: i + 1,
      excerpt: content.slice(0, 20),
    };
  });
  return { citations, rows };
}

const ALIGNMENT =
  'Wheel alignment. Check the toe-in and camber with the vehicle on a level floor.';
const TIRES =
  'Tire information. Recommended cold tire pressure: front 32 psi (220 kPa), rear 32 psi.';
const SCHEDULE =
  'Maintenance schedule. Inspect valve clearance every 110,000 miles.';
const VALVES =
  'Valve clearance (cold): Intake 0.21–0.25 mm, Exhaust 0.25–0.29 mm.';

describe('finalizeCitations — numeric grounding', () => {
  it('re-points a value cited to a chunk that lacks it to a chunk that has it', () => {
    const { citations, rows } = setup([ALIGNMENT, TIRES]);
    const out = finalizeCitations(
      'Tire pressure is 32 psi [1].',
      citations,
      rows,
    );
    expect(out.answer).toBe('Tire pressure is 32 psi [1].');
    expect(out.citations).toHaveLength(1);
    expect(out.citations[0].chunk_id).toBe('c2');
    expect(out.grounding).toMatchObject({
      numericClaims: 1,
      repointed: 1,
      dropped: 0,
    });
  });

  it('drops the marker when no retrieved chunk contains the value', () => {
    const { citations, rows } = setup([ALIGNMENT, SCHEDULE]);
    const out = finalizeCitations(
      'Tire pressure is 32 psi [1].',
      citations,
      rows,
    );
    expect(out.answer).toBe('Tire pressure is 32 psi.');
    expect(out.grounding).toMatchObject({ numericClaims: 1, dropped: 1 });
  });

  it('keeps a citation whose chunk contains every value, across thousands separators and dashes', () => {
    const { citations, rows } = setup([SCHEDULE, VALVES]);
    const answer =
      'Intake 0.21-0.25 mm and exhaust 0.25 - 0.29 mm [2]. Check every 110000 miles [1].';
    const out = finalizeCitations(answer, citations, rows);
    expect(out.answer).toBe(
      'Intake 0.21-0.25 mm and exhaust 0.25 - 0.29 mm [1]. Check every 110000 miles [2].',
    );
    expect(out.citations.map((c) => c.chunk_id)).toEqual(['c2', 'c1']);
    expect(out.grounding).toMatchObject({
      numericClaims: 2,
      grounded: 2,
      repointed: 0,
      dropped: 0,
    });
  });

  it('re-points the live valve-clearance case away from the maintenance schedule', () => {
    const { citations, rows } = setup([SCHEDULE, VALVES]);
    const out = finalizeCitations(
      'Intake valve clearance is 0.21–0.25 mm [1].',
      citations,
      rows,
    );
    expect(out.answer).toBe('Intake valve clearance is 0.21–0.25 mm [1].');
    expect(out.citations[0].chunk_id).toBe('c2');
  });

  it('never changes the answer text apart from the markers', () => {
    const { citations, rows } = setup([ALIGNMENT, TIRES, SCHEDULE]);
    const answer =
      '### Tires\n*   **Front:** 32 psi [1].\n*   Rotate tires regularly [3].\n1. Park on a level floor [2].';
    const out = finalizeCitations(answer, citations, rows);
    const strip = (s: string) => s.replace(/\s*\[\d+\]/g, '');
    expect(strip(out.answer)).toBe(strip(answer));
  });

  it('leaves markers on sentences without numbers alone', () => {
    const { citations, rows } = setup([ALIGNMENT, TIRES]);
    const out = finalizeCitations(
      'Check the toe-in on a level floor [1].',
      citations,
      rows,
    );
    expect(out.answer).toBe('Check the toe-in on a level floor [1].');
    expect(out.citations[0].chunk_id).toBe('c1');
    expect(out.grounding.numericClaims).toBe(0);
  });

  it('does not treat list numbering or model codes as values', () => {
    const { citations, rows } = setup([ALIGNMENT, TIRES]);
    const out = finalizeCitations(
      '1. Check the F20C toe-in [1].',
      citations,
      rows,
    );
    expect(out.answer).toBe('1. Check the F20C toe-in [1].');
    expect(out.citations[0].chunk_id).toBe('c1');
  });
});

describe('finalizeCitations — labels and excerpts', () => {
  it('renumbers labels 1..n in order of first appearance, keeping cards and markers consistent', () => {
    const { citations, rows } = setup([ALIGNMENT, TIRES, SCHEDULE]);
    const out = finalizeCitations(
      'Rotate tires [3]. Toe-in matters [1]. Again [3].',
      citations,
      rows,
    );
    expect(out.answer).toBe('Rotate tires [1]. Toe-in matters [2]. Again [1].');
    expect(out.citations.map((c) => [c.label, c.chunk_id])).toEqual([
      ['1', 'c3'],
      ['2', 'c1'],
    ]);
  });

  it('splits grouped markers and still renumbers', () => {
    const { citations, rows } = setup([ALIGNMENT, TIRES, SCHEDULE]);
    const out = finalizeCitations(
      'Tires and alignment [1, 3].',
      citations,
      rows,
    );
    expect(out.answer).toBe('Tires and alignment [1], [2].');
    expect(out.citations.map((c) => c.chunk_id)).toEqual(['c1', 'c3']);
  });

  it('lists the labels inside a group in ascending order after renumbering', () => {
    const { citations, rows } = setup([ALIGNMENT, TIRES, SCHEDULE]);
    const out = finalizeCitations(
      'Rotate tires [3]. Check alignment too [1], [3].',
      citations,
      rows,
    );
    expect(out.answer).toBe('Rotate tires [1]. Check alignment too [1], [2].');
    expect(out.citations.map((c) => [c.label, c.chunk_id])).toEqual([
      ['1', 'c3'],
      ['2', 'c1'],
    ]);
  });

  it('centres the excerpt on the matched value', () => {
    const long = `${'General tire care and rotation notes. '.repeat(8)}Recommended cold tire pressure: 32 psi front and rear. ${'Check monthly. '.repeat(8)}`;
    const { citations, rows } = setup([long]);
    const out = finalizeCitations('Use 32 psi [1].', citations, rows);
    expect(out.citations[0].excerpt).toContain('32 psi');
    expect(out.citations[0].excerpt!.length).toBeLessThanOrEqual(152);
    expect(out.citations[0].excerpt!.startsWith('…')).toBe(true);
  });

  it('keeps the start-of-chunk excerpt when no value matches', () => {
    const { citations, rows } = setup([ALIGNMENT]);
    const out = finalizeCitations('Check the toe-in [1].', citations, rows);
    expect(out.citations[0].excerpt).toBe(ALIGNMENT);
  });
});
