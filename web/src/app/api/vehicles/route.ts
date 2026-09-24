import { NextResponse } from 'next/server';
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
      { error: 'Upstream dependency failure (database or internal)' },
      { status: 503 },
    );
  }
}
