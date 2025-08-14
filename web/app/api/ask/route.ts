import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
  const body: unknown = await req.json().catch(() => ({}));
  return NextResponse.json({ ok: true, message: 'stub', body });
}
