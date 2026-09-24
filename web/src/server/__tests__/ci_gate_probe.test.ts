import { expect, it } from 'vitest';

it('jh-44 vitest fail-closed probe', () => {
  expect(1).toBe(0);
});
