import { describe, expect, it } from 'vitest';
import {
  classifyAskError,
  errorClassForEmbedFailure,
  PUBLIC_ASK_ERROR,
  toPublicAskFailure,
} from '@/server/ask_errors';
import { GeminiError } from '@/server/providers';
import { OllamaError } from '@/server/ollama';

const LEAK = /ENOTFOUND|tenant\/user|abcdefghijklmnopqrst|FATAL/i;

describe('classifyAskError / toPublicAskFailure', () => {
  it('maps Gemini 503 / UNAVAILABLE to generator_unavailable (not database)', () => {
    const err = new GeminiError('gemini generate failed: 503', 503, 'UNAVAILABLE');
    expect(classifyAskError(err)).toBe('generator_unavailable');
    const pub = toPublicAskFailure(err);
    expect(pub).toEqual({
      error: PUBLIC_ASK_ERROR.generator_unavailable,
      error_class: 'generator_unavailable',
      status: 503,
    });
    expect(pub.error).not.toMatch(LEAK);
    expect(pub.error).not.toMatch(/database/i);
  });

  it('maps Gemini 429 / RESOURCE_EXHAUSTED to rate_limited', () => {
    const err = new GeminiError(
      'gemini generate failed: 429',
      429,
      'RESOURCE_EXHAUSTED',
    );
    expect(classifyAskError(err)).toBe('rate_limited');
    expect(toPublicAskFailure(err)).toEqual({
      error: PUBLIC_ASK_ERROR.rate_limited,
      error_class: 'rate_limited',
      status: 429,
    });
  });

  it('maps RESOURCE_EXHAUSTED even without http 429', () => {
    const err = new GeminiError('gemini generate failed: 500', 500, 'RESOURCE_EXHAUSTED');
    expect(classifyAskError(err)).toBe('rate_limited');
  });

  it('maps generic gemini throw (pre-GeminiError message) to generator', () => {
    expect(classifyAskError(new Error('gemini generate failed: 503'))).toBe(
      'generator_unavailable',
    );
  });

  it('maps Gemini embed failures to embedding_unavailable (not generator)', () => {
    const embed503 = new GeminiError('gemini embed failed: 503', 503, 'UNAVAILABLE');
    expect(classifyAskError(embed503)).toBe('embedding_unavailable');
    expect(toPublicAskFailure(embed503)).toEqual({
      error: PUBLIC_ASK_ERROR.embedding_unavailable,
      error_class: 'embedding_unavailable',
      status: 503,
    });
    expect(classifyAskError(new GeminiError('gemini embed missing values'))).toBe(
      'embedding_unavailable',
    );
    expect(classifyAskError(new OllamaError('embed failed: 503', 503))).toBe(
      'embedding_unavailable',
    );
  });

  it('maps embed 429 to rate_limited (not embedding_unavailable)', () => {
    expect(
      classifyAskError(
        new GeminiError('gemini embed failed: 429', 429, 'RESOURCE_EXHAUSTED'),
      ),
    ).toBe('rate_limited');
  });

  it('errorClassForEmbedFailure is embedding_unavailable except 429', () => {
    expect(
      errorClassForEmbedFailure(
        new GeminiError('gemini embed failed: 503', 503, 'UNAVAILABLE'),
      ),
    ).toBe('embedding_unavailable');
    const abort = new Error('This operation was aborted');
    abort.name = 'AbortError';
    expect(errorClassForEmbedFailure(abort)).toBe('embedding_unavailable');
    expect(
      errorClassForEmbedFailure(
        new GeminiError('gemini embed failed: 429', 429, 'RESOURCE_EXHAUSTED'),
      ),
    ).toBe('rate_limited');
  });

  it('maps OllamaError to generator_unavailable; 429 to rate_limited', () => {
    expect(classifyAskError(new OllamaError('generate failed: 500', 500))).toBe(
      'generator_unavailable',
    );
    expect(classifyAskError(new OllamaError('generate failed: 429', 429))).toBe(
      'rate_limited',
    );
  });

  it('maps AbortError (provider timeout) to generator_unavailable', () => {
    const err = new Error('This operation was aborted');
    err.name = 'AbortError';
    expect(classifyAskError(err)).toBe('generator_unavailable');
  });

  it('maps pooler FATAL / ENOTFOUND to database_unavailable without leaking', () => {
    const err = new Error(
      '(ENOTFOUND) tenant/user postgres.abcdefghijklmnopqrst not found',
    );
    (err as { code?: string }).code = 'ENOTFOUND';
    expect(classifyAskError(err)).toBe('database_unavailable');
    const pub = toPublicAskFailure(err);
    expect(pub.error_class).toBe('database_unavailable');
    expect(pub.status).toBe(503);
    expect(pub.error).toBe(PUBLIC_ASK_ERROR.database_unavailable);
    expect(JSON.stringify(pub)).not.toMatch(LEAK);
  });

  it('maps pg connection codes to database_unavailable', () => {
    const err = new Error('connect ECONNREFUSED 127.0.0.1:5432');
    (err as { code?: string }).code = 'ECONNREFUSED';
    expect(classifyAskError(err)).toBe('database_unavailable');
  });

  it('maps unknown throws to internal without leaking the message', () => {
    const internal = toPublicAskFailure(
      new TypeError('cannot read foo of undefined'),
    );
    expect(internal).toEqual({
      error: PUBLIC_ASK_ERROR.internal,
      error_class: 'internal',
      status: 503,
    });
    expect(JSON.stringify(internal)).not.toMatch(LEAK);
    expect(JSON.stringify(internal)).not.toMatch(/cannot read foo/);
  });
});
