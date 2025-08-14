import type { ScoredResult } from './types';

export function mmr(
  candidates: ScoredResult[],
  lambda: number = 0.4,
  finalK: number = 8,
): ScoredResult[] {
  const selected: ScoredResult[] = [];
  const pool = [...candidates];

  while (selected.length < finalK && pool.length > 0) {
    let bestIdx = 0;
    let bestScore = -Infinity;
    for (let i = 0; i < pool.length; i++) {
      const candidate = pool[i];
      const relevance = candidate.score; // assume normalized [0,1]
      let diversityPenalty = 0;
      for (const s of selected) {
        if (s.documentName === candidate.documentName && s.sectionPath === candidate.sectionPath) {
          diversityPenalty = Math.max(diversityPenalty, 1);
        }
      }
      const mmrScore = lambda * relevance - (1 - lambda) * diversityPenalty;
      if (mmrScore > bestScore) {
        bestScore = mmrScore;
        bestIdx = i;
      }
    }
    selected.push(pool.splice(bestIdx, 1)[0]);
  }

  return selected;
}


