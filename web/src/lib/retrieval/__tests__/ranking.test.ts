import { describe, expect, it } from 'vitest';
import { lexicalQueryFromQuestion } from '@/lib/retrieval/lexical_query';
import { reciprocalRankFusion } from '@/lib/retrieval/rrf';
import { sectionDedup } from '@/lib/retrieval/section_dedup';
import type { RetrieverHit, RrfResult } from '@/lib/retrieval/types';
import {
  applyCeScores,
  FakeCrossEncoder,
  logitsToPairScores,
  rerankWithDegrade,
  sortScoredChunkIds,
  summarizeCeScores,
  CE_SCORE_DEGENERATE_EPS,
} from '@/server/cross_encoder';
import {
  assembleContext,
  filterAnswerToKnownLabels,
} from '@/server/citations';
import { validateAskRequest } from '@/server/ask';

function hit(
  chunk_id: string,
  modality: 'vector' | 'lexical',
  score: number,
  section = 'A',
): RetrieverHit {
  return {
    chunk_id,
    document_id: 'doc1',
    content: `content for ${chunk_id}`,
    section_path: section,
    page_start: 1,
    page_end: 1,
    modality,
    retriever_score: score,
  };
}

describe('RRF', () => {
  it('fuses by stable chunk_id and uses rank-derived scores', () => {
    const vector = [hit('a', 'vector', 0.9), hit('b', 'vector', 0.8)];
    const lexical = [hit('b', 'lexical', 0.95), hit('c', 'lexical', 0.7)];
    const fused = reciprocalRankFusion(vector, lexical, 60, 50);
    expect(fused.map((x) => x.chunk_id)).toEqual(['b', 'a', 'c']);
    expect(fused[0].rrf_score).toBeGreaterThan(fused[1].rrf_score);
    // Not claiming [0,1] similarity — RRF sums can exceed 1 for multi-list hits
    expect(fused[0].rrf_score).toBeGreaterThan(0.01);
  });
});

describe('sectionDedup', () => {
  it('diversifies same-section candidates', () => {
    const candidates: RrfResult[] = [
      {
        chunk_id: '1',
        document_id: 'doc1',
        content: 'x',
        section_path: 'Oil',
        modality: 'fusion',
        rrf_score: 0.03,
      },
      {
        chunk_id: '2',
        document_id: 'doc1',
        content: 'y',
        section_path: 'Oil',
        modality: 'fusion',
        rrf_score: 0.02,
      },
      {
        chunk_id: '3',
        document_id: 'doc1',
        content: 'z',
        section_path: 'Clutch',
        modality: 'fusion',
        rrf_score: 0.015,
      },
    ];
    const out = sectionDedup(candidates, 0.4, 2);
    expect(out).toHaveLength(2);
    expect(out.map((c) => c.chunk_id)).toContain('1');
    expect(out.map((c) => c.chunk_id)).toContain('3');
  });
});

describe('CE degrade', () => {
  const base: RrfResult[] = [
    {
      chunk_id: 'a',
      document_id: 'd',
      content: 'oil torque 39',
      section_path: 'Oil',
      modality: 'fusion',
      rrf_score: 0.03,
    },
    {
      chunk_id: 'b',
      document_id: 'd',
      content: 'clutch play',
      section_path: 'Clutch',
      modality: 'fusion',
      rrf_score: 0.02,
    },
  ];

  it('success path reorders by ce_score', async () => {
    const ce = new FakeCrossEncoder('success');
    const result = await rerankWithDegrade('torque', base, ce, {
      topN: 20,
      topK: 2,
      timeoutMs: 1000,
    });
    expect(result.rerank_degraded).toBe(false);
    expect(result.results[0].chunk_id).toBe('b'); // reverse order from fake
  });

  it('timeout/failure degrades to RRF order', async () => {
    const ce = new FakeCrossEncoder('throw');
    const result = await rerankWithDegrade('torque', base, ce, {
      topN: 20,
      topK: 2,
      timeoutMs: 1000,
    });
    expect(result.rerank_degraded).toBe(true);
    expect(result.results.map((r) => r.chunk_id)).toEqual(['a', 'b']);
  });

  it('empty scores degrade', async () => {
    const ce = new FakeCrossEncoder('empty');
    const result = await rerankWithDegrade('torque', base, ce, {
      topN: 20,
      topK: 2,
      timeoutMs: 1000,
    });
    expect(result.rerank_degraded).toBe(true);
  });

  it('ignores unknown chunk ids from CE', () => {
    const ranked = applyCeScores(base, [{ chunk_id: 'nope', ce_score: 9 }], 2);
    expect(ranked).toBeNull();
  });

  it('sortScoredChunkIds returns full CE order without slicing to K', () => {
    const scores = [
      { chunk_id: 'a', ce_score: 1.0 },
      { chunk_id: 'b', ce_score: 9.0 },
    ];
    const full = sortScoredChunkIds(base, scores);
    expect(full).toEqual(['b', 'a']);
    const sliced = applyCeScores(base, scores, 1);
    expect(sliced?.map((r) => r.chunk_id)).toEqual(['b']);
  });

  it('success path exposes full ce_ranked_chunk_ids and score summary', async () => {
    const ce = new FakeCrossEncoder('success');
    const result = await rerankWithDegrade('torque', base, ce, {
      topN: 20,
      topK: 1,
      timeoutMs: 1000,
    });
    expect(result.results).toHaveLength(1);
    expect(result.ce_ranked_chunk_ids).toEqual(['b', 'a']);
    expect(result.pre_ce_shortlist_chunk_ids).toEqual(['a', 'b']);
    expect(result.ce_score_summary?.ce_score_degenerate).toBe(false);
  });
});

describe('CE logits helpers', () => {
  it('maps flat logits to pair scores and sorts by raw numeric order', () => {
    const scores = logitsToPairScores([8.66, -11.24], 2);
    expect(scores[0]).toBeCloseTo(8.66);
    expect(scores[1]).toBeCloseTo(-11.24);
    const ids = sortScoredChunkIds(
      [
        {
          chunk_id: 'neg',
          document_id: 'd',
          content: 'x',
          section_path: 'A',
          modality: 'fusion',
          rrf_score: 0.1,
        },
        {
          chunk_id: 'pos',
          document_id: 'd',
          content: 'y',
          section_path: 'B',
          modality: 'fusion',
          rrf_score: 0.09,
        },
      ],
      [
        { chunk_id: 'neg', ce_score: scores[1]! },
        { chunk_id: 'pos', ce_score: scores[0]! },
      ],
    );
    expect(ids).toEqual(['pos', 'neg']);
  });

  it('extracts first label from [batch, labels] tensor-shaped data', () => {
    const scores = logitsToPairScores(
      { data: [8.66, 0.1, -11.24, 0.2], dims: [2, 2] },
      2,
    );
    expect(scores).toEqual([8.66, -11.24]);
  });

  it('marks near-constant scores as degenerate', () => {
    const summary = summarizeCeScores([1.0, 1.0 + CE_SCORE_DEGENERATE_EPS / 2]);
    expect(summary?.ce_score_degenerate).toBe(true);
    const ok = summarizeCeScores([8.66, -11.24]);
    expect(ok?.ce_score_degenerate).toBe(false);
    expect(ok!.ce_score_max - ok!.ce_score_min).toBeGreaterThan(
      CE_SCORE_DEGENERATE_EPS,
    );
  });
});

describe('citations', () => {
  it('maps labels from DB rows only', () => {
    const rows = new Map([
      [
        'a',
        {
          chunk_id: 'a',
          document_id: 'doc1',
          vehicle_id: 'fixture:honda-s2000-demo',
          doc_family: 'service_manual',
          content: 'Oil drain plug torque is 39 N·m.',
          section_path: '1-1',
          page_start: 1,
          page_end: 1,
          document_name: 'demo',
        },
      ],
    ]);
    const { citations, labeledContext } = assembleContext(
      [
        {
          chunk_id: 'a',
          document_id: 'doc1',
          content: 'Oil drain plug torque is 39 N·m.',
          modality: 'fusion',
          rrf_score: 0.1,
        },
      ],
      rows,
    );
    expect(citations[0].label).toBe('1');
    expect(citations[0].chunk_id).toBe('a');
    expect(labeledContext).toContain('[1]');
  });

  it('rejects unknown citation labels from model output', () => {
    const citations = [
      {
        label: '1',
        chunk_id: 'a',
        vehicle_id: 'v',
        doc_family: 'service_manual',
        document_id: 'd',
        section_path: null,
        page_start: null,
        page_end: null,
      },
    ];
    const filtered = filterAnswerToKnownLabels('See [1] and [99]', citations);
    expect(filtered.citations.map((c) => c.label)).toEqual(['1']);
  });
});

describe('ask contract', () => {
  it('requires vehicle_id and question', () => {
    expect(validateAskRequest({ question: 'hi' }).ok).toBe(false);
    expect(validateAskRequest({ vehicle_id: 'v', question: 'hi' }).ok).toBe(
      true,
    );
  });

  it('rejects stub { query } shape', () => {
    const r = validateAskRequest({ query: 'old stub' });
    expect(r.ok).toBe(false);
  });
});

describe('lexical query for simple FTS', () => {
  it('strips stopwords so NL questions can match manual text', () => {
    expect(lexicalQueryFromQuestion('What is the oil drain plug torque?')).toBe(
      'oil drain plug torque',
    );
  });

  it('returns empty when only stopwords remain', () => {
    expect(lexicalQueryFromQuestion('What is the?')).toBe('');
  });
});
