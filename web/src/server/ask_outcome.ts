/** Thin ask outcome helpers — keep ask.ts under line budget. */

import type { Citation } from './citations';
import { INSUFFICIENT_EVIDENCE_ANSWER } from './citations';
import type { VisualAsset } from './page_assets';

type InsufficientAsk = {
  answer: string;
  citations: Citation[];
  outcome: 'insufficient_evidence';
  diagnostics: Record<string, unknown> | null;
  visual_assets: VisualAsset[];
};

export function insufficientEvidenceResult(input: {
  diagnosticsOn: boolean;
  requestId: string;
  vectorCount?: number;
  lexicalCount?: number;
  imageCount?: number;
  rrfSize?: number;
  dedupDrops?: number;
  forceRrfOnly?: boolean;
  imageDegraded?: boolean;
  imageReason?: string;
  minimal?: boolean;
}): InsufficientAsk {
  if (input.minimal) {
    return {
      answer: INSUFFICIENT_EVIDENCE_ANSWER,
      citations: [],
      outcome: 'insufficient_evidence',
      visual_assets: [],
      diagnostics: input.diagnosticsOn ? { request_id: input.requestId } : null,
    };
  }
  return {
    answer: INSUFFICIENT_EVIDENCE_ANSWER,
    citations: [],
    outcome: 'insufficient_evidence',
    visual_assets: [],
    diagnostics: input.diagnosticsOn
      ? {
          request_id: input.requestId,
          vector_count: input.vectorCount,
          lexical_count: input.lexicalCount,
          image_count: input.imageCount,
          rrf_size: input.rrfSize,
          dedup_drops: input.dedupDrops,
          rerank_degraded: false,
          ablation_rrf_only: input.forceRrfOnly,
          image_degraded: input.imageDegraded,
          image_degrade_reason: input.imageReason,
        }
      : null,
  };
}
