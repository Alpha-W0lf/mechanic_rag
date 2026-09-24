/**
 * JH-42 test plan — public Ask abuse shield (Vitest).
 *
 * 1. Under the per-client + global ceilings → allow (store incremented).
 * 2. Over per-client minute or day → deny with reason + Retry-After seconds.
 * 3. Over global daily cap → deny even when the client is under its own caps.
 * 4. Limiter store failure (generic + missing table 42P01) → fail open.
 * 5. ASK_RATE_LIMIT_DISABLED=1 → no store calls, allow.
 * 6. Client identity is HMAC-SHA256(salt, ip); raw IP never appears in
 *    bucket ids or increment args (nothing to persist).
 * 7. Missing client IP shares the hashed "unknown" bucket (no bypass).
 * 8. Header preference: x-vercel-forwarded-for, then x-real-ip, then
 *    first x-forwarded-for hop.
 * 9. Env knobs change the ceilings; invalid values fall back to defaults.
 */
import { createHmac } from 'crypto';
import { readFileSync } from 'fs';
import path from 'path';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import {
  ASK_RATE_LIMIT_DEFAULTS,
  clientIpFromHeaders,
  consumeAskRateLimit,
  hashClientIp,
  incrementAskBucket,
  INCREMENT_BUCKET_SQL,
  isMissingRateLimitTable,
  PURGE_EXPIRED_SQL,
  resolveAskRateLimits,
} from '@/server/ask_rate_limit';

const query = vi.fn();

vi.mock('@/server/db', () => ({
  query: (...args: unknown[]) => query(...args),
}));

const SALT = 'unit-test-salt';
const IP = '203.0.113.10';

function headers(init?: Record<string, string>): Headers {
  return new Headers(init);
}

describe('resolveAskRateLimits', () => {
  it('uses documented defaults', () => {
    expect(resolveAskRateLimits({})).toEqual({
      perMinute: ASK_RATE_LIMIT_DEFAULTS.perMinute,
      perDay: ASK_RATE_LIMIT_DEFAULTS.perDay,
      globalDay: ASK_RATE_LIMIT_DEFAULTS.globalDay,
      disabled: false,
    });
    expect(resolveAskRateLimits({})).toEqual({
      perMinute: 10,
      perDay: 100,
      globalDay: 800,
      disabled: false,
    });
  });

  it('honors env ceilings and the local disable flag', () => {
    expect(
      resolveAskRateLimits({
        ASK_RATE_LIMIT_PER_MINUTE: '5',
        ASK_RATE_LIMIT_PER_DAY: '20',
        ASK_RATE_LIMIT_GLOBAL_DAY: '50',
        ASK_RATE_LIMIT_DISABLED: '1',
      }),
    ).toEqual({
      perMinute: 5,
      perDay: 20,
      globalDay: 50,
      disabled: true,
    });
  });

  it('falls back when env values are non-positive or non-numeric', () => {
    expect(
      resolveAskRateLimits({
        ASK_RATE_LIMIT_PER_MINUTE: '0',
        ASK_RATE_LIMIT_PER_DAY: '-3',
        ASK_RATE_LIMIT_GLOBAL_DAY: 'nope',
      }),
    ).toEqual({
      perMinute: 10,
      perDay: 100,
      globalDay: 800,
      disabled: false,
    });
  });
});

describe('hashClientIp / clientIpFromHeaders', () => {
  it('HMAC-SHA256 is deterministic and never equals the raw IP', () => {
    const hash = hashClientIp(IP, SALT);
    expect(hash).toBe(
      createHmac('sha256', SALT).update(IP.toLowerCase()).digest('hex'),
    );
    expect(hash).not.toContain(IP);
    expect(hash).toMatch(/^[0-9a-f]{64}$/);
    expect(hashClientIp(IP, 'other-salt')).not.toBe(hash);
  });

  it('prefers platform-set headers over spoofable x-forwarded-for', () => {
    expect(
      clientIpFromHeaders(
        headers({
          'x-vercel-forwarded-for': '198.51.100.9',
          'x-real-ip': '192.0.2.1',
          'x-forwarded-for': '203.0.113.1, 198.51.100.9',
        }),
      ),
    ).toBe('198.51.100.9');
    expect(
      clientIpFromHeaders(
        headers({
          'x-real-ip': '192.0.2.1',
          'x-forwarded-for': '203.0.113.1',
        }),
      ),
    ).toBe('192.0.2.1');
    expect(
      clientIpFromHeaders(headers({ 'x-forwarded-for': '203.0.113.1, 10.0.0.1' })),
    ).toBe('203.0.113.1');
    expect(clientIpFromHeaders(headers())).toBeNull();
  });
});

describe('isMissingRateLimitTable', () => {
  it('recognizes Postgres undefined_table (42P01)', () => {
    const err = Object.assign(new Error('relation "ask_rate_buckets" does not exist'), {
      code: '42P01',
    });
    expect(isMissingRateLimitTable(err)).toBe(true);
    expect(isMissingRateLimitTable(new Error('ECONNREFUSED'))).toBe(false);
  });
});

describe('consumeAskRateLimit', () => {
  const incrementBucket = vi.fn();
  const purgeExpired = vi.fn();
  const now = new Date('2026-09-24T15:04:05.000Z');

  beforeEach(() => {
    incrementBucket.mockReset();
    purgeExpired.mockReset();
    incrementBucket.mockResolvedValue(1);
    purgeExpired.mockResolvedValue(undefined);
  });

  afterEach(() => {
    vi.unstubAllEnvs();
  });

  const env = {
    ASK_RATE_LIMIT_SALT: SALT,
    ASK_RATE_LIMIT_PER_MINUTE: '10',
    ASK_RATE_LIMIT_PER_DAY: '100',
    ASK_RATE_LIMIT_GLOBAL_DAY: '800',
  };

  function consume(extra?: {
    hdrs?: Headers;
    increment?: typeof incrementBucket;
  }) {
    return consumeAskRateLimit({
      headers: extra?.hdrs ?? headers({ 'x-real-ip': IP }),
      now,
      env,
      incrementBucket: extra?.increment ?? incrementBucket,
      purgeExpired,
    });
  }

  it('allows a request under all ceilings and increments three hashed buckets', async () => {
    const result = await consume();
    expect(result).toEqual({ ok: true });
    expect(incrementBucket).toHaveBeenCalledTimes(3);
    const ids = incrementBucket.mock.calls.map((c) => String(c[0]));
    const hash = hashClientIp(IP, SALT);
    expect(ids).toEqual([
      `c:${hash}:m:${Math.floor(now.getTime() / 60_000)}`,
      `c:${hash}:d:20260924`,
      'g:d:20260924',
    ]);
    expect(JSON.stringify(incrementBucket.mock.calls)).not.toContain(IP);
    expect(purgeExpired).toHaveBeenCalledTimes(1);
  });

  it('returns 429-shaped deny when the per-client minute bucket is over', async () => {
    incrementBucket.mockImplementation(async (bucketId: string) => {
      return String(bucketId).includes(':m:') ? 11 : 1;
    });
    const result = await consume();
    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.reason).toBe('client_minute');
    // 15:04:05Z → 55s left in the UTC minute.
    expect(result.retryAfterSec).toBe(55);
  });

  it('returns deny when the per-client day bucket is over', async () => {
    incrementBucket.mockImplementation(async (bucketId: string) => {
      if (String(bucketId).includes(':d:') && String(bucketId).startsWith('c:')) {
        return 101;
      }
      return 1;
    });
    const result = await consume();
    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.reason).toBe('client_day');
    // 15:04:05Z → seconds until 2026-09-25T00:00:00Z
    expect(result.retryAfterSec).toBe(32_155);
  });

  it('returns deny when the global daily cap is over (client still under)', async () => {
    incrementBucket.mockImplementation(async (bucketId: string) => {
      return String(bucketId).startsWith('g:') ? 801 : 2;
    });
    const result = await consume();
    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.reason).toBe('global_day');
    expect(result.retryAfterSec).toBe(32_155);
  });

  it('fails open on a generic store error (does not take Ask down)', async () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
    incrementBucket.mockRejectedValue(new Error('connection terminated unexpectedly'));
    const result = await consume();
    expect(result).toEqual({ ok: true, failedOpen: true });
    expect(warn).toHaveBeenCalled();
    const payload = String(warn.mock.calls[0]?.[0]);
    expect(payload).toContain('fail_open');
    expect(payload).not.toContain(IP);
    expect(payload).not.toContain('connection terminated');
    warn.mockRestore();
  });

  it('fails open when the limiter table is missing (42P01)', async () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
    incrementBucket.mockRejectedValue(
      Object.assign(new Error('relation "ask_rate_buckets" does not exist'), {
        code: '42P01',
      }),
    );
    const result = await consume();
    expect(result).toEqual({ ok: true, failedOpen: true });
    expect(String(warn.mock.calls[0]?.[0])).toContain('undefined_table');
    warn.mockRestore();
  });

  it('skips the store when ASK_RATE_LIMIT_DISABLED=1', async () => {
    const result = await consumeAskRateLimit({
      headers: headers({ 'x-real-ip': IP }),
      now,
      env: { ...env, ASK_RATE_LIMIT_DISABLED: '1' },
      incrementBucket,
      purgeExpired,
    });
    expect(result).toEqual({ ok: true });
    expect(incrementBucket).not.toHaveBeenCalled();
    expect(purgeExpired).not.toHaveBeenCalled();
  });

  it('does not persist a raw IP when the client header is missing', async () => {
    await consume({ hdrs: headers() });
    const ids = incrementBucket.mock.calls.map((c) => String(c[0]));
    const hash = hashClientIp('unknown', SALT);
    expect(ids[0]).toBe(`c:${hash}:m:${Math.floor(now.getTime() / 60_000)}`);
    expect(JSON.stringify(incrementBucket.mock.calls)).not.toMatch(
      /\d{1,3}(?:\.\d{1,3}){3}/,
    );
  });
});

describe('limiter SQL surface', () => {
  it('upserts only bucket_id / hit_count / expires_at (no IP column)', () => {
    expect(INCREMENT_BUCKET_SQL).toMatch(/ask_rate_buckets/);
    expect(INCREMENT_BUCKET_SQL).toMatch(/ON CONFLICT \(bucket_id\)/i);
    expect(INCREMENT_BUCKET_SQL).not.toMatch(/\bip\b/i);
    expect(PURGE_EXPIRED_SQL).toMatch(/expires_at\s*</i);
    expect(PURGE_EXPIRED_SQL).not.toMatch(/\bip\b/i);
  });

  it('migration SQL is idempotent and has no IP column', () => {
    const sql = readFileSync(
      path.resolve(__dirname, '../../../../db/migrations/003_ask_rate_limit.sql'),
      'utf8',
    );
    expect(sql).toMatch(/CREATE TABLE IF NOT EXISTS ask_rate_buckets/);
    expect(sql).toMatch(/CREATE INDEX IF NOT EXISTS idx_ask_rate_buckets_expires_at/);
    expect(sql).toMatch(/DELETE FROM ask_rate_buckets WHERE expires_at < now\(\)/);
    expect(sql).toMatch(/bucket_id TEXT PRIMARY KEY/);
    expect(sql).not.toMatch(/^\s+ip\s/im);
  });

  it('incrementAskBucket binds only bucket_id + expires_at (never a raw IP)', async () => {
    query.mockReset();
    query.mockResolvedValue({ rows: [{ hit_count: 3 }] });
    const expires = new Date('2026-09-24T15:05:00.000Z');
    const hash = hashClientIp(IP, SALT);
    await incrementAskBucket(`c:${hash}:m:1`, expires);
    expect(query).toHaveBeenCalledWith(INCREMENT_BUCKET_SQL, [
      `c:${hash}:m:1`,
      expires.toISOString(),
    ]);
    expect(JSON.stringify(query.mock.calls)).not.toContain(IP);
  });
});
