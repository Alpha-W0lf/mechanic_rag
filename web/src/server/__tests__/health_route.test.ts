/**
 * Health contract characterization (JH-29).
 *
 * Pins: mode=db; connect-error never empty 500; hosted Gemini readiness
 * does not require Ollama; local (no Gemini) still requires Ollama.
 */
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const checkPostgres = vi.fn();
const checkOllama = vi.fn();

vi.mock('@/server/db', () => ({
  checkPostgres: (...args: unknown[]) => checkPostgres(...args),
}));

vi.mock('@/server/ollama', () => ({
  checkOllama: (...args: unknown[]) => checkOllama(...args),
}));

async function getHealth(url: string): Promise<{
  status: number;
  body: Record<string, unknown>;
  raw: string;
}> {
  const { GET } = await import('@/app/api/health/route');
  const res = await GET(new Request(url));
  const raw = await res.text();
  let body: Record<string, unknown> = {};
  if (raw) {
    body = JSON.parse(raw) as Record<string, unknown>;
  }
  return { status: res.status, body, raw };
}

function expectJsonNonEmpty(result: { status: number; raw: string }) {
  expect(result.raw.length).toBeGreaterThan(0);
  expect(result.status).not.toBe(500);
  expect(() => JSON.parse(result.raw)).not.toThrow();
}

describe('GET /api/health', () => {
  beforeEach(() => {
    checkPostgres.mockReset();
    checkOllama.mockReset();
    vi.resetModules();
    vi.unstubAllEnvs();
  });

  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it('mode=live is liveness-only (existing contract)', async () => {
    const result = await getHealth('http://localhost/api/health?mode=live');
    expect(result.status).toBe(200);
    expect(result.body).toEqual({ status: 'ok', mode: 'liveness' });
    expect(checkPostgres).not.toHaveBeenCalled();
    expect(checkOllama).not.toHaveBeenCalled();
  });

  it('mode=db succeeds with 200 when SELECT 1 works and does not call Ollama', async () => {
    checkPostgres.mockResolvedValue(true);
    const result = await getHealth('http://localhost/api/health?mode=db');
    expect(result.status).toBe(200);
    expect(result.body).toEqual({
      status: 'ready',
      mode: 'db',
      checks: { postgres: true },
    });
    expect(checkOllama).not.toHaveBeenCalled();
  });

  it('mode=db fails with 503 JSON when SELECT 1 fails (never empty 500)', async () => {
    checkPostgres.mockResolvedValue(false);
    const result = await getHealth('http://localhost/api/health?mode=db');
    expectJsonNonEmpty(result);
    expect(result.status).toBe(503);
    expect(result.body).toEqual({
      status: 'not_ready',
      mode: 'db',
      checks: { postgres: false },
    });
    expect(JSON.stringify(result.body)).not.toMatch(
      /ENOTFOUND|tenant\/user|npliiuigpenkrqaewtdf|FATAL/i,
    );
    expect(checkOllama).not.toHaveBeenCalled();
  });

  it('connect-error throw from checkPostgres is 503 JSON, not empty 500', async () => {
    checkPostgres.mockRejectedValue(
      new Error(
        '(ENOTFOUND) tenant/user postgres.npliiuigpenkrqaewtdf not found',
      ),
    );
    const result = await getHealth('http://localhost/api/health');
    expectJsonNonEmpty(result);
    expect(result.status).toBe(503);
    expect(result.raw.length).toBeGreaterThan(0);
    expect(JSON.stringify(result.body)).not.toMatch(
      /ENOTFOUND|tenant\/user|npliiuigpenkrqaewtdf|FATAL/i,
    );
    expect(result.body.status).toBe('not_ready');
  });

  it('hosted readiness: GEMINI set + Ollama down + Postgres ok → 200', async () => {
    vi.stubEnv('GEMINI_API_KEY', 'test-not-a-real-key');
    checkPostgres.mockResolvedValue(true);
    checkOllama.mockResolvedValue(false);
    const result = await getHealth('http://localhost/api/health');
    expect(result.status).toBe(200);
    expect(result.body.status).toBe('ready');
    expect(result.body.mode).toBe('readiness');
    expect(result.body.checks).toEqual({ postgres: true, ollama: false });
  });

  it('hosted readiness still 503 when Gemini is set but Postgres is down', async () => {
    vi.stubEnv('GEMINI_API_KEY', 'test-not-a-real-key');
    checkPostgres.mockResolvedValue(false);
    checkOllama.mockResolvedValue(false);
    const result = await getHealth('http://localhost/api/health');
    expect(result.status).toBe(503);
    expect(result.body).toEqual({
      status: 'not_ready',
      mode: 'readiness',
      checks: { postgres: false, ollama: false },
    });
  });

  it('local (no Gemini): Postgres ok + Ollama down → 503 (existing contract)', async () => {
    vi.stubEnv('GEMINI_API_KEY', '');
    checkPostgres.mockResolvedValue(true);
    checkOllama.mockResolvedValue(false);
    const result = await getHealth('http://localhost/api/health');
    expect(result.status).toBe(503);
    expect(result.body).toEqual({
      status: 'not_ready',
      mode: 'readiness',
      checks: { postgres: true, ollama: false },
    });
  });

  it('local (no Gemini): Postgres + Ollama ok → 200 (existing contract)', async () => {
    vi.stubEnv('GEMINI_API_KEY', '');
    checkPostgres.mockResolvedValue(true);
    checkOllama.mockResolvedValue(true);
    const result = await getHealth('http://localhost/api/health');
    expect(result.status).toBe(200);
    expect(result.body).toEqual({
      status: 'ready',
      mode: 'readiness',
      checks: { postgres: true, ollama: true },
    });
  });
});
