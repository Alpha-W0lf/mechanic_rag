import { NextRequest, NextResponse } from 'next/server';
import { handleAsk, validateAskRequest } from '@/server/ask';

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

  const result = await handleAsk(validated.value);
  if ('status' in result && 'error' in result) {
    return NextResponse.json({ error: result.error }, { status: result.status });
  }

  return NextResponse.json({
    answer: result.answer,
    citations: result.citations,
    outcome: result.outcome,
    diagnostics: result.diagnostics,
  });
}
