import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => ({} as any));
  return NextResponse.json({ ok: true, message: 'stub', body });
}
