/**
 * M2 image retrieve channel — fail-open to empty list.
 *
 * Business rules:
  - MECHANIC_IMAGE_CHANNEL=0 → skip (ablation off).
  - Missing CLIP embed or empty index → empty hits (text RRF unchanged).
  - Hits always carry paired text chunk content (Option A).
 */

import type { RetrieverHit } from '@/lib/retrieval/types';
import { embedClipQueryText } from './clip_query';
import { imageSearch } from './retrievers';

export type ImageChannelResult = {
  hits: RetrieverHit[];
  ms: number;
  degraded: boolean;
  reason?: string;
  model?: string;
};

export function isImageChannelEnabled(
  env: NodeJS.ProcessEnv = process.env,
): boolean {
  return env.MECHANIC_IMAGE_CHANNEL !== '0';
}

export async function retrieveImageChannel(input: {
  vehicleId: string;
  question: string;
  topN: number;
  docFamily?: string;
}): Promise<ImageChannelResult> {
  const t0 = Date.now();
  if (!isImageChannelEnabled()) {
    return {
      hits: [],
      ms: Date.now() - t0,
      degraded: true,
      reason: 'image_channel_disabled',
    };
  }

  const clip = await embedClipQueryText(input.question);
  if (!clip) {
    return {
      hits: [],
      ms: Date.now() - t0,
      degraded: true,
      reason: 'clip_query_unavailable',
    };
  }

  try {
    const hits = await imageSearch(
      input.vehicleId,
      clip.embedding,
      input.topN,
      input.docFamily,
    );
    return {
      hits,
      ms: Date.now() - t0,
      degraded: hits.length === 0,
      reason: hits.length === 0 ? 'image_index_empty_or_no_hits' : undefined,
      model: clip.model,
    };
  } catch {
    return {
      hits: [],
      ms: Date.now() - t0,
      degraded: true,
      reason: 'image_search_error',
      model: clip.model,
    };
  }
}
