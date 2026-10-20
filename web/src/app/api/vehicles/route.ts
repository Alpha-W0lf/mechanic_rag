import { NextResponse } from 'next/server';
import { PUBLIC_ASK_ERROR } from '@/server/ask_errors';
import { listAskableVehicles } from '@/server/retrievers';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/** Thin catalog for the home vehicle select — fixture: + cat: only. */
export async function GET() {
  try {
    const vehicles = await listAskableVehicles();
    return NextResponse.json({ vehicles });
  } catch (err) {
    console.error(
      '[vehicles] list failed',
      err instanceof Error ? err.message : err,
    );
    return NextResponse.json(
      {
        error: PUBLIC_ASK_ERROR.database_unavailable,
        error_class: 'database_unavailable',
      },
      { status: 503 },
    );
  }
}
