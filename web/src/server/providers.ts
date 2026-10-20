/**
 * Provider dispatch for embeddings + generation.
 *
 * When GEMINI_API_KEY is present, the hosted Gemini path serves queries
 * (matching the public fixture corpus, which is embedded with
 * gemini-embedding-001 @ 768). Otherwise callers fall back to the local
 * Ollama path unchanged.
 *
 * Hosted generate default is Gemma 4 on the Gemini API (free-tier RPM/RPD
 * vs Flash). Override with GEMINI_MODEL. Embeddings stay gemini-embedding-001.
 */

import {
  OllamaError,
  embedText as ollamaEmbedText,
  generateAnswer as ollamaGenerateAnswer,
} from './ollama';

export { OllamaError };

export const DEFAULT_GEMINI_GENERATE_MODEL = 'gemma-4-26b-a4b-it';
export const DEFAULT_GEMINI_EMBED_MODEL = 'gemini-embedding-001';

/**
 * Finite retry for hosted Gemini REST.
 * Shape matches Google Gen AI guidance: retry 408, 429, 500, 502, 503 and 504,
 * plus timeouts and network errors, with exponential backoff + jitter, then
 * stop. Every attempt fits inside one deadline: the Ask handler passes a
 * single request-level deadlineAt to both embed and generate, each attempt's
 * timeout is capped at the time left, and no attempt starts with under
 * minAttemptMs left.
 * @see https://docs.cloud.google.com/vertex-ai/generative-ai/docs/retry-strategy
 */
export const GEMINI_RETRY = {
  maxAttempts: 4,
  initialDelayMs: 1000,
  maxDelayMs: 8000,
  expBase: 2,
  jitterMs: 1000,
  retryStatuses: [408, 429, 500, 502, 503, 504] as readonly number[],
  /** Fallback budget when the caller passes no deadlineAt (scripts, tests). */
  deadlineMs: 45_000,
  /** No attempt starts with less than this much budget left. */
  minAttemptMs: 1_000,
};

/**
 * One Gemini time budget per Ask, measured from the start of the request and
 * shared by embed and generate. Retrieval and database work run inside it; it
 * ends 10 s before the 60 s function limit (app/api/ask/route.ts maxDuration).
 */
export const ASK_GEMINI_BUDGET_MS = 50_000;

export class GeminiError extends Error {
  readonly name = 'GeminiError';
  constructor(
    message: string,
    readonly httpStatus?: number,
    readonly googleStatus?: string,
    readonly attempts?: number,
    /** Set for timeouts and network failures (e.g. AbortError, TypeError). */
    readonly errorName?: string,
  ) {
    super(message);
  }
}

function geminiKey(): string {
  return process.env.GEMINI_API_KEY || '';
}

/** True when hosted Gemini is the serving path (key present). */
export function isGeminiServing(): boolean {
  return Boolean(geminiKey());
}

function geminiHeaders(key: string): Record<string, string> {
  return {
    'content-type': 'application/json',
    'x-goog-api-key': key,
  };
}

function geminiUrl(
  model: string,
  method: 'embedContent' | 'generateContent',
): string {
  return `https://generativelanguage.googleapis.com/v1beta/models/${model}:${method}`;
}

export function geminiBackoffMs(
  failedAttemptIndex: number,
  random: () => number = Math.random,
): number {
  const { initialDelayMs, maxDelayMs, expBase, jitterMs } = GEMINI_RETRY;
  const exp = Math.min(
    maxDelayMs,
    initialDelayMs * expBase ** failedAttemptIndex,
  );
  return Math.floor(exp + random() * jitterMs);
}

export function isGeminiRetryStatus(status: number): boolean {
  return (GEMINI_RETRY.retryStatuses as readonly number[]).includes(status);
}

type SleepFn = (ms: number) => Promise<void>;

const defaultSleep: SleepFn = (ms) =>
  new Promise((resolve) => {
    setTimeout(resolve, ms);
  });

type GeminiJsonError = {
  error?: { status?: string; message?: string; code?: number };
};

async function readGeminiError(
  res: Response,
): Promise<{ googleStatus?: string }> {
  try {
    const data = (await res.json()) as GeminiJsonError;
    const googleStatus =
      typeof data.error?.status === 'string' ? data.error.status : undefined;
    return { googleStatus };
  } catch {
    return {};
  }
}

type FetchOpts = {
  timeoutMs?: number;
  sleep?: SleepFn;
  random?: () => number;
  now?: () => number;
  /** Absolute time (ms since epoch, per now()) by which all attempts must end. */
  deadlineAt?: number;
  kind?: 'embed' | 'generate';
};

/** Per-request options the Ask handler passes to embed and generate. */
export type GeminiCallOpts = Pick<FetchOpts, 'deadlineAt' | 'now'>;

/** Timeouts (AbortError) and network failures (fetch TypeError) are transient. */
function isTransientFetchError(err: unknown): boolean {
  const name =
    err && typeof err === 'object'
      ? (err as { name?: unknown }).name
      : undefined;
  return (
    name === 'AbortError' || name === 'TimeoutError' || err instanceof TypeError
  );
}

async function geminiFetchCounted(
  url: string,
  init: RequestInit,
  opts?: FetchOpts,
): Promise<{ response: Response; attempts: number }> {
  const timeoutMs =
    opts?.timeoutMs ?? Number(process.env.OLLAMA_TIMEOUT_MS || 60000);
  const sleep =
    opts?.sleep ??
    (process.env.GEMINI_RETRY_NO_SLEEP === '1'
      ? async () => undefined
      : defaultSleep);
  const random = opts?.random ?? Math.random;
  const now = opts?.now ?? Date.now;
  const { maxAttempts, deadlineMs, minAttemptMs } = GEMINI_RETRY;
  const deadlineAt = opts?.deadlineAt ?? now() + deadlineMs;
  const remaining = () => deadlineAt - now();
  const fitsAnother = (attempt: number, backoffMs: number) =>
    attempt < maxAttempts - 1 && remaining() - backoffMs >= minAttemptMs;
  const kind = opts?.kind ?? 'request';

  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    const left = remaining();
    if (left < minAttemptMs) {
      throw new GeminiError(
        `gemini ${kind} failed: request budget spent`,
        undefined,
        'DEADLINE_EXCEEDED',
        attempt,
        'DeadlineExceeded',
      );
    }
    const ctrl = new AbortController();
    const t = setTimeout(() => ctrl.abort(), Math.min(timeoutMs, left));
    try {
      const res = await fetch(url, { ...init, signal: ctrl.signal });
      const backoffMs = geminiBackoffMs(attempt, random);
      if (isGeminiRetryStatus(res.status) && fitsAnother(attempt, backoffMs)) {
        await res.text().catch(() => undefined);
        await sleep(backoffMs);
        continue;
      }
      return { response: res, attempts: attempt + 1 };
    } catch (err) {
      if (!isTransientFetchError(err)) throw err;
      const backoffMs = geminiBackoffMs(attempt, random);
      if (fitsAnother(attempt, backoffMs)) {
        await sleep(backoffMs);
        continue;
      }
      const name = (err as { name?: string }).name ?? 'Error';
      throw new GeminiError(
        `gemini ${kind} failed: ${name}`,
        undefined,
        name === 'TypeError' ? 'NETWORK_ERROR' : 'DEADLINE_EXCEEDED',
        attempt + 1,
        name,
      );
    } finally {
      clearTimeout(t);
    }
  }
  return {
    response: new Response(null, { status: 503 }),
    attempts: maxAttempts,
  };
}

export async function geminiFetch(
  url: string,
  init: RequestInit,
  opts?: FetchOpts,
): Promise<Response> {
  const { response } = await geminiFetchCounted(url, init, opts);
  return response;
}

function throwGeminiHttp(
  kind: 'embed' | 'generate',
  res: Response,
  googleStatus?: string,
  attempts?: number,
): never {
  throw new GeminiError(
    `gemini ${kind} failed: ${res.status}`,
    res.status,
    googleStatus,
    attempts,
  );
}

async function geminiEmbed(
  text: string,
  call?: GeminiCallOpts,
): Promise<{ embedding: number[]; model: string; dim: number }> {
  const key = geminiKey();
  const model =
    process.env.EMBEDDING_MODEL_GEMINI || DEFAULT_GEMINI_EMBED_MODEL;
  const dim = Number(process.env.EMBEDDING_DIM || 768);
  const timeoutMs = Number(process.env.OLLAMA_TIMEOUT_MS || 60000);
  const res = await geminiFetch(
    geminiUrl(model, 'embedContent'),
    {
      method: 'POST',
      headers: geminiHeaders(key),
      body: JSON.stringify({
        model: `models/${model}`,
        content: { parts: [{ text }] },
        outputDimensionality: dim,
      }),
    },
    { timeoutMs, kind: 'embed', ...call },
  );
  if (!res.ok) {
    const { googleStatus } = await readGeminiError(res);
    throwGeminiHttp('embed', res, googleStatus);
  }
  const data = (await res.json()) as {
    embedding?: { values?: number[] };
  };
  const values = data.embedding?.values;
  if (!Array.isArray(values))
    throw new GeminiError('gemini embed missing values');
  if (values.length !== dim) {
    throw new GeminiError(
      `gemini embed dim mismatch: ${values.length} != ${dim}`,
    );
  }
  return { embedding: values, model, dim };
}

export async function embedText(
  text: string,
  call?: GeminiCallOpts,
): Promise<{ embedding: number[]; model: string; dim: number }> {
  if (geminiKey()) return geminiEmbed(text, call);
  return ollamaEmbedText(text);
}

/** One JSON line per failed generation, so a degraded Ask names its cause in the logs. */
function logGenerateFailure(fields: {
  model: string;
  httpStatus?: number;
  googleStatus?: string;
  errorName?: string;
  finishReason?: string;
  attempts?: number;
}): void {
  console.error(JSON.stringify({ event: 'gemini_generate_failed', ...fields }));
}

async function geminiGenerate(
  system: string,
  user: string,
  call?: GeminiCallOpts,
): Promise<{ text: string; model: string; attempts: number }> {
  const key = geminiKey();
  const model = process.env.GEMINI_MODEL || DEFAULT_GEMINI_GENERATE_MODEL;
  const timeoutMs = Number(process.env.OLLAMA_TIMEOUT_MS || 60000);
  const generationConfig: Record<string, unknown> = { temperature: 0.1 };
  // Official Gemma-on-Gemini REST: thinkingLevel "minimal" disables thinking.
  // https://ai.google.dev/gemma/docs/core/gemma_on_gemini_api
  if (model.startsWith('gemma-')) {
    generationConfig.thinkingConfig = { thinkingLevel: 'minimal' };
  }
  let fetched: { response: Response; attempts: number };
  try {
    fetched = await geminiFetchCounted(
      geminiUrl(model, 'generateContent'),
      {
        method: 'POST',
        headers: geminiHeaders(key),
        body: JSON.stringify({
          system_instruction: { parts: [{ text: system }] },
          contents: [{ role: 'user', parts: [{ text: user }] }],
          generationConfig,
        }),
      },
      { timeoutMs, kind: 'generate', ...call },
    );
  } catch (err) {
    if (err instanceof GeminiError) {
      logGenerateFailure({
        model,
        googleStatus: err.googleStatus,
        errorName: err.errorName,
        attempts: err.attempts,
      });
    }
    throw err;
  }
  const { response: res, attempts } = fetched;
  if (!res.ok) {
    const { googleStatus } = await readGeminiError(res);
    logGenerateFailure({
      model,
      httpStatus: res.status,
      googleStatus,
      attempts,
    });
    throwGeminiHttp('generate', res, googleStatus, attempts);
  }
  const data = (await res.json()) as {
    candidates?: {
      content?: { parts?: { text?: string }[] };
      finishReason?: string;
    }[];
  };
  const parts = data.candidates?.[0]?.content?.parts ?? [];
  const text = parts.map((p) => p.text ?? '').join('');
  if (!text) {
    logGenerateFailure({
      model,
      httpStatus: res.status,
      finishReason: data.candidates?.[0]?.finishReason,
      attempts,
    });
    throw new GeminiError(
      'gemini generate returned no text',
      undefined,
      undefined,
      attempts,
    );
  }
  return { text, model, attempts };
}

export async function generateAnswer(
  system: string,
  user: string,
  call?: GeminiCallOpts,
): Promise<{ text: string; model: string; attempts?: number }> {
  if (geminiKey()) return geminiGenerate(system, user, call);
  return ollamaGenerateAnswer(system, user);
}
