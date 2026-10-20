import { describe, expect, it } from 'vitest';
import { validateAskRequest } from '@/server/ask';

/**
 * Vehicle filter isolation is enforced by requiring vehicle_id on every ask
 * and by SQL WHERE vehicle_id = $1 in retrievers. Full DB isolation is an
 * integration check (Compose up + two fixture vehicles).
 */
describe('vehicle filter contract', () => {
  it('does not allow ask without vehicle_id (no all-vehicle fallback)', () => {
    const r = validateAskRequest({ question: 'oil torque?' });
    expect(r.ok).toBe(false);
  });

  it('accepts fixture vehicle_id shape', () => {
    const r = validateAskRequest({
      vehicle_id: 'fixture:honda-s2000-demo',
      question: 'oil torque?',
    });
    expect(r.ok).toBe(true);
  });
});
