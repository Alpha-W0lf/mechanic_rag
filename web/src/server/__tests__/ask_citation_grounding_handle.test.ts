/**
 * handleAsk: a stated value cited to a chunk without it is re-pointed to the
 * retrieved chunk that has it, labels run 1..n, and the excerpt shows the value.
 */
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { RetrieverHit } from '@/lib/retrieval/types';

const CONTENT: Record<string, { text: string; page: number }> = {
  align: {
    text: 'Wheel alignment. Check toe-in and camber on a level floor.',
    page: 1057,
  },
  tires: {
    text: 'Tire information. Recommended cold tire pressure: front 32 psi, rear 32 psi.',
    page: 276,
  },
};

function hit(chunk_id: string): RetrieverHit {
  return {
    chunk_id,
    document_id: 'doc1',
    content: CONTENT[chunk_id].text,
    section_path: chunk_id,
    page_start: CONTENT[chunk_id].page,
    page_end: CONTENT[chunk_id].page,
    modality: 'vector',
    retriever_score: 0.9,
  };
}

const vehicleExists = vi.fn(async () => true);
const vectorSearch = vi.fn(async () => [hit('align'), hit('tires')]);
const lexicalSearch = vi.fn(async () => [hit('align'), hit('tires')]);
const loadChunksByIds = vi.fn(async (ids: string[]) => {
  const map = new Map();
  for (const id of ids) {
    map.set(id, {
      chunk_id: id,
      document_id: 'doc1',
      vehicle_id: 'cat:2003-honda-s2000',
      doc_family: 'service_manual',
      content: CONTENT[id].text,
      section_path: id,
      page_start: CONTENT[id].page,
      page_end: CONTENT[id].page,
      document_name: 'demo',
      provenance: null,
    });
  }
  return map;
});

vi.mock('@/server/retrievers', () => ({
  vehicleExists: (...args: never[]) =>
    (vehicleExists as (...a: never[]) => unknown)(...args),
  vectorSearch: (...args: never[]) =>
    (vectorSearch as (...a: never[]) => unknown)(...args),
  lexicalSearch: (...args: never[]) =>
    (lexicalSearch as (...a: never[]) => unknown)(...args),
  loadChunksByIds: (...args: never[]) =>
    (loadChunksByIds as (...a: never[]) => unknown)(...args),
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
      model: 'gemini-embedding-001',
      dim: 2,
    })),
    generateAnswer: (...args: never[]) =>
      (generateAnswer as (...a: never[]) => unknown)(...args),
  };
});

describe('handleAsk citation grounding', () => {
  beforeEach(() => {
    vi.resetModules();
    vi.clearAllMocks();
    vi.stubEnv('MECHANIC_FORCE_RRF_ONLY', '1');
  });

  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it('re-points "32 psi" from the alignment page to the tire page', async () => {
    generateAnswer.mockResolvedValue({
      text: 'Cold tire pressure is 32 psi [1].',
      model: 'gemma-4-26b-a4b-it',
    });
    const { handleAsk } = await import('@/server/ask');
    const result = await handleAsk({
      vehicle_id: 'cat:2003-honda-s2000',
      question: 'Tire pressure?',
    });
    if ('error' in result) throw new Error(result.error);
    expect(result.answer).toBe('Cold tire pressure is 32 psi [1].');
    expect(result.citations.map((c) => [c.label, c.page_start])).toEqual([
      ['1', 276],
    ]);
    expect(result.citations[0].excerpt).toContain('32 psi');
  });

  it('numbers the cards 1..n with no gaps', async () => {
    generateAnswer.mockResolvedValue({
      text: 'Check alignment [2].',
      model: 'gemma-4-26b-a4b-it',
    });
    const { handleAsk } = await import('@/server/ask');
    const result = await handleAsk({
      vehicle_id: 'cat:2003-honda-s2000',
      question: 'Alignment?',
    });
    if ('error' in result) throw new Error(result.error);
    expect(result.answer).toBe('Check alignment [1].');
    expect(result.citations.map((c) => c.label)).toEqual(['1']);
  });
});
