import { beforeEach, describe, expect, it, vi } from 'vitest';
import { lexicalQueryFromQuestionOr } from '@/lib/retrieval/lexical_query';

const lexicalSearch = vi.fn();

vi.mock('@/server/retrievers', () => ({
  lexicalSearch: (...args: never[]) =>
    (lexicalSearch as (...a: never[]) => unknown)(...args),
}));

import {
  ENGINE_SIZE_RULE,
  expandQueryForRetrieval,
  retrieveExpansionBoost,
  withQueryExpansionDiagnostic,
} from '@/server/ask_query_expansion';

const FIRES = [
  'how big is the engine?',
  'What size engine does it have',
  'how many liters is the motor',
  'engine capacity?',
  'how many cc is the engine',
  'big engine',
  'the engine is really big',
];

const QUIET = [
  'What is the engine displacement of the F20C?',
  'What is the front brake pad inspection procedure?',
  'How much oil does the engine hold?',
  'engine oil capacity',
  'How big is the engine bay?',
  'how heavy is the engine',
  'how big is it?',
  'What size are the tires?',
  '???',
];

describe('expandQueryForRetrieval', () => {
  it.each(FIRES)('fires for %j', (question) => {
    const expansion = expandQueryForRetrieval(question);
    expect(expansion.rules).toEqual([ENGINE_SIZE_RULE]);
    expect(expansion.embedQuery.startsWith(question)).toBe(true);
    expect(expansion.embedQuery).toContain('displacement');
    expect(expansion.lexicalBoost).toBe('displacement bore stroke');
  });

  it.each(QUIET)('does not fire for %j', (question) => {
    const expansion = expandQueryForRetrieval(question);
    expect(expansion.rules).toEqual([]);
    expect(expansion.embedQuery).toBe(question);
    expect(expansion.lexicalBoost).toBeNull();
  });

  it('builds an OR lexical body from the boost terms', () => {
    const expansion = expandQueryForRetrieval('how big is the engine?');
    expect(lexicalQueryFromQuestionOr(expansion.lexicalBoost ?? '')).toBe(
      'displacement | bore | stroke',
    );
  });
});

describe('retrieveExpansionBoost', () => {
  beforeEach(() => {
    lexicalSearch.mockReset();
  });

  it('does not call lexical search when no rule fired', async () => {
    const expansion = expandQueryForRetrieval('how big is it?');
    const boost = await retrieveExpansionBoost({
      vehicleId: 'fixture:honda-s2000-demo',
      expansion,
      topN: 50,
    });
    expect(boost).toEqual({ hits: [], ms: 0 });
    expect(lexicalSearch).not.toHaveBeenCalled();
  });

  it('runs the boost terms as a separate OR search', async () => {
    lexicalSearch.mockResolvedValue([]);
    const expansion = expandQueryForRetrieval('how big is the engine?');
    await retrieveExpansionBoost({
      vehicleId: 'fixture:honda-s2000-demo',
      expansion,
      topN: 50,
      docFamily: 'service_manual',
    });
    expect(lexicalSearch).toHaveBeenCalledWith(
      'fixture:honda-s2000-demo',
      'displacement bore stroke',
      50,
      'service_manual',
      'or',
    );
  });
});

describe('withQueryExpansionDiagnostic', () => {
  it('spreads rule ids and leaves a null diagnostic payload null', () => {
    const diagnostics = { request_id: 'r' };
    const next = withQueryExpansionDiagnostic({ diagnostics }, [
      ENGINE_SIZE_RULE,
    ]);
    expect(next.diagnostics).toEqual({
      request_id: 'r',
      query_expansion: [ENGINE_SIZE_RULE],
    });
    expect(diagnostics).toEqual({ request_id: 'r' });
    expect(
      withQueryExpansionDiagnostic({ diagnostics: null }, [ENGINE_SIZE_RULE])
        .diagnostics,
    ).toBeNull();
  });
});
