import type { RetrieverHit, RrfResult } from './types';

/**
 * Reciprocal Rank Fusion over two independent ranked lists.
 * Uses ranks only: rrf_score(id) += 1 / (k + rank). Not [0,1] similarity.
 */
export function reciprocalRankFusion(
  vector: RetrieverHit[],
  lexical: RetrieverHit[],
  k: number = 60,
  topN: number = 50,
): RrfResult[] {
  const clamp = (arr: RetrieverHit[]) => arr.slice(0, topN);
  const v = clamp(vector);
  const l = clamp(lexical);
  const scores = new Map<string, { item: RetrieverHit; rrf_score: number }>();

  const add = (items: RetrieverHit[]) => {
    items.forEach((item, idx) => {
      const inc = 1 / (k + (idx + 1));
      const prev = scores.get(item.chunk_id);
      if (prev) {
        prev.rrf_score += inc;
      } else {
        scores.set(item.chunk_id, { item, rrf_score: inc });
      }
    });
  };

  add(v);
  add(l);

  return Array.from(scores.values())
    .sort((a, b) => b.rrf_score - a.rrf_score)
    .map(({ item, rrf_score }) => ({
      chunk_id: item.chunk_id,
      document_id: item.document_id,
      document_name: item.document_name,
      section_path: item.section_path,
      page_start: item.page_start,
      page_end: item.page_end,
      content: item.content,
      vehicle_id: item.vehicle_id,
      doc_family: item.doc_family,
      modality: 'fusion' as const,
      rrf_score,
    }));
}
