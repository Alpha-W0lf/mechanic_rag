/**
 * JH-75: soft expansion changes retrieval only.
 * Generator, cross-encoder, and image channel still see the original question.
 */
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { RetrieverHit } from '@/lib/retrieval/types';

const scorePairs = vi.fn(
  async (
    _q: string,
    candidates: Array<{ chunk_id: string }>,
  ): Promise<Array<{ chunk_id: string; ce_score: number }>> =>
    candidates.map((c, i) => ({ chunk_id: c.chunk_id, ce_score: i })),
);

vi.mock('@/server/cross_encoder', async (importOriginal) => {
  const actual =
    await importOriginal<typeof import('@/server/cross_encoder')>();
  return {
    ...actual,
    createCrossEncoderFromEnv: vi.fn(async () => ({
      modelId: 'mock-ce',
      runtime: 'transformers_js:classification',
      scorePairs,
    })),
  };
});

function hit(chunk_id: string, section: string): RetrieverHit {
  return {
    chunk_id,
    document_id: 'doc1',
    content: `content ${chunk_id}`,
    section_path: section,
    page_start: 1,
    page_end: 1,
    modality: 'vector',
    retriever_score: 0.9,
  };
}

const vehicleExists = vi.fn(async () => true);
const vectorSearch = vi.fn(async () => [hit('a', 'Oil')]);
const lexicalSearch = vi.fn<
  (
    vehicleId: string,
    question: string,
    topN: number,
    docFamily?: string,
    match?: 'and' | 'or',
  ) => Promise<RetrieverHit[]>
>(async () => [hit('a', 'Oil')]);
const loadChunksByIds = vi.fn(async (ids: string[]) => {
  const map = new Map();
  for (const id of ids) {
    map.set(id, {
      chunk_id: id,
      document_id: 'doc1',
      vehicle_id: 'fixture:honda-s2000-demo',
      doc_family: 'service_manual',
      content: `cited text for ${id}`,
      section_path: '1-1 Specification',
      page_start: 1,
      page_end: 1,
      document_name: 'demo',
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

const retrieveImageChannel = vi.fn(async () => ({
  hits: [] as RetrieverHit[],
  ms: 0,
  degraded: true,
  reason: 'image_index_empty_or_no_hits',
}));

vi.mock('@/server/ask_image_channel', () => ({
  retrieveImageChannel: (...args: never[]) =>
    (retrieveImageChannel as (...a: never[]) => unknown)(...args),
  isImageChannelEnabled: () => true,
}));

const embedText = vi.fn<
  (text: string) => Promise<{
    embedding: number[];
    model: string;
    dim: number;
  }>
>(async () => ({
  embedding: [0.1, 0.2],
  model: 'nomic-embed-text',
  dim: 2,
}));
const generateAnswer = vi.fn<
  (system: string, user: string) => Promise<{ text: string; model: string }>
>(async () => ({
  text: 'Displacement is listed in the specifications [1]',
  model: 'gemma4:e2b',
}));

vi.mock('@/server/providers', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@/server/providers')>();
  return {
    ...actual,
    embedText: (...args: never[]) =>
      (embedText as (...a: never[]) => unknown)(...args),
    generateAnswer: (...args: never[]) =>
      (generateAnswer as (...a: never[]) => unknown)(...args),
  };
});

const VID = 'fixture:honda-s2000-demo';

describe('handleAsk soft query expansion', () => {
  beforeEach(() => {
    vi.resetModules();
    vi.clearAllMocks();
    vi.stubEnv('MECHANIC_DIAGNOSTICS', '1');
    vi.stubEnv('GEMINI_API_KEY', '');
    vi.stubEnv('MECHANIC_FORCE_RRF_ONLY', '0');
    vehicleExists.mockResolvedValue(true);
    vectorSearch.mockResolvedValue([hit('a', 'Oil')]);
    lexicalSearch.mockResolvedValue([hit('a', 'Oil')]);
    embedText.mockResolvedValue({
      embedding: [0.1, 0.2],
      model: 'nomic-embed-text',
      dim: 2,
    });
    generateAnswer.mockResolvedValue({
      text: 'Displacement is listed in the specifications [1]',
      model: 'gemma4:e2b',
    });
  });

  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it('expands a vague engine-size ask on retrieval only', async () => {
    const question = 'how big is the engine?';
    const { handleAsk } = await import('@/server/ask');
    const result = await handleAsk({ vehicle_id: VID, question });
    expect('error' in result).toBe(false);
    if ('error' in result) return;

    const embedArg = embedText.mock.calls[0][0];
    expect(embedArg.startsWith(question)).toBe(true);
    expect(embedArg).toContain('displacement');

    expect(lexicalSearch).toHaveBeenCalledTimes(2);
    expect(lexicalSearch).toHaveBeenNthCalledWith(
      1,
      VID,
      question,
      expect.any(Number),
      undefined,
    );
    expect(lexicalSearch).toHaveBeenNthCalledWith(
      2,
      VID,
      'displacement bore stroke',
      expect.any(Number),
      undefined,
      'or',
    );

    const userPrompt = generateAnswer.mock.calls[0][1];
    expect(userPrompt).toContain(`Question: ${question}`);
    expect(userPrompt).not.toContain('bore and stroke');
    expect(scorePairs).toHaveBeenCalledWith(question, expect.any(Array));
    expect(retrieveImageChannel).toHaveBeenCalledWith(
      expect.objectContaining({ question }),
    );
    expect(result.diagnostics?.query_expansion).toEqual([
      'engine_size_to_displacement',
    ]);
  });

  it('leaves a concrete displacement ask unchanged', async () => {
    const question = 'What is the engine displacement of the F20C?';
    const { handleAsk } = await import('@/server/ask');
    const result = await handleAsk({ vehicle_id: VID, question });
    expect('error' in result).toBe(false);
    if ('error' in result) return;
    expect(embedText).toHaveBeenCalledWith(question);
    expect(lexicalSearch).toHaveBeenCalledTimes(1);
    expect(result.diagnostics?.query_expansion).toEqual([]);
  });

  it('leaves an unrelated brake ask unchanged', async () => {
    const question = 'What is the front brake pad inspection procedure?';
    const { handleAsk } = await import('@/server/ask');
    const result = await handleAsk({ vehicle_id: VID, question });
    expect('error' in result).toBe(false);
    if ('error' in result) return;
    expect(embedText).toHaveBeenCalledWith(question);
    expect(lexicalSearch).toHaveBeenCalledTimes(1);
    expect(result.diagnostics?.query_expansion).toEqual([]);
  });

  it('fuses a boost-only chunk into the chunks loaded for context', async () => {
    lexicalSearch.mockImplementation(async (...args) =>
      args[4] === 'or'
        ? [hit('spec-boost', 'Design Specifications')]
        : [hit('a', 'Oil')],
    );
    const { handleAsk } = await import('@/server/ask');
    await handleAsk({
      vehicle_id: VID,
      question: 'how big is the engine?',
    });
    const ids = loadChunksByIds.mock.calls[0][0];
    expect(ids).toContain('spec-boost');
  });

  it('omits diagnostics when the flag is off', async () => {
    vi.stubEnv('MECHANIC_DIAGNOSTICS', '');
    const { handleAsk } = await import('@/server/ask');
    const result = await handleAsk({
      vehicle_id: VID,
      question: 'how big is the engine?',
    });
    expect('error' in result).toBe(false);
    if ('error' in result) return;
    expect(result.diagnostics).toBeNull();
  });
});
