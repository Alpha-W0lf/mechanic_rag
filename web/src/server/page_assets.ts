/**
 * M1 page assets (TS mirror of mecharag/page_assets.py business rules).
 * Ask path: resolve only (never rasterize).
 * GET /api/assets: ensure_page_png via pdftoppm ≤8s.
 */

import { spawn } from 'child_process';
import fs from 'fs';
import os from 'os';
import path from 'path';

import type { Citation } from './citations';

export type VisualAsset = {
  chunk_id: string;
  document_id: string;
  page_start: number;
  content_type: 'image/png';
  href: string;
};

export type Provenance = {
  redacted_locator?: string;
};

const RENDER_TIMEOUT_MS = 8000;
const PAGE_DPI = 150;

export function garageRoot(
  env: NodeJS.ProcessEnv = process.env,
  homedir: string = os.homedir(),
): string {
  const fromEnv = (env.MECHANIC_GARAGE_ROOT || '').trim();
  const raw = fromEnv || path.join(homedir, 'var', 'mechanic_garage');
  return path.resolve(raw);
}

export function rejectTraversalSegment(value: string): boolean {
  if (!value || value.trim() !== value) return true;
  if (value.includes('..') || value.startsWith('/') || value.includes('\\')) {
    return true;
  }
  if (value.includes('\0')) return true;
  return false;
}

export function assetFilePath(
  root: string,
  vehicleId: string,
  documentId: string,
  page: number,
): string {
  if (rejectTraversalSegment(vehicleId) || rejectTraversalSegment(documentId)) {
    throw new Error('unsafe vehicle_id or document_id');
  }
  if (page < 1 || page > 99999) throw new Error('page out of range');
  return path.join(
    root,
    'assets',
    vehicleId,
    documentId,
    `page_${String(page).padStart(5, '0')}.png`,
  );
}

export function resolveBronzePdf(
  root: string,
  redactedLocator: string | null | undefined,
): string | null {
  if (!redactedLocator || typeof redactedLocator !== 'string') return null;
  const loc = redactedLocator.trim();
  if (!loc || loc.startsWith('/') || loc.includes('..')) return null;
  const candidate = path.resolve(root, loc);
  const rootRes = path.resolve(root);
  if (!candidate.startsWith(rootRes + path.sep) && candidate !== rootRes) {
    return null;
  }
  try {
    if (!fs.existsSync(candidate) || !fs.statSync(candidate).isFile()) return null;
  } catch {
    return null;
  }
  return candidate;
}

export function resolveBronzeFromProvenance(
  root: string,
  provenance: Provenance | string | null | undefined,
): string | null {
  if (provenance == null) return null;
  let obj: Provenance;
  if (typeof provenance === 'string') {
    try {
      obj = JSON.parse(provenance) as Provenance;
    } catch {
      return null;
    }
  } else {
    obj = provenance;
  }
  return resolveBronzePdf(root, obj.redacted_locator);
}

export function assetHref(
  vehicleId: string,
  documentId: string,
  page: number,
): string {
  return `/api/assets/${encodeURIComponent(vehicleId)}/${encodeURIComponent(documentId)}/${page}`;
}

/** Pages to emit for a citation: page_start..min(page_end, page_start+2). */
export function citationPages(pageStart: number | null, pageEnd: number | null): number[] {
  if (pageStart == null || pageStart < 1) return [];
  const end = pageEnd != null && pageEnd >= pageStart ? pageEnd : pageStart;
  const last = Math.min(end, pageStart + 2);
  const pages: number[] = [];
  for (let p = pageStart; p <= last; p += 1) pages.push(p);
  return pages;
}

export function buildVisualAssets(input: {
  citations: Citation[];
  provenanceByDocumentId: Map<string, Provenance | string | null | undefined>;
  garageRootPath: string;
}): VisualAsset[] {
  const out: VisualAsset[] = [];
  const seen = new Set<string>();
  for (const c of input.citations) {
    const bronze = resolveBronzeFromProvenance(
      input.garageRootPath,
      input.provenanceByDocumentId.get(c.document_id),
    );
    if (!bronze) continue;
    for (const page of citationPages(c.page_start, c.page_end)) {
      const key = `${c.document_id}:${page}`;
      if (seen.has(key)) continue;
      seen.add(key);
      out.push({
        chunk_id: c.chunk_id,
        document_id: c.document_id,
        page_start: page,
        content_type: 'image/png',
        href: assetHref(c.vehicle_id, c.document_id, page),
      });
    }
  }
  return out;
}

function runPdftoppm(
  bronzePdf: string,
  outPrefix: string,
  page: number,
  timeoutMs: number,
): Promise<void> {
  return new Promise((resolve, reject) => {
    const child = spawn(
      'pdftoppm',
      [
        '-png',
        '-r',
        String(PAGE_DPI),
        '-f',
        String(page),
        '-l',
        String(page),
        '-singlefile',
        bronzePdf,
        outPrefix,
      ],
      { stdio: ['ignore', 'pipe', 'pipe'] },
    );
    const timer = setTimeout(() => {
      child.kill('SIGKILL');
      reject(new Error('pdftoppm timeout'));
    }, timeoutMs);
    child.on('error', (err) => {
      clearTimeout(timer);
      reject(err);
    });
    child.on('close', (code) => {
      clearTimeout(timer);
      if (code === 0) resolve();
      else reject(new Error(`pdftoppm exit ${code}`));
    });
  });
}

/**
 * Cache hit → path. Miss → pdftoppm ≤ timeoutMs. Throws on failure.
 */
export async function ensurePagePng(input: {
  garageRootPath: string;
  bronzePdf: string;
  vehicleId: string;
  documentId: string;
  page: number;
  timeoutMs?: number;
}): Promise<string> {
  const out = assetFilePath(
    input.garageRootPath,
    input.vehicleId,
    input.documentId,
    input.page,
  );
  if (fs.existsSync(out) && fs.statSync(out).size > 0) return out;

  const bronze = path.resolve(input.bronzePdf);
  const rootRes = path.resolve(input.garageRootPath);
  if (!bronze.startsWith(rootRes + path.sep)) {
    throw new Error('bronze outside garage root');
  }
  fs.mkdirSync(path.dirname(out), { recursive: true });
  const tmpPrefix = path.join(
    path.dirname(out),
    `.tmp_${input.page}_${process.pid}_${Date.now()}`,
  );
  const tmpPng = `${tmpPrefix}.png`;
  try {
    await runPdftoppm(
      bronze,
      tmpPrefix,
      input.page,
      input.timeoutMs ?? RENDER_TIMEOUT_MS,
    );
    if (!fs.existsSync(tmpPng)) throw new Error('pdftoppm produced no png');
    fs.renameSync(tmpPng, out);
  } finally {
    try {
      if (fs.existsSync(tmpPng)) fs.unlinkSync(tmpPng);
    } catch {
      /* ignore */
    }
  }
  return out;
}

export const M1_RENDER_TIMEOUT_MS = RENDER_TIMEOUT_MS;
