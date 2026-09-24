/**
 * JH-42 public Ask abuse shield — hashed-IP + global fixed windows in Postgres.
 *
 * Fail-open: a missing table (migration not applied yet) or any limiter-store
 * error logs a warning and allows the Ask. A limiter hiccup must not become
 * a full Ask outage. Abuse then degrades to the existing Gemini/DB failures
 * until the table exists.
 *
 * Never persist a raw IP. Bucket keys are HMAC-SHA256(salt, ip).
 */
import { createHmac } from 'crypto';
import { query } from './db';

export const ASK_RATE_LIMIT_DEFAULTS = {
  perMinute: 10,
  perDay: 100,
  globalDay: 800,
} as const;

/** Used only when ASK_RATE_LIMIT_SALT is unset — still not a raw IP. */
export const ASK_RATE_LIMIT_FALLBACK_SALT = 'mechanic-rag-ask-rate-limit-v1';

export const INCREMENT_BUCKET_SQL = `
INSERT INTO ask_rate_buckets (bucket_id, hit_count, expires_at)
VALUES ($1, 1, $2)
ON CONFLICT (bucket_id) DO UPDATE
SET hit_count = ask_rate_buckets.hit_count + 1
RETURNING hit_count
`;

export const PURGE_EXPIRED_SQL = `
DELETE FROM ask_rate_buckets WHERE expires_at < $1
`;

export type AskRateLimits = {
  perMinute: number;
  perDay: number;
  globalDay: number;
  disabled: boolean;
};

export type AskRateLimitDenyReason =
  | 'client_minute'
  | 'client_day'
  | 'global_day';

export type AskRateLimitResult =
  | { ok: true; failedOpen?: boolean }
  | { ok: false; retryAfterSec: number; reason: AskRateLimitDenyReason };

export type IncrementBucket = (
  bucketId: string,
  expiresAt: Date,
) => Promise<number>;

export type PurgeExpired = (now: Date) => Promise<void>;

export type ConsumeAskRateLimitInput = {
  headers: Headers;
  now?: Date;
  env?: NodeJS.Dict<string>;
  incrementBucket?: IncrementBucket;
  purgeExpired?: PurgeExpired;
};

function envPositiveInt(
  env: NodeJS.Dict<string>,
  key: string,
  fallback: number,
): number {
  const raw = env[key];
  if (raw == null || raw === '') return fallback;
  const n = Number(raw);
  if (!Number.isFinite(n) || n < 1) return fallback;
  return Math.floor(n);
}

export function resolveAskRateLimits(
  env: NodeJS.Dict<string> = process.env,
): AskRateLimits {
  return {
    perMinute: envPositiveInt(
      env,
      'ASK_RATE_LIMIT_PER_MINUTE',
      ASK_RATE_LIMIT_DEFAULTS.perMinute,
    ),
    perDay: envPositiveInt(
      env,
      'ASK_RATE_LIMIT_PER_DAY',
      ASK_RATE_LIMIT_DEFAULTS.perDay,
    ),
    globalDay: envPositiveInt(
      env,
      'ASK_RATE_LIMIT_GLOBAL_DAY',
      ASK_RATE_LIMIT_DEFAULTS.globalDay,
    ),
    disabled: env.ASK_RATE_LIMIT_DISABLED === '1',
  };
}

export function hashClientIp(ip: string, salt: string): string {
  return createHmac('sha256', salt).update(ip.trim().toLowerCase()).digest('hex');
}

function firstHeaderValue(headers: Headers, name: string): string | null {
  const raw = headers.get(name);
  if (!raw) return null;
  const first = raw.split(',')[0]?.trim();
  return first || null;
}

/**
 * Prefer platform-set headers. x-forwarded-for first-hop is last resort
 * because a client can prepend spoofed hops; the global daily cap is the
 * backstop if per-client identity is wrong.
 */
export function clientIpFromHeaders(headers: Headers): string | null {
  return (
    firstHeaderValue(headers, 'x-vercel-forwarded-for') ||
    firstHeaderValue(headers, 'x-real-ip') ||
    firstHeaderValue(headers, 'x-forwarded-for')
  );
}

export function isMissingRateLimitTable(err: unknown): boolean {
  if (!err || typeof err !== 'object') return false;
  const code = (err as { code?: unknown }).code;
  if (code === '42P01') return true;
  const msg = err instanceof Error ? err.message : String(err);
  return /relation .*ask_rate_buckets.* does not exist/i.test(msg);
}

let missingSaltWarned = false;

function resolveSalt(env: NodeJS.Dict<string>): string {
  const salt = env.ASK_RATE_LIMIT_SALT?.trim();
  if (salt) return salt;
  if (!missingSaltWarned) {
    missingSaltWarned = true;
    console.warn(
      JSON.stringify({
        event: 'ask_rate_limit',
        warning: 'missing_salt',
      }),
    );
  }
  return ASK_RATE_LIMIT_FALLBACK_SALT;
}

function utcMinuteId(now: Date): number {
  return Math.floor(now.getTime() / 60_000);
}

function utcDayId(now: Date): string {
  const y = now.getUTCFullYear();
  const m = String(now.getUTCMonth() + 1).padStart(2, '0');
  const d = String(now.getUTCDate()).padStart(2, '0');
  return `${y}${m}${d}`;
}

function minuteExpiresAt(now: Date): Date {
  return new Date((utcMinuteId(now) + 2) * 60_000);
}

function dayExpiresAt(now: Date): Date {
  return new Date(
    Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate() + 2),
  );
}

function secondsUntilNextUtcMinute(now: Date): number {
  return Math.max(1, 60 - now.getUTCSeconds());
}

function secondsUntilNextUtcDay(now: Date): number {
  const next = Date.UTC(
    now.getUTCFullYear(),
    now.getUTCMonth(),
    now.getUTCDate() + 1,
  );
  return Math.max(1, Math.ceil((next - now.getTime()) / 1000));
}

export async function incrementAskBucket(
  bucketId: string,
  expiresAt: Date,
): Promise<number> {
  const res = await query<{ hit_count: number }>(INCREMENT_BUCKET_SQL, [
    bucketId,
    expiresAt.toISOString(),
  ]);
  const count = res.rows[0]?.hit_count;
  if (typeof count !== 'number') {
    throw new Error('ask_rate_limit_increment_empty');
  }
  return count;
}

export async function purgeExpiredAskBuckets(now: Date): Promise<void> {
  await query(PURGE_EXPIRED_SQL, [now.toISOString()]);
}

async function bestEffortPurge(purge: PurgeExpired, now: Date): Promise<void> {
  try {
    await purge(now);
  } catch {
    // TTL cleanup is best-effort; a failed DELETE must not block Ask.
  }
}

// Security residual: fail-open logging emits presence/reason only; never logs or prints ASK_RATE_LIMIT_SALT.
function logFailOpen(kind: 'undefined_table' | 'store_error'): void {
  console.warn(
    JSON.stringify({
      event: 'ask_rate_limit',
      warning: 'fail_open',
      reason: kind,
    }),
  );
}

export async function consumeAskRateLimit(
  input: ConsumeAskRateLimitInput,
): Promise<AskRateLimitResult> {
  const env = input.env ?? process.env;
  const limits = resolveAskRateLimits(env);
  if (limits.disabled) return { ok: true };

  const now = input.now ?? new Date();
  const increment = input.incrementBucket ?? incrementAskBucket;
  const purge = input.purgeExpired ?? purgeExpiredAskBuckets;
  const salt = resolveSalt(env);
  const ip = clientIpFromHeaders(input.headers) ?? 'unknown';
  const hash = hashClientIp(ip, salt);
  const minuteId = utcMinuteId(now);
  const dayId = utcDayId(now);

  try {
    // Admission order (do not let denied client traffic fill the global
    // cap — that would 429 everyone until UTC midnight without spending
    // Gemini quota). Sequential on the hosted pool (max 2).
    //
    // 1) Increment client minute. Over → deny; skip day and global.
    // 2) Increment client day. Over → deny; skip global.
    // 3) Increment global only after both client checks admitted.
    // Skipping the day increment on a minute deny is deliberate: a
    // rejected burst must not burn the client's 100/day either.
    const minuteCount = await increment(
      `c:${hash}:m:${minuteId}`,
      minuteExpiresAt(now),
    );
    if (minuteCount > limits.perMinute) {
      await bestEffortPurge(purge, now);
      return {
        ok: false,
        reason: 'client_minute',
        retryAfterSec: secondsUntilNextUtcMinute(now),
      };
    }

    const dayCount = await increment(`c:${hash}:d:${dayId}`, dayExpiresAt(now));
    if (dayCount > limits.perDay) {
      await bestEffortPurge(purge, now);
      return {
        ok: false,
        reason: 'client_day',
        retryAfterSec: secondsUntilNextUtcDay(now),
      };
    }

    const globalCount = await increment(`g:d:${dayId}`, dayExpiresAt(now));
    await bestEffortPurge(purge, now);
    if (globalCount > limits.globalDay) {
      return {
        ok: false,
        reason: 'global_day',
        retryAfterSec: secondsUntilNextUtcDay(now),
      };
    }
    return { ok: true };
  } catch (err) {
    logFailOpen(isMissingRateLimitTable(err) ? 'undefined_table' : 'store_error');
    return { ok: true, failedOpen: true };
  }
}
