import type { RrfResult } from './types';

/**
 * Section diversification after RRF and before CE.
 * Same document_id + section_path → binary penalty (not true embedding MMR).
 * Enabled by default in the ask path; optional env may disable.
 */
export function sectionDedup(
  candidates: RrfResult[],
  lambda: number = 0.4,
  finalK: number = 20,
): RrfResult[] {
  const selected: RrfResult[] = [];
  const pool = [...candidates];

  while (selected.length < finalK && pool.length > 0) {
    let bestIdx = 0;
    let bestScore = -Infinity;
    for (let i = 0; i < pool.length; i++) {
      const candidate = pool[i];
      const relevance = candidate.rrf_score;
      let diversityPenalty = 0;
      for (const s of selected) {
        if (
          s.document_id === candidate.document_id &&
          s.section_path === candidate.section_path
        ) {
          diversityPenalty = Math.max(diversityPenalty, 1);
        }
      }
      const diversifyScore = lambda * relevance - (1 - lambda) * diversityPenalty;
      if (diversifyScore > bestScore) {
        bestScore = diversifyScore;
        bestIdx = i;
      }
    }
    selected.push(pool.splice(bestIdx, 1)[0]);
  }

  return selected;
}
