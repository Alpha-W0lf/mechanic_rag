import { NextResponse } from 'next/server';
import { checkPostgres } from '@/server/db';
import { checkOllama } from '@/server/ollama';
import { isGeminiServing } from '@/server/providers';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/**
 * Liveness: process up → 200.
 * DB probe (`?mode=db`): SELECT 1 only → 200; fail → 503 JSON (never empty 500).
 * Readiness: Postgres required. Ollama required only when Gemini is unset
 * (local Compose). Hosted Gemini path is ready when Postgres is up.
 */
export async function GET(req: Request) {
  const url = new URL(req.url);
  const mode = url.searchParams.get('mode');

  if (mode === 'live' || mode === 'liveness') {
    return NextResponse.json({ status: 'ok', mode: 'liveness' });
  }

  // Readiness probes stay short; do not reuse OLLAMA_TIMEOUT_MS (generate can be 60s+).
  const readinessTimeoutMs = Number(process.env.DB_TIMEOUT_MS || 3000);

  try {
    if (mode === 'db') {
      const postgres = await checkPostgres(readinessTimeoutMs);
      const ready = postgres;
      return NextResponse.json(
        { status: ready ? 'ready' : 'not_ready', mode: 'db', checks: { postgres } },
        { status: ready ? 200 : 503 },
      );
    }

    const [postgres, ollama] = await Promise.all([
      checkPostgres(readinessTimeoutMs),
      checkOllama(readinessTimeoutMs),
    ]);

    const ready = postgres && (isGeminiServing() || ollama);
    return NextResponse.json(
      {
        status: ready ? 'ready' : 'not_ready',
        mode: 'readiness',
        checks: { postgres, ollama },
      },
      { status: ready ? 200 : 503 },
    );
  } catch {
    const dbOnly = mode === 'db';
    return NextResponse.json(
      {
        status: 'not_ready',
        mode: dbOnly ? 'db' : 'readiness',
        checks: dbOnly ? { postgres: false } : { postgres: false, ollama: false },
      },
      { status: 503 },
    );
  }
}
