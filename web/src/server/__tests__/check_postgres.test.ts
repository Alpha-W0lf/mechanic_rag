/**
 * Characterization: checkPostgres must never throw past the health route.
 * RCA: Pool.connect() sat outside try → empty HTTP 500 on pooler FATAL.
 */
import { describe, expect, it, vi } from 'vitest';
import { checkPostgres } from '@/server/db';
import type { PoolClient } from 'pg';

function clientStub(queryImpl: () => Promise<unknown>): PoolClient {
  return {
    query: vi.fn(queryImpl),
    release: vi.fn(),
  } as unknown as PoolClient;
}

describe('checkPostgres', () => {
  it('returns true when SELECT 1 succeeds', async () => {
    const client = clientStub(async () => ({ rows: [{ '?column?': 1 }] }));
    const pool = { connect: vi.fn(async () => client) };

    await expect(checkPostgres(50, pool)).resolves.toBe(true);
    expect(pool.connect).toHaveBeenCalledTimes(1);
    expect(client.release).toHaveBeenCalledTimes(1);
  });

  it('returns false (does not throw) when Pool.connect rejects with pooler FATAL', async () => {
    const pool = {
      connect: vi.fn(async () => {
        throw new Error(
          '(ENOTFOUND) tenant/user postgres.abcdefghijklmnopqrst not found',
        );
      }),
    };

    await expect(checkPostgres(50, pool)).resolves.toBe(false);
    expect(pool.connect).toHaveBeenCalledTimes(1);
  });

  it('returns false and still releases when query fails after connect', async () => {
    const client = clientStub(async () => {
      throw new Error('password authentication failed for user "postgres"');
    });
    const pool = { connect: vi.fn(async () => client) };

    await expect(checkPostgres(50, pool)).resolves.toBe(false);
    expect(client.release).toHaveBeenCalledTimes(1);
  });
});
