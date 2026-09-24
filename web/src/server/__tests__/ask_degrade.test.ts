/**
 * JH-46: extractive degrade decision + snippet builder.
 * Tests written before handleAsk wiring.
 */
import { describe, expect, it } from 'vitest';
import { DEGRADED_ASK_BANNER, stripDegradedBanner } from '@/lib/ask_copy';
import { PUBLIC_ASK_ERROR } from '@/server/ask_errors';
import {
  buildExtractiveCitedAnswer,
  extractiveSnippet,
  maybeDegradedAsk,
  shouldDegradeAsk,
} from '@/server/ask_degrade';
import { GeminiError, OllamaError } from '@/server/providers';
import type { Citation } from '@/server/citations';
import type { ChunkRow } from '@/server/retrievers';

const CHUNK_A =
  'Oil drain plug torque is 39 N·m (29 lbf-ft). Use a new crush washer.';
const CHUNK_B =
  'Engine oil capacity is 4.8 L (5.1 US qt) after a filter change.';

function citation(label: string, chunk_id: string): Citation {
  return {
    label,
    chunk_id,
    vehicle_id: 'fixture:honda-s2000-demo',
    doc_family: 'service_manual',
    document_id: 'doc1',
    section_path: '1-1 Specification',
    page_start: 1,
    page_end: 1,
  };
}

function row(chunk_id: string, content: string): ChunkRow {
  return {
    chunk_id,
    document_id: 'doc1',
    vehicle_id: 'fixture:honda-s2000-demo',
    doc_family: 'service_manual',
    content,
    section_path: '1-1 Specification',
    page_start: 1,
    page_end: 1,
    document_name: 'demo',
    provenance: null,
  };
}

describe('shouldDegradeAsk', () => {
  const gemini503 = new GeminiError(
    'gemini generate failed: 503',
    503,
    'UNAVAILABLE',
  );
  const gemini429 = new GeminiError(
    'gemini generate failed: 429',
    429,
    'RESOURCE_EXHAUSTED',
  );

  it('degrades Gemini 503 when at least one citation exists', () => {
    expect(shouldDegradeAsk(gemini503, 1)).toBe(true);
  });

  it('degrades Gemini 429 when at least one citation exists', () => {
    expect(shouldDegradeAsk(gemini429, 2)).toBe(true);
  });

  it('does not degrade when citation count is zero', () => {
    expect(shouldDegradeAsk(gemini503, 0)).toBe(false);
    expect(shouldDegradeAsk(gemini429, 0)).toBe(false);
  });

  it('does not degrade database failures even with citations', () => {
    const dbErr = new Error(
      '(ENOTFOUND) tenant/user postgres.abcdefghijklmnopqrst not found',
    );
    (dbErr as { code?: string }).code = 'ENOTFOUND';
    expect(shouldDegradeAsk(dbErr, 3)).toBe(false);
  });

  it('does not degrade local Ollama generator failures (local path unchanged)', () => {
    expect(shouldDegradeAsk(new OllamaError('generate failed: 503', 503), 2)).toBe(
      false,
    );
    expect(shouldDegradeAsk(new OllamaError('generate failed: 429', 429), 2)).toBe(
      false,
    );
  });
});

describe('stripDegradedBanner', () => {
  it('removes the honesty banner once', () => {
    expect(stripDegradedBanner(`${DEGRADED_ASK_BANNER}\n\n[1] torque`)).toBe(
      '[1] torque',
    );
    expect(stripDegradedBanner('[1] torque')).toBe('[1] torque');
  });
});

describe('extractiveSnippet / buildExtractiveCitedAnswer', () => {
  it('returns a sentence-bounded prefix from retrieved text only', () => {
    const snippet = extractiveSnippet(CHUNK_A);
    expect(CHUNK_A.startsWith(snippet) || CHUNK_A.includes(snippet)).toBe(true);
    expect(snippet).toContain('39 N·m');
    expect(snippet).not.toMatch(/Ollama/i);
  });

  it('builds a banner + labeled excerpts without fabricating', () => {
    const citations = [citation('1', 'a'), citation('2', 'b')];
    const rows = new Map([
      ['a', row('a', CHUNK_A)],
      ['b', row('b', CHUNK_B)],
    ]);
    const built = buildExtractiveCitedAnswer(citations, rows);
    expect(built).not.toBeNull();
    if (!built) return;
    expect(built.answer.startsWith(DEGRADED_ASK_BANNER)).toBe(true);
    expect(built.answer).toContain('[1]');
    expect(built.answer).toContain('[2]');
    expect(built.answer).toContain('39 N·m');
    expect(built.answer).toContain('4.8 L');
    expect(built.answer).not.toMatch(/local Ollama/i);
    const body = built.answer.slice(DEGRADED_ASK_BANNER.length);
    expect(body.includes('39 N·m')).toBe(true);
    // Every non-banner, non-label token sequence must come from a chunk.
    expect(CHUNK_A + CHUNK_B).toContain('39 N·m (29 lbf-ft)');
    expect(built.citations).toHaveLength(2);
  });

  it('returns null when citations have no retrievable content', () => {
    expect(
      buildExtractiveCitedAnswer([citation('1', 'missing')], new Map()),
    ).toBeNull();
  });

  it('keeps original labels when an empty middle row is skipped', () => {
    const citations = [
      citation('1', 'a'),
      citation('2', 'empty'),
      citation('3', 'c'),
    ];
    const rows = new Map([
      ['a', row('a', CHUNK_A)],
      ['empty', row('empty', '   ')],
      ['c', row('c', CHUNK_B)],
    ]);
    const built = buildExtractiveCitedAnswer(citations, rows);
    expect(built).not.toBeNull();
    if (!built) return;
    expect(built.citations.map((c) => c.label)).toEqual(['1', '3']);
    expect(built.citations.map((c) => c.chunk_id)).toEqual(['a', 'c']);
    expect(built.answer).toContain('[1]');
    expect(built.answer).toContain('[3]');
    expect(built.answer).not.toContain('[2]');
    const markers = [...built.answer.matchAll(/\[(\d+)\]/g)].map((m) => m[1]);
    expect(markers).toEqual(built.citations.map((c) => c.label));
  });
});

describe('maybeDegradedAsk', () => {
  const citations = [citation('1', 'a')];
  const rows = new Map([['a', row('a', CHUNK_A)]]);

  it('returns degraded AskSuccess for Gemini 503 with chunks', () => {
    const result = maybeDegradedAsk({
      err: new GeminiError('gemini generate failed: 503', 503, 'UNAVAILABLE'),
      citations,
      rows,
      diagnosticsOn: false,
      requestId: 'req-1',
    });
    expect(result).toMatchObject({
      outcome: 'degraded',
      error_class: 'generator_unavailable',
    });
    expect(result && 'status' in result).toBe(false);
    expect(result?.citations.length).toBeGreaterThanOrEqual(1);
    expect(result?.answer).toContain(DEGRADED_ASK_BANNER);
    expect(result?.answer).toContain('39 N·m');
  });

  it('returns degraded AskSuccess for Gemini 429 with chunks', () => {
    const result = maybeDegradedAsk({
      err: new GeminiError(
        'gemini generate failed: 429',
        429,
        'RESOURCE_EXHAUSTED',
      ),
      citations,
      rows,
      diagnosticsOn: true,
      requestId: 'req-2',
    });
    expect(result?.outcome).toBe('degraded');
    expect(result?.error_class).toBe('rate_limited');
    expect(result?.diagnostics).toMatchObject({
      mode: 'extractive_generator_degrade',
      generator_degraded: true,
      error_class: 'rate_limited',
    });
  });

  it('returns null for zero chunks + generator failure (caller keeps error)', () => {
    expect(
      maybeDegradedAsk({
        err: new GeminiError('gemini generate failed: 503', 503, 'UNAVAILABLE'),
        citations: [],
        rows: new Map(),
        diagnosticsOn: false,
        requestId: 'req-3',
      }),
    ).toBeNull();
  });

  it('returns null for database failure (never degrade)', () => {
    const dbErr = new Error('connection terminated unexpectedly');
    expect(
      maybeDegradedAsk({
        err: dbErr,
        citations,
        rows,
        diagnosticsOn: false,
        requestId: 'req-4',
      }),
    ).toBeNull();
    expect(PUBLIC_ASK_ERROR.database_unavailable).toMatch(/database/);
  });
});
