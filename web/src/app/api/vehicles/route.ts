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
    const message = err instanceof Error ? err.message : 'vehicles list failed';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
