/**
 * /api/vehicles must not return raw driver text (pooler FATAL / project ref).
 */
import { beforeEach, describe, expect, it, vi } from 'vitest';

const listAskableVehicles = vi.fn();

vi.mock('@/server/retrievers', () => ({
  listAskableVehicles: (...args: unknown[]) => listAskableVehicles(...args),
}));

async function getVehicles(): Promise<{
  status: number;
  body: Record<string, unknown>;
  raw: string;
}> {
  const { GET } = await import('@/app/api/vehicles/route');
  const res = await GET();
  const raw = await res.text();
  let body: Record<string, unknown> = {};
  if (raw) {
    body = JSON.parse(raw) as Record<string, unknown>;
  }
  return { status: res.status, body, raw };
}

describe('GET /api/vehicles', () => {
  beforeEach(() => {
    listAskableVehicles.mockReset();
    vi.resetModules();
  });

  it('returns the catalog on success', async () => {
    listAskableVehicles.mockResolvedValue(['fixture:honda-s2000-demo']);
    const result = await getVehicles();
    expect(result.status).toBe(200);
    expect(result.body).toEqual({
      vehicles: ['fixture:honda-s2000-demo'],
    });
  });

  it('sanitizes pooler FATAL to coherent 503 JSON (no tenant ref leak)', async () => {
    listAskableVehicles.mockRejectedValue(
      new Error(
        '(ENOTFOUND) tenant/user postgres.abcdefghijklmnopqrst not found',
      ),
    );
    const result = await getVehicles();
    expect(result.raw.length).toBeGreaterThan(0);
    expect(result.status).toBe(503);
    expect(result.body).toEqual({
      error: 'Upstream dependency failure (database)',
      error_class: 'database_unavailable',
    });
    expect(result.raw).not.toMatch(
      /ENOTFOUND|tenant\/user|abcdefghijklmnopqrst|FATAL/i,
    );
  });
});
