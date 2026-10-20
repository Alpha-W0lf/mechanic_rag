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

  it('returns the full assembled list, labelled 1..n, when every marker is dropped', () => {
    const { citations, rows } = setup([ALIGNMENT, SCHEDULE, ALIGNMENT]);
    const out = finalizeCitations(
      'Tire pressure is 32 psi [3].',
      citations,
      rows,
    );
    expect(out.answer).toBe('Tire pressure is 32 psi.');
    expect(out.citations.map((c) => c.label)).toEqual(['1', '2', '3']);
  });

  it('checks every marker in adjacent groups like [1][2] and [1] [2]', () => {
    for (const markers of ['[1][2]', '[1] [2]']) {
      const { citations, rows } = setup([TIRES, ALIGNMENT]);
      const out = finalizeCitations(
        `Tire pressure is 32 psi ${markers}.`,
        citations,
        rows,
      );
      expect(out.answer).toBe('Tire pressure is 32 psi [1].');
      expect(out.citations.map((c) => c.chunk_id)).toEqual(['c1']);
    }
  });

  it('keeps a citation whose chunk has some of the values; step numbers are not values', () => {
    const { citations, rows } = setup([
      'Torque the bolt to 39 N·m.',
      '2. Remove the cover. 3. Torque to 39 N·m in 2 steps.',
    ]);
    const out = finalizeCitations(
      '**Step 2:** torque to 39 N·m [1]. Tighten in 2 passes [1].',
      citations,
      rows,
    );
    expect(out.citations.map((c) => c.chunk_id)).toEqual(['c1']);
    expect(out.grounding).toMatchObject({ repointed: 0, dropped: 0 });
  });

  it('keeps a correct citation when the sentence also names the model year or a page', () => {
    const { citations, rows } = setup([
      'Oil capacity with filter: 4.8 L (5.1 US qt).',
      '2003 model year changes. See page 8-6 for the oil filter, page 12 for torque.',
    ]);
    for (const answer of [
      'For the 2003 S2000, oil capacity with filter is 4.8 L (5.1 US qt) [1].',
      'Oil capacity with filter is 4.8 L (see page 8-6) [1].',
      'Oil capacity with filter is 4.8 L (see page 12) [1].',
    ]) {
      const out = finalizeCitations(answer, citations, rows);
      expect(out.citations.map((c) => c.chunk_id)).toEqual(['c1']);
      expect(out.grounding).toMatchObject({ repointed: 0, dropped: 0 });
    }
  });

  it('moves a partly matching citation to a chunk with every value, else keeps it', () => {
    const partial = 'Inflation table: 220 kPa maximum for towing.';
    const { citations, rows } = setup([partial, TIRES]);
    const moved = finalizeCitations(
      'Front: 32 psi (220 kPa) [1].',
      citations,
      rows,
    );
    expect(moved.citations.map((c) => c.chunk_id)).toEqual(['c2']);
    const only = setup([partial, ALIGNMENT]);
    const kept = finalizeCitations(
      'Front: 32 psi (220 kPa) [1].',
      only.citations,
      only.rows,
    );
    expect(kept.citations.map((c) => c.chunk_id)).toEqual(['c1']);
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
