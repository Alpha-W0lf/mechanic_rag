import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import {
  DEFAULT_GEMINI_EMBED_MODEL,
  DEFAULT_GEMINI_GENERATE_MODEL,
  GEMINI_RETRY,
  GeminiError,
  embedText,
  geminiBackoffMs,
  geminiFetch,
  generateAnswer,
  isGeminiRetryStatus,
} from '@/server/providers';

function jsonResponse(status: number, body: unknown): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'content-type': 'application/json' },
  });
}

describe('gemini retry helpers', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('retries only 429 and 503', () => {
    expect(isGeminiRetryStatus(429)).toBe(true);
    expect(isGeminiRetryStatus(503)).toBe(true);
    expect(isGeminiRetryStatus(500)).toBe(false);
    expect(isGeminiRetryStatus(400)).toBe(false);
  });

  it('uses exponential backoff + jitter, capped, finite attempts', () => {
    expect(GEMINI_RETRY.maxAttempts).toBeGreaterThan(1);
    expect(GEMINI_RETRY.maxAttempts).toBeLessThanOrEqual(8);
    expect(geminiBackoffMs(0, () => 0)).toBe(1000);
    expect(geminiBackoffMs(1, () => 0)).toBe(2000);
    expect(geminiBackoffMs(2, () => 0)).toBe(4000);
    expect(geminiBackoffMs(3, () => 0)).toBe(8000);
    expect(geminiBackoffMs(0, () => 1)).toBe(2000);
  });

  it('geminiFetch retries 503 then returns success', async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(new Response('busy', { status: 503 }))
      .mockResolvedValueOnce(new Response('ok', { status: 200 }));
    vi.stubGlobal('fetch', fetchMock);
    const sleep = vi.fn(async () => undefined);

    const res = await geminiFetch(
      'https://generativelanguage.googleapis.com/v1beta/models/x:generateContent',
      { method: 'POST' },
      { sleep },
    );
    expect(res.status).toBe(200);
    expect(fetchMock).toHaveBeenCalledTimes(2);
    expect(sleep).toHaveBeenCalledTimes(1);
    expect(sleep.mock.calls[0][0]).toBeGreaterThanOrEqual(1000);
  });

  it('geminiFetch retries 429 then gives up after maxAttempts', async () => {
    const fetchMock = vi.fn().mockResolvedValue(new Response('slow down', { status: 429 }));
    vi.stubGlobal('fetch', fetchMock);
    const sleep = vi.fn(async () => undefined);

    const res = await geminiFetch('https://example.test/generate', { method: 'POST' }, {
      sleep,
    });
    expect(res.status).toBe(429);
    expect(fetchMock).toHaveBeenCalledTimes(GEMINI_RETRY.maxAttempts);
    expect(sleep).toHaveBeenCalledTimes(GEMINI_RETRY.maxAttempts - 1);
  });

  it('does not retry 400', async () => {
    const fetchMock = vi.fn().mockResolvedValue(new Response('bad', { status: 400 }));
    vi.stubGlobal('fetch', fetchMock);
    const sleep = vi.fn(async () => undefined);
    const res = await geminiFetch('https://example.test/generate', { method: 'POST' }, {
      sleep,
    });
    expect(res.status).toBe(400);
    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(sleep).not.toHaveBeenCalled();
  });
});

describe('hosted Gemini generate/embed', () => {
  beforeEach(() => {
    vi.stubEnv('GEMINI_API_KEY', 'test-not-a-real-key');
    vi.stubEnv('EMBEDDING_DIM', '768');
    vi.stubEnv('GEMINI_RETRY_NO_SLEEP', '1');
  });

  afterEach(() => {
    vi.unstubAllEnvs();
    vi.unstubAllGlobals();
  });

  it('generate uses default Gemma model, x-goog-api-key, and minimal thinking', async () => {
    vi.stubEnv('GEMINI_MODEL', '');
    const fetchMock = vi.fn().mockResolvedValue(
      jsonResponse(200, {
        candidates: [{ content: { parts: [{ text: 'Torque is 39 N·m [1]' }] } }],
      }),
    );
    vi.stubGlobal('fetch', fetchMock);

    const out = await generateAnswer('sys', 'user q');
    expect(out).toEqual({
      text: 'Torque is 39 N·m [1]',
      model: DEFAULT_GEMINI_GENERATE_MODEL,
    });
    expect(DEFAULT_GEMINI_GENERATE_MODEL).toBe('gemma-4-26b-a4b-it');

    const [url, init] = fetchMock.mock.calls[0] as [string, RequestInit];
    expect(url).toContain(`/models/${DEFAULT_GEMINI_GENERATE_MODEL}:generateContent`);
    expect(url).not.toContain('?key=');
    const headers = init.headers as Record<string, string>;
    expect(headers['x-goog-api-key']).toBe('test-not-a-real-key');
    const body = JSON.parse(String(init.body)) as {
      generationConfig: { thinkingConfig?: { thinkingLevel?: string } };
    };
    expect(body.generationConfig.thinkingConfig).toEqual({
      thinkingLevel: 'minimal',
    });
  });

  it('does not set Gemma thinkingConfig when GEMINI_MODEL is Flash', async () => {
    vi.stubEnv('GEMINI_MODEL', 'gemini-3.6-flash');
    const fetchMock = vi.fn().mockResolvedValue(
      jsonResponse(200, {
        candidates: [{ content: { parts: [{ text: 'ok' }] } }],
      }),
    );
    vi.stubGlobal('fetch', fetchMock);
    await generateAnswer('sys', 'user');
    const body = JSON.parse(String((fetchMock.mock.calls[0][1] as RequestInit).body));
    expect(body.generationConfig.thinkingConfig).toBeUndefined();
  });

  it('generate maps exhausted 429 to GeminiError with RESOURCE_EXHAUSTED', async () => {
    const fetchMock = vi.fn().mockImplementation(() =>
      jsonResponse(429, { error: { status: 'RESOURCE_EXHAUSTED', code: 429 } }),
    );
    vi.stubGlobal('fetch', fetchMock);

    await expect(generateAnswer('sys', 'user')).rejects.toMatchObject({
      name: 'GeminiError',
      httpStatus: 429,
      googleStatus: 'RESOURCE_EXHAUSTED',
    });
    expect(fetchMock).toHaveBeenCalledTimes(GEMINI_RETRY.maxAttempts);
  });

  it('embed keeps gemini-embedding-001 @ 768 and uses the header key', async () => {
    const values = Array.from({ length: 768 }, () => 0.01);
    const fetchMock = vi.fn().mockResolvedValue(
      jsonResponse(200, { embedding: { values } }),
    );
    vi.stubGlobal('fetch', fetchMock);

    const out = await embedText('oil drain plug');
    expect(out.model).toBe(DEFAULT_GEMINI_EMBED_MODEL);
    expect(out.dim).toBe(768);
    expect(out.embedding).toHaveLength(768);

    const [url, init] = fetchMock.mock.calls[0] as [string, RequestInit];
    expect(url).toContain(`/models/${DEFAULT_GEMINI_EMBED_MODEL}:embedContent`);
    expect(url).not.toContain('?key=');
    expect((init.headers as Record<string, string>)['x-goog-api-key']).toBe(
      'test-not-a-real-key',
    );
  });

  it('embed retries 503 then succeeds', async () => {
    const values = Array.from({ length: 768 }, () => 0.02);
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(new Response('unavailable', { status: 503 }))
      .mockResolvedValueOnce(jsonResponse(200, { embedding: { values } }));
    vi.stubGlobal('fetch', fetchMock);
    const out = await embedText('q');
    expect(out.embedding).toHaveLength(768);
    expect(fetchMock).toHaveBeenCalledTimes(2);
  });

  it('throws GeminiError (not a bare Error) after generate 503s exhaust', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue(new Response('down', { status: 503 })),
    );
    await expect(generateAnswer('sys', 'user')).rejects.toBeInstanceOf(GeminiError);
  });
});
