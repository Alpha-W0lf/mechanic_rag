/**
 * JH-50: event:ask line shaping — CE skip, chunk-id cap, image noise.
 */
import { describe, expect, it } from 'vitest';
import {
  ASK_LOG_CHUNK_ID_CAP,
  buildAskLogLine,
  readGenAttempts,
} from '@/server/ask_log';
import { GeminiError } from '@/server/providers';

describe('buildAskLogLine', () => {
  it('omits ce_n / ce_k / ce_ranked_chunk_ids when ce_skip_reason is set', () => {
    const line = buildAskLogLine({
      outcome: 'answered',
      ce_skip_reason: 'hosted_ce_disabled',
      ce_n: 20,
      ce_k: 8,
      ce_ranked_chunk_ids: ['a', 'b', 'c'],
      pre_ce_shortlist_chunk_ids: ['a', 'b', 'c'],
      chunk_ids: ['a'],
    });
    expect(line.event).toBe('ask');
    expect(line.ce_skip_reason).toBe('hosted_ce_disabled');
    expect(line.ce_n).toBeUndefined();
    expect(line.ce_k).toBeUndefined();
    expect(line.ce_ranked_chunk_ids).toBeUndefined();
    expect(line.ce_ranked_chunk_ids_n).toBeUndefined();
    expect(line.pre_ce_shortlist_chunk_ids).toEqual(['a', 'b', 'c']);
    expect(line.pre_ce_shortlist_chunk_ids_n).toBe(3);
    expect(line.chunk_ids).toEqual(['a']);
    expect(line.chunk_ids_n).toBe(1);
  });

  it('keeps ce_n / ce_k / ce_ranked_chunk_ids when CE actually ran', () => {
    const line = buildAskLogLine({
      outcome: 'answered',
      ce_n: 20,
      ce_k: 8,
      ce_ranked_chunk_ids: ['a', 'b'],
    });
    expect(line.ce_n).toBe(20);
    expect(line.ce_k).toBe(8);
    expect(line.ce_ranked_chunk_ids).toEqual(['a', 'b']);
    expect(line.ce_ranked_chunk_ids_n).toBe(2);
  });

  it('caps every chunk-id list at 10 and records the full count', () => {
    const ids = Array.from({ length: 15 }, (_, i) => `c${i}`);
    const line = buildAskLogLine({
      chunk_ids: ids,
      pre_ce_shortlist_chunk_ids: ids,
      ce_ranked_chunk_ids: ids,
    });
    expect(line.chunk_ids).toEqual(ids.slice(0, ASK_LOG_CHUNK_ID_CAP));
    expect(line.chunk_ids_n).toBe(15);
    expect(line.pre_ce_shortlist_chunk_ids).toEqual(
      ids.slice(0, ASK_LOG_CHUNK_ID_CAP),
    );
    expect(line.pre_ce_shortlist_chunk_ids_n).toBe(15);
    expect(line.ce_ranked_chunk_ids).toEqual(ids.slice(0, ASK_LOG_CHUNK_ID_CAP));
    expect(line.ce_ranked_chunk_ids_n).toBe(15);
  });

  it('drops hosted image_degraded / clip_query_unavailable noise', () => {
    const line = buildAskLogLine({
      outcome: 'answered',
      image_degraded: true,
      image_degrade_reason: 'clip_query_unavailable',
      image_count: 0,
    });
    expect(line.image_degraded).toBeUndefined();
    expect(line.image_degrade_reason).toBeUndefined();
    expect(line.image_count).toBe(0);
  });

  it('drops image_channel_disabled the same way', () => {
    const line = buildAskLogLine({
      image_degraded: true,
      image_degrade_reason: 'image_channel_disabled',
    });
    expect(line.image_degraded).toBeUndefined();
    expect(line.image_degrade_reason).toBeUndefined();
  });

  it('keeps image_degraded when the image channel actually ran', () => {
    const empty = buildAskLogLine({
      image_degraded: true,
      image_degrade_reason: 'image_index_empty_or_no_hits',
    });
    expect(empty.image_degraded).toBe(true);
    expect(empty.image_degrade_reason).toBe('image_index_empty_or_no_hits');

    const err = buildAskLogLine({
      image_degraded: true,
      image_degrade_reason: 'image_search_error',
    });
    expect(err.image_degraded).toBe(true);
    expect(err.image_degrade_reason).toBe('image_search_error');
  });

  it('omits undefined fields and never adds question or raw error text', () => {
    const line = buildAskLogLine({
      outcome: 'degraded',
      error_class: 'generator_unavailable',
      gen_attempts: undefined,
      gen_ms: 12,
    });
    expect(line).toEqual({
      event: 'ask',
      outcome: 'degraded',
      error_class: 'generator_unavailable',
      gen_ms: 12,
    });
    expect(JSON.stringify(line)).not.toMatch(/question|password|postgres:\/\//i);
  });
});

describe('readGenAttempts', () => {
  it('reads 1–4 from GeminiError.attempts', () => {
    expect(readGenAttempts(new GeminiError('x', 503, 'UNAVAILABLE', 4))).toBe(4);
    expect(readGenAttempts(new GeminiError('x', 200, undefined, 1))).toBe(1);
    expect(readGenAttempts(new GeminiError('x'))).toBeUndefined();
    expect(readGenAttempts(new GeminiError('x', 503, 'UNAVAILABLE', 0))).toBe(
      undefined,
    );
    expect(readGenAttempts(new GeminiError('x', 503, 'UNAVAILABLE', 9))).toBe(
      undefined,
    );
  });
});
