/**
 * UI vehicle picker — listAskableVehicles SQL prefix filter + ordering contract.
 */
import { beforeEach, describe, expect, it, vi } from 'vitest';

const query = vi.fn();

vi.mock('@/server/db', () => ({
  query: (...args: unknown[]) => query(...args),
}));

describe('listAskableVehicles', () => {
  beforeEach(() => {
    query.mockReset();
    vi.resetModules();
  });

  it('returns rows from askable vehicle query (fixture + cat prefixes)', async () => {
    query.mockResolvedValue({
      rows: [
        { vehicle_id: 'fixture:honda-s2000-demo' },
        { vehicle_id: 'cat:2003-honda-s2000' },
        { vehicle_id: 'cat:2015-triumph-street-triple' },
      ],
    });
    const { listAskableVehicles } = await import('@/server/retrievers');
    const ids = await listAskableVehicles();
    expect(ids).toEqual([
      'fixture:honda-s2000-demo',
      'cat:2003-honda-s2000',
      'cat:2015-triumph-street-triple',
    ]);
    expect(query).toHaveBeenCalledTimes(1);
    const sql = String(query.mock.calls[0]?.[0] ?? '');
    expect(sql).toMatch(/fixture:%/);
    expect(sql).toMatch(/cat:%/);
    expect(sql).toMatch(/CASE WHEN vehicle_id LIKE 'fixture:%' THEN 0 ELSE 1 END/);
  });
});
