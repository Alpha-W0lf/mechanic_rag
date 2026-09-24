/**
 * Hosted vs local Compose pool selection (JH-37).
 * Uses placeholder hosts only — never real project refs.
 */
import { describe, expect, it } from 'vitest';
import {
  HOSTED_POOL_LIMITS,
  LOCAL_COMPOSE_DATABASE_URL,
  LOCAL_POOL_LIMITS,
  resolvePoolConfig,
} from '@/server/db';

const LOCAL_URL = LOCAL_COMPOSE_DATABASE_URL;
const TRANSACTION_URL =
  'postgres://postgres.example:secret@aws-0-us-east-1.pooler.supabase.com:6543/postgres';
const SESSION_URL =
  'postgres://postgres.example:secret@aws-0-us-east-1.pooler.supabase.com:5432/postgres';
const DIRECT_URL =
  'postgres://postgres:secret@db.example.supabase.co:5432/postgres';

describe('resolvePoolConfig', () => {
  it('uses unchanged Compose limits for the default localhost:5433 URL', () => {
    const cfg = resolvePoolConfig({
      DATABASE_URL: LOCAL_URL,
      DB_TIMEOUT_MS: '5000',
    });
    expect(cfg.profile).toBe('local_compose');
    expect(cfg.connectionString).toBe(LOCAL_URL);
    expect(cfg.max).toBe(LOCAL_POOL_LIMITS.max);
    expect(cfg.max).toBe(10);
    expect(cfg.idleTimeoutMillis).toBe(LOCAL_POOL_LIMITS.idleTimeoutMillis);
    expect(cfg.idleTimeoutMillis).toBe(30_000);
    expect(cfg.connectionTimeoutMillis).toBe(5000);
    expect(cfg.ssl).toBeUndefined();
    expect(cfg.attachToVercelLifecycle).toBe(false);
  });

  it('treats missing DATABASE_URL as local Compose', () => {
    const cfg = resolvePoolConfig({});
    expect(cfg.profile).toBe('local_compose');
    expect(cfg.connectionString).toBe(LOCAL_URL);
    expect(cfg.max).toBe(10);
    expect(cfg.idleTimeoutMillis).toBe(30_000);
    expect(cfg.ssl).toBeUndefined();
  });

  it('treats 127.0.0.1:5433 as local Compose (no SSL, max 10)', () => {
    const cfg = resolvePoolConfig({
      DATABASE_URL: 'postgres://mechanic:mechanic@127.0.0.1:5433/mechanic_rag',
    });
    expect(cfg.profile).toBe('local_compose');
    expect(cfg.max).toBe(10);
    expect(cfg.idleTimeoutMillis).toBe(30_000);
    expect(cfg.ssl).toBeUndefined();
    expect(cfg.attachToVercelLifecycle).toBe(false);
  });

  it('does not treat VERCEL as hosted when the URL is still Compose localhost', () => {
    const cfg = resolvePoolConfig({
      DATABASE_URL: LOCAL_URL,
      VERCEL: '1',
    });
    expect(cfg.profile).toBe('local_compose');
    expect(cfg.attachToVercelLifecycle).toBe(false);
  });

  it('uses hosted limits for Supavisor transaction mode (port 6543)', () => {
    const cfg = resolvePoolConfig({
      DATABASE_URL: TRANSACTION_URL,
      DB_TIMEOUT_MS: '5000',
      VERCEL: '1',
    });
    expect(cfg.profile).toBe('hosted_serverless');
    expect(cfg.max).toBe(HOSTED_POOL_LIMITS.max);
    expect(cfg.max).toBe(2);
    expect(cfg.idleTimeoutMillis).toBe(HOSTED_POOL_LIMITS.idleTimeoutMillis);
    expect(cfg.idleTimeoutMillis).toBe(5_000);
    expect(cfg.connectionTimeoutMillis).toBe(5000);
    expect(cfg.ssl).toEqual({ rejectUnauthorized: false });
    expect(cfg.attachToVercelLifecycle).toBe(true);
  });

  it('applies the same hosted limits to session-mode pooler (port 5432)', () => {
    const cfg = resolvePoolConfig({
      DATABASE_URL: SESSION_URL,
      VERCEL: '1',
    });
    expect(cfg.profile).toBe('hosted_serverless');
    expect(cfg.max).toBe(2);
    expect(cfg.idleTimeoutMillis).toBe(5_000);
    expect(cfg.ssl).toEqual({ rejectUnauthorized: false });
    expect(cfg.attachToVercelLifecycle).toBe(true);
  });

  it('applies the same hosted limits to a direct db host (port 5432)', () => {
    const cfg = resolvePoolConfig({
      DATABASE_URL: DIRECT_URL,
    });
    expect(cfg.profile).toBe('hosted_serverless');
    expect(cfg.max).toBe(2);
    expect(cfg.idleTimeoutMillis).toBe(5_000);
    expect(cfg.ssl).toEqual({ rejectUnauthorized: false });
    expect(cfg.attachToVercelLifecycle).toBe(false);
  });

  it('honors DB_TIMEOUT_MS for both profiles', () => {
    expect(
      resolvePoolConfig({
        DATABASE_URL: LOCAL_URL,
        DB_TIMEOUT_MS: '2500',
      }).connectionTimeoutMillis,
    ).toBe(2500);
    expect(
      resolvePoolConfig({
        DATABASE_URL: TRANSACTION_URL,
        DB_TIMEOUT_MS: '8000',
      }).connectionTimeoutMillis,
    ).toBe(8000);
  });
});
