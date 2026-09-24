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
 * Finite retry for hosted Gemini REST (JH-39).
 * Shape matches Google Gen AI guidance: retry 429/503 with exponential
 * backoff + jitter, then stop. maxDelay is capped below the SDK's 60s
 * default so serverless Ask does not sleep past the function budget.
 * @see https://docs.cloud.google.com/vertex-ai/generative-ai/docs/retry-strategy
 */
export const GEMINI_RETRY = {
  maxAttempts: 4,
  initialDelayMs: 1000,
  maxDelayMs: 8000,
  expBase: 2,
  jitterMs: 1000,
  retryStatuses: [429, 503] as readonly number[],
};

export class GeminiError extends Error {
  readonly name = 'GeminiError';
  constructor(
    message: string,
    readonly httpStatus?: number,
    readonly googleStatus?: string,
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

export async function geminiFetch(
  url: string,
  init: RequestInit,
  opts?: { timeoutMs?: number; sleep?: SleepFn; random?: () => number },
): Promise<Response> {
  const timeoutMs =
    opts?.timeoutMs ?? Number(process.env.OLLAMA_TIMEOUT_MS || 60000);
  const sleep =
    opts?.sleep ??
    (process.env.GEMINI_RETRY_NO_SLEEP === '1'
      ? async () => undefined
      : defaultSleep);
  const random = opts?.random ?? Math.random;
  const { maxAttempts } = GEMINI_RETRY;

  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    const ctrl = new AbortController();
    const t = setTimeout(() => ctrl.abort(), timeoutMs);
    try {
      const res = await fetch(url, { ...init, signal: ctrl.signal });
      if (isGeminiRetryStatus(res.status) && attempt < maxAttempts - 1) {
        await res.text().catch(() => undefined);
        await sleep(geminiBackoffMs(attempt, random));
        continue;
      }
      return res;
    } finally {
      clearTimeout(t);
    }
  }
  return new Response(null, { status: 503 });
}

function throwGeminiHttp(
  kind: 'embed' | 'generate',
  res: Response,
  googleStatus?: string,
): never {
  throw new GeminiError(
    `gemini ${kind} failed: ${res.status}`,
    res.status,
    googleStatus,
  );
}

async function geminiEmbed(
  text: string,
): Promise<{ embedding: number[]; model: string; dim: number }> {
  const key = geminiKey();
  const model = process.env.EMBEDDING_MODEL_GEMINI || DEFAULT_GEMINI_EMBED_MODEL;
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
    { timeoutMs },
  );
  if (!res.ok) {
    const { googleStatus } = await readGeminiError(res);
    throwGeminiHttp('embed', res, googleStatus);
  }
  const data = (await res.json()) as {
    embedding?: { values?: number[] };
  };
  const values = data.embedding?.values;
  if (!Array.isArray(values)) throw new GeminiError('gemini embed missing values');
  if (values.length !== dim) {
    throw new GeminiError(`gemini embed dim mismatch: ${values.length} != ${dim}`);
  }
  return { embedding: values, model, dim };
}

export async function embedText(
  text: string,
): Promise<{ embedding: number[]; model: string; dim: number }> {
  if (geminiKey()) return geminiEmbed(text);
  return ollamaEmbedText(text);
}

async function geminiGenerate(
  system: string,
  user: string,
): Promise<{ text: string; model: string }> {
  const key = geminiKey();
  const model = process.env.GEMINI_MODEL || DEFAULT_GEMINI_GENERATE_MODEL;
  const timeoutMs = Number(process.env.OLLAMA_TIMEOUT_MS || 60000);
  const generationConfig: Record<string, unknown> = { temperature: 0.1 };
  // Official Gemma-on-Gemini REST: thinkingLevel "minimal" disables thinking.
  // https://ai.google.dev/gemma/docs/core/gemma_on_gemini_api
  if (model.startsWith('gemma-')) {
    generationConfig.thinkingConfig = { thinkingLevel: 'minimal' };
  }
  const res = await geminiFetch(
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
    { timeoutMs },
  );
  if (!res.ok) {
    const { googleStatus } = await readGeminiError(res);
    throwGeminiHttp('generate', res, googleStatus);
  }
  const data = (await res.json()) as {
    candidates?: { content?: { parts?: { text?: string }[] } }[];
  };
  const parts = data.candidates?.[0]?.content?.parts ?? [];
  const text = parts.map((p) => p.text ?? '').join('');
  if (!text) throw new GeminiError('gemini generate returned no text');
  return { text, model };
}

export async function generateAnswer(
  system: string,
  user: string,
): Promise<{ text: string; model: string }> {
  if (geminiKey()) return geminiGenerate(system, user);
  return ollamaGenerateAnswer(system, user);
}
