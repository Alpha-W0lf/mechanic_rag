/**
 * handleAsk: when the generator says the context is insufficient, in the
 * wording the local model uses, the ask returns insufficient_evidence.
 */
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { RetrieverHit } from '@/lib/retrieval/types';

const golden = JSON.parse(
  readFileSync(
    resolve(__dirname, '../../../../evals/golden_fixture_v1.json'),
    'utf8',
  ),
) as {
  cases: Array<{ id: string; question: string; expect_outcome?: string }>;
};

/** What gemma4:e2b wrote for each unanswerable golden question (2026-10-26 local run). */
const MODEL_REFUSAL: Record<string, string> = {
  'g10-hard-miss-abs-module':
    'Insufficient evidence in the indexed manuals for this vehicle to answer safely.',
  'g23-hard-miss-brake-pad-pn':
    'The context provided does not contain information regarding the OEM front brake pad part number for the S2000.',
  'g24-hard-miss-ecu-pinout':
    'Insufficient evidence in the indexed manuals for this vehicle to answer safely.',
  'g25-hard-miss-tsb-oil': 'Context is insufficient.',
};

const TEXT = 'Oil drain plug torque is 39 N·m (29 lbf·ft).';

function hit(): RetrieverHit {
  return {
    chunk_id: 'c1',
    document_id: 'doc1',
    content: TEXT,
    section_path: '1-1 Specification',
    page_start: 1,
    page_end: 1,
    modality: 'vector',
    retriever_score: 0.2,
  };
}

const vectorSearch = vi.fn(async () => [hit()]);
const lexicalSearch = vi.fn(async () => []);

vi.mock('@/server/retrievers', () => ({
  vehicleExists: async () => true,
  vectorSearch: (...args: never[]) =>
    (vectorSearch as (...a: never[]) => unknown)(...args),
  lexicalSearch: (...args: never[]) =>
    (lexicalSearch as (...a: never[]) => unknown)(...args),
  loadChunksByIds: async (ids: string[]) =>
    new Map(
      ids.map((id) => [
        id,
        {
          chunk_id: id,
          document_id: 'doc1',
          vehicle_id: 'fixture:honda-s2000-demo',
          doc_family: 'service_manual',
          content: TEXT,
          section_path: '1-1 Specification',
          page_start: 1,
          page_end: 1,
          document_name: 'demo',
          provenance: null,
        },
      ]),
    ),
}));

vi.mock('@/server/ask_image_channel', () => ({
  retrieveImageChannel: vi.fn(async () => ({
    hits: [],
    ms: 0,
    degraded: true,
    reason: 'image_index_empty_or_no_hits',
  })),
  isImageChannelEnabled: () => true,
}));

const generateAnswer = vi.fn();
vi.mock('@/server/providers', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@/server/providers')>();
  return {
    ...actual,
    embedText: vi.fn(async () => ({
      embedding: [0.1, 0.2],
      model: 'nomic-embed-text',
      dim: 2,
    })),
    generateAnswer: (...args: never[]) =>
      (generateAnswer as (...a: never[]) => unknown)(...args),
  };
});

async function ask(question: string) {
  const { handleAsk } = await import('@/server/ask');
  const result = await handleAsk({
    vehicle_id: 'fixture:honda-s2000-demo',
    question,
  });
  if ('error' in result) throw new Error(result.error);
  return result;
}

describe('handleAsk generator refusals', () => {
  beforeEach(() => {
    vi.resetModules();
    vi.clearAllMocks();
    vi.stubEnv('MECHANIC_FORCE_RRF_ONLY', '1');
  });

  afterEach(() => {
    vi.unstubAllEnvs();
  });

  const unanswerable = golden.cases.filter(
    (c) => c.expect_outcome === 'insufficient_evidence',
  );

  it('finds the 4 unanswerable golden questions', () => {
    expect(unanswerable.map((c) => c.id)).toEqual(Object.keys(MODEL_REFUSAL));
  });

  it.each(unanswerable.map((c) => [c.id, c.question]))(
    'returns insufficient_evidence for %s',
    async (id, question) => {
      generateAnswer.mockResolvedValue({
        text: MODEL_REFUSAL[id],
        model: 'gemma4:e2b',
      });
      const result = await ask(question);
      expect(result.outcome).toBe('insufficient_evidence');
      expect(result.citations).toEqual([]);
    },
  );

  it('still answers when the generator answers', async () => {
    generateAnswer.mockResolvedValue({
      text: 'Drain plug torque is 39 N·m [1].',
      model: 'gemma4:e2b',
    });
    const result = await ask('What is the oil drain plug torque?');
    expect(result.outcome).toBe('answered');
  });
});
