/**
 * JH-75 soft query expansion — retrieval-only.
 * Business rules: see docs/backlog/2026-09-28_soft_query_expansion_IMPLEMENT.md §1–2.
 * Never alters the question shown to the user or sent to the generator.
 */

import { lexicalQueryTokens } from '@/lib/retrieval/lexical_query';
import type { RetrieverHit } from '@/lib/retrieval/types';
import { lexicalSearch } from './retrievers';

export const ENGINE_SIZE_RULE = 'engine_size_to_displacement';

const EMBED_TERMS = 'engine displacement cm³ cu in bore and stroke';
const LEXICAL_BOOST = 'displacement bore stroke';

const ENGINE_SUBJECT = new Set('engine engines motor'.split(' '));
const SIZE_CUE = new Set(
  'big bigger size sized large larger capacity liter liters litre litres cc cubic'.split(
    ' ',
  ),
);
const BLOCKER = new Set(
  'displacement oil coolant fluid fuel tank water bay compartment mount mounts bolt bolts pump filter belt hose valve valves piston pistons bearing bearings gasket weight heavy weigh'.split(
    ' ',
  ),
);

export type QueryExpansion = {
  rules: string[];
  embedQuery: string;
  lexicalBoost: string | null;
};

function noExpansion(question: string): QueryExpansion {
  return { rules: [], embedQuery: question, lexicalBoost: null };
}

/** Same string reference when no rule fires, so retrieval matches today. */
export function expandQueryForRetrieval(question: string): QueryExpansion {
  const tokens = lexicalQueryTokens(question);
  if (tokens.length === 0) return noExpansion(question);
  const subject = tokens.some((token) => ENGINE_SUBJECT.has(token));
  const size = tokens.some((token) => SIZE_CUE.has(token));
  const blocked = tokens.some((token) => BLOCKER.has(token));
  if (!subject || !size || blocked) return noExpansion(question);
  return {
    rules: [ENGINE_SIZE_RULE],
    embedQuery: `${question} ${EMBED_TERMS}`,
    lexicalBoost: LEXICAL_BOOST,
  };
}

export async function retrieveExpansionBoost(input: {
  vehicleId: string;
  expansion: QueryExpansion;
  topN: number;
  docFamily?: string;
}): Promise<{ hits: RetrieverHit[]; ms: number }> {
  if (!input.expansion.lexicalBoost) return { hits: [], ms: 0 };
  const started = Date.now();
  const hits = await lexicalSearch(
    input.vehicleId,
    input.expansion.lexicalBoost,
    input.topN,
    input.docFamily,
    'or',
  );
  return { hits, ms: Date.now() - started };
}

/** Spread rule ids onto diagnostics. Does not mutate the degrade helper's result. */
export function withQueryExpansionDiagnostic<
  T extends { diagnostics: Record<string, unknown> | null },
>(result: T, rules: string[]): T {
  if (!result.diagnostics) return result;
  return {
    ...result,
    diagnostics: { ...result.diagnostics, query_expansion: rules },
  };
}
