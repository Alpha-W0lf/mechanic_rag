import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs';

import { query } from '@/server/db';
import {
  ensurePagePng,
  garageRoot,
  M1_RENDER_TIMEOUT_MS,
  rejectTraversalSegment,
  resolveBronzeFromProvenance,
  type Provenance,
} from '@/server/page_assets';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

type Params = {
  params: Promise<{ vehicle_id: string; document_id: string; page: string }>;
};

export async function GET(_req: NextRequest, { params }: Params) {
  const { vehicle_id, document_id, page: pageRaw } = await params;
  if (
    rejectTraversalSegment(vehicle_id) ||
    rejectTraversalSegment(document_id) ||
    vehicle_id.includes('..') ||
    document_id.includes('..')
  ) {
    return NextResponse.json({ error: 'invalid path' }, { status: 400 });
  }
  const page = Number(pageRaw);
  if (!Number.isInteger(page) || page < 1 || page > 99999) {
    return NextResponse.json({ error: 'invalid page' }, { status: 400 });
  }

  const root = garageRoot();
  let provenance: Provenance | null = null;
  try {
    const res = await query<{ provenance: unknown }>(
      `SELECT provenance FROM documents
       WHERE vehicle_id = $1 AND document_id = $2
       LIMIT 1`,
      [vehicle_id, document_id],
    );
    if ((res.rowCount ?? 0) === 0) {
      return NextResponse.json({ error: 'not found' }, { status: 404 });
    }
    provenance = (res.rows[0].provenance as Provenance) ?? null;
  } catch {
    return NextResponse.json({ error: 'database error' }, { status: 503 });
  }

  const bronze = resolveBronzeFromProvenance(root, provenance);
  if (!bronze) {
    return NextResponse.json({ error: 'bronze unavailable' }, { status: 404 });
  }

  try {
    const pngPath = await ensurePagePng({
      garageRootPath: root,
      bronzePdf: bronze,
      vehicleId: vehicle_id,
      documentId: document_id,
      page,
      timeoutMs: M1_RENDER_TIMEOUT_MS,
    });
    const buf = fs.readFileSync(pngPath);
    return new NextResponse(buf, {
      status: 200,
      headers: {
        'Content-Type': 'image/png',
        'Cache-Control': 'private, max-age=3600',
      },
    });
  } catch {
    return NextResponse.json({ error: 'render failed' }, { status: 404 });
  }
}
