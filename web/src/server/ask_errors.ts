/**
 * Public Ask error taxonomy (JH-39).
 *
 * Server logs may keep raw driver text. HTTP bodies must not leak
 * FATAL / ENOTFOUND / pooler host / tenant refs (PR #2 posture).
 */

export const ASK_ERROR_CLASSES = [
  'generator_unavailable',
  'database_unavailable',
  'rate_limited',
  'internal',
] as const;

export type AskErrorClass = (typeof ASK_ERROR_CLASSES)[number];

export const PUBLIC_ASK_ERROR: Record<AskErrorClass, string> = {
  generator_unavailable: 'Upstream dependency failure (generator)',
  database_unavailable: 'Upstream dependency failure (database)',
  rate_limited: 'Rate limited; try again shortly',
  internal: 'Internal error',
};

export type PublicAskFailure = {
  error: string;
  error_class: AskErrorClass;
  status: number;
};

const DATABASE_NODE_CODES = new Set([
  'ENOTFOUND',
  'ECONNREFUSED',
  'ETIMEDOUT',
  'ECONNRESET',
  'EAI_AGAIN',
  'EPIPE',
]);

const DATABASE_PG_CODES = new Set([
  '08000',
  '08001',
  '08003',
  '08004',
  '08006',
  '08P01',
  '28P01',
  '3D000',
  '53300',
  '57P01',
  '57P03',
]);

function errCode(err: unknown): string | undefined {
  if (!err || typeof err !== 'object') return undefined;
  const code = (err as { code?: unknown }).code;
  return typeof code === 'string' ? code : undefined;
}

function errMessage(err: unknown): string {
  if (err instanceof Error) return err.message;
  return String(err);
}

function errName(err: unknown): string | undefined {
  if (!err || typeof err !== 'object') return undefined;
  const name = (err as { name?: unknown }).name;
  return typeof name === 'string' ? name : undefined;
}

type GeminiLike = {
  name: string;
  httpStatus?: number;
  googleStatus?: string;
};

function asGemini(err: unknown): GeminiLike | null {
  if (errName(err) !== 'GeminiError') return null;
  return err as GeminiLike;
}

function ollamaStatus(err: unknown): number | undefined {
  if (errName(err) !== 'OllamaError') return undefined;
  const status = (err as { status?: unknown }).status;
  return typeof status === 'number' ? status : undefined;
}

export function isDatabaseError(err: unknown): boolean {
  const code = errCode(err);
  if (code && (DATABASE_NODE_CODES.has(code) || DATABASE_PG_CODES.has(code))) {
    return true;
  }
  const msg = errMessage(err).toLowerCase();
  return (
    msg.includes('enotfound') ||
    msg.includes('econnrefused') ||
    msg.includes('econnreset') ||
    msg.includes('connection terminated') ||
    msg.includes('remaining connection slots') ||
    msg.includes('too many clients already') ||
    msg.includes('password authentication failed') ||
    msg.includes('pg_hba') ||
    /\bfatal\b/.test(msg) ||
    /postgres|pooler|\.neon\.tech|supabase\.co/.test(msg)
  );
}

export function isRateLimitedError(err: unknown): boolean {
  const gemini = asGemini(err);
  if (gemini) {
    return (
      gemini.httpStatus === 429 || gemini.googleStatus === 'RESOURCE_EXHAUSTED'
    );
  }
  return ollamaStatus(err) === 429;
}

export function isGeneratorError(err: unknown): boolean {
  if (asGemini(err)) return true;
  if (errName(err) === 'OllamaError') return true;
  if (errName(err) === 'AbortError') return true;
  const msg = errMessage(err);
  return /^gemini /i.test(msg);
}

export function classifyAskError(err: unknown): AskErrorClass {
  if (isRateLimitedError(err)) return 'rate_limited';
  if (isGeneratorError(err)) return 'generator_unavailable';
  if (isDatabaseError(err)) return 'database_unavailable';
  return 'internal';
}

export function toPublicAskFailure(err: unknown): PublicAskFailure {
  const error_class = classifyAskError(err);
  return {
    error: PUBLIC_ASK_ERROR[error_class],
    error_class,
    status: error_class === 'rate_limited' ? 429 : 503,
  };
}
