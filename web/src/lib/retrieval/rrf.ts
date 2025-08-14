import type { ScoredResult } from './types';

export function reciprocalRankFusion(
  vector: ScoredResult[],
  lexical: ScoredResult[],
  k: number = 60,
  topN: number = 50,
): ScoredResult[] {
  const clamp = (arr: ScoredResult[]) => arr.slice(0, topN);
  const v = clamp(vector);
  const l = clamp(lexical);
  const scores = new Map<string, { item: ScoredResult; score: number }>();

  const add = (items: ScoredResult[]) => {
    items.forEach((item, idx) => {
      const inc = 1 / (k + (idx + 1));
      const prev = scores.get(item.id)?.score ?? 0;
      scores.set(item.id, { item, score: prev + inc });
    });
  };

  add(v);
  add(l);

  return Array.from(scores.values())
    .sort((a, b) => b.score - a.score)
    .map((x) => ({ ...x.item, score: x.score, modality: 'fusion' }));
}


