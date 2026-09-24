import { NextRequest, NextResponse } from 'next/server';
import { handleAsk, validateAskRequest } from '@/server/ask';
import { PUBLIC_ASK_ERROR } from '@/server/ask_errors';
import { consumeAskRateLimit } from '@/server/ask_rate_limit';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => null);
  const validated = validateAskRequest(body);
  if (!validated.ok) {
    return NextResponse.json(
      { error: validated.error },
      { status: validated.status },
    );
  }

  const limited = await consumeAskRateLimit({ headers: req.headers });
  if (!limited.ok) {
    console.log(
      JSON.stringify({
        event: 'ask',
        outcome: 'rate_limited',
        error_class: 'rate_limited',
        limit: limited.reason,
      }),
    );
    return NextResponse.json(
      {
        error: PUBLIC_ASK_ERROR.rate_limited,
        error_class: 'rate_limited',
      },
      {
        status: 429,
        headers: { 'Retry-After': String(limited.retryAfterSec) },
      },
    );
  }

  const result = await handleAsk(validated.value);
  if ('status' in result && 'error' in result) {
    return NextResponse.json(
      {
        error: result.error,
        ...(result.error_class ? { error_class: result.error_class } : {}),
      },
      { status: result.status },
    );
  }

  return NextResponse.json({
    answer: result.answer,
    citations: result.citations,
    outcome: result.outcome,
    diagnostics: result.diagnostics,
    visual_assets: result.visual_assets,
    ...(result.error_class ? { error_class: result.error_class } : {}),
  });
}
