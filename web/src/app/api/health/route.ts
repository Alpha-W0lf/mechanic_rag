import { NextResponse } from 'next/server';
import { checkPostgres } from '@/server/db';
import { checkOllama } from '@/server/ollama';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/**
 * Liveness: process up → 200.
 * Readiness: Postgres + Ollama reachable → 200; else non-200.
 * Query ?mode=live for liveness-only.
 */
export async function GET(req: Request) {
  const url = new URL(req.url);
  const mode = url.searchParams.get('mode');

  if (mode === 'live' || mode === 'liveness') {
    return NextResponse.json({ status: 'ok', mode: 'liveness' });
  }

  // Readiness probes stay short; do not reuse OLLAMA_TIMEOUT_MS (generate can be 60s+).
  const readinessTimeoutMs = Number(process.env.DB_TIMEOUT_MS || 3000);
  const dbTimeout = readinessTimeoutMs;
  const ollamaTimeout = readinessTimeoutMs;

  const [postgres, ollama] = await Promise.all([
    checkPostgres(dbTimeout),
    checkOllama(ollamaTimeout),
  ]);

  const ready = postgres && ollama;
  const body = {
    status: ready ? 'ready' : 'not_ready',
    mode: 'readiness',
    checks: { postgres, ollama },
  };

  return NextResponse.json(body, { status: ready ? 200 : 503 });
}
