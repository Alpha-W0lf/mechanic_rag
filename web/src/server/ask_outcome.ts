/** Ask success/failure shapes and thin insufficient-evidence helper. */

import type { Citation } from './citations';
import { INSUFFICIENT_EVIDENCE_ANSWER } from './citations';
import type { AskErrorClass } from './ask_errors';
import type { VisualAsset } from './page_assets';

export type AskSuccess = {
  answer: string;
  citations: Citation[];
  outcome: 'answered' | 'insufficient_evidence' | 'degraded';
  diagnostics: Record<string, unknown> | null;
  visual_assets: VisualAsset[];
  /** Present when outcome is `degraded` — the generator failure class. */
  error_class?: AskErrorClass;
};

export type AskFailure = {
  error: string;
  status: number;
  error_class?: AskErrorClass;
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
}): AskSuccess {
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
