/**
 * One-line `event:ask` structured log (JH-50).
 *
 * Always-on for handleAsk outcomes and the pre-Ask abuse-shield 429.
 * Never writes chunk bodies, question text, IPs, salts, keys, or
 * connection strings. Public HTTP `diagnostics` is gated elsewhere.
 */

export const ASK_LOG_CHUNK_ID_CAP = 10;
export const ASK_LOG_GEN_ATTEMPTS_MAX = 4;

/** Image channel never actually ran — hosted CLIP miss or ablation off. */
const IMAGE_CHANNEL_NOISE_REASONS = new Set([
  'clip_query_unavailable',
  'image_channel_disabled',
]);

const CHUNK_ID_LIST_KEYS = [
  'chunk_ids',
  'pre_ce_shortlist_chunk_ids',
  'ce_ranked_chunk_ids',
] as const;

const CE_SKIP_OMIT = ['ce_n', 'ce_k', 'ce_ranked_chunk_ids'] as const;

export function readGenAttempts(err: unknown): number | undefined {
  if (!err || typeof err !== 'object') return undefined;
  const n = (err as { attempts?: unknown }).attempts;
  if (typeof n !== 'number' || !Number.isFinite(n)) return undefined;
  const i = Math.trunc(n);
  if (i < 1 || i > ASK_LOG_GEN_ATTEMPTS_MAX) return undefined;
  return i;
}

export function buildAskLogLine(
  fields: Record<string, unknown>,
): Record<string, unknown> {
  const line: Record<string, unknown> = { event: 'ask' };
  for (const [key, value] of Object.entries(fields)) {
    if (value === undefined) continue;
    line[key] = value;
  }

  const imageReason = line.image_degrade_reason;
  if (
    typeof imageReason === 'string' &&
    IMAGE_CHANNEL_NOISE_REASONS.has(imageReason)
  ) {
    delete line.image_degraded;
    delete line.image_degrade_reason;
  }

  if (line.ce_skip_reason) {
    for (const key of CE_SKIP_OMIT) {
      delete line[key];
    }
  }

  for (const key of CHUNK_ID_LIST_KEYS) {
    if (!(key in line)) continue;
    const raw = line[key];
    if (!Array.isArray(raw)) {
      delete line[key];
      continue;
    }
    const ids = raw.filter((id): id is string => typeof id === 'string');
    line[key] = ids.slice(0, ASK_LOG_CHUNK_ID_CAP);
    line[`${key}_n`] = ids.length;
  }

  return line;
}

export function logAsk(fields: Record<string, unknown>): void {
  console.log(JSON.stringify(buildAskLogLine(fields)));
}
