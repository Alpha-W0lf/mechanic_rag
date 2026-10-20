/** Every request shape the validator accepts must pass the published request schema. */
import { describe, expect, it } from 'vitest';
import { validateAskRequest } from '@/server/ask_request';
import { loadContract, schemaErrors } from './ask_response_schema';

const requestSchema = loadContract('ask_request.schema.json');

describe('ask_request.schema.json', () => {
  it.each([
    { vehicle_id: 'cat:2003-honda-s2000', question: 'Tire pressure?' },
    {
      vehicle_id: 'cat:2003-honda-s2000',
      question: 'Fuse box?',
      doc_family: 'wiring',
    },
    {
      vehicle_id: 'cat:2003-honda-s2000',
      question: 'Show the diagram',
      diagram_assist: true,
    },
  ])('accepts what the validator accepts: %o', (body) => {
    const out = validateAskRequest(body);
    expect(out.ok).toBe(true);
    expect(schemaErrors(body, requestSchema)).toEqual([]);
  });
});
