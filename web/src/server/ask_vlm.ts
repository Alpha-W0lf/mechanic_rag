/**
 * M3 optional local VLM assist — fail-open; text citations own torque/spec numbers.
 *
 * Business rules (Ready freeze):
 * - MECHANIC_VLM off by default → never call vision model.
 * - Invoke only when flag on AND (explicit diagram flag OR diagram heuristic)
 *   AND torque-only questions do not fire.
 * - Use cached page PNGs only (ask path never rasterizes).
 * - Timeout 45s → degrade empty notes.
 * - Strip VLM numeric/torque claims not present in cited text.
 */

import fs from 'fs';

import type { Citation } from './citations';
import { assetFilePath, garageRoot } from './page_assets';

export const VLM_MODEL_DEFAULT = 'gemma4:e2b';
export const VLM_TIMEOUT_MS_DEFAULT = 45_000;
export const VLM_PROMPT =
  'Describe only what is visible in this service-manual page image. ' +
  'Do NOT invent torque or numeric specs. If you see a diagram, say what it shows. ' +
  'If text is unreadable, say so.';

const TORQUE_ONLY_RE =
  /\b(torque|n·m|n\.m|\bnm\b|lbf|ft-?lb|ft·lb|lb-?ft)\b/i;
const DIAGRAM_RE =
  /\b(diagram|figure|schematic|wiring|routing|connector|layout|illustration|exploded)\b/i;
const NUMERIC_CLAIM_RE =
  /\b\d+(?:\.\d+)?\s*(?:n·m|n\.m|nm|lbf(?:·ft)?|ft-?lb|ft·lb|lb-?ft|mm|in(?:ch(?:es)?)?)\b/gi;

export type VlmResult = {
  invoked: boolean;
  notes: string | null;
  degraded: boolean;
  reason?: string;
  model?: string;
  ms?: number;
  pages?: number[];
};

export function isVlmEnabled(env: NodeJS.ProcessEnv = process.env): boolean {
  const v = (env.MECHANIC_VLM || '').trim().toLowerCase();
  return v === '1' || v === 'true' || v === 'yes' || v === 'on';
}

/**
 * Router: flag must already be on. Torque-only → false.
 * Explicit diagramAssist → true. Else heuristic on question text.
 */
export function shouldInvokeVlm(input: {
  question: string;
  diagramAssist?: boolean;
}): boolean {
  const q = input.question.trim();
  if (!q) return false;
  if (TORQUE_ONLY_RE.test(q) && !DIAGRAM_RE.test(q)) return false;
  if (input.diagramAssist === true) return true;
  return DIAGRAM_RE.test(q);
}

export function resolveCachedPagePng(input: {
  vehicleId: string;
  documentId: string;
  page: number;
  root?: string;
}): string | null {
  try {
    const root = input.root ?? garageRoot();
    const file = assetFilePath(root, input.vehicleId, input.documentId, input.page);
    if (!fs.existsSync(file) || !fs.statSync(file).isFile()) return null;
    return file;
  } catch {
    return null;
  }
}

/** Pick up to `cap` citation pages that already have cached PNGs. */
export function pickCachedPngsForVlm(
  citations: Citation[],
  vehicleId: string,
  cap = 2,
  root?: string,
): { page: number; documentId: string; path: string }[] {
  const out: { page: number; documentId: string; path: string }[] = [];
  const seen = new Set<string>();
  for (const c of citations) {
    if (out.length >= cap) break;
    const page = c.page_start;
    if (typeof page !== 'number' || page < 1) continue;
    const documentId = c.document_id;
    if (!documentId) continue;
    const key = `${documentId}:${page}`;
    if (seen.has(key)) continue;
    seen.add(key);
    const png = resolveCachedPagePng({ vehicleId, documentId, page, root });
    if (!png) continue;
    out.push({ page, documentId, path: png });
  }
  return out;
}

/**
 * Remove numeric/unit claims from VLM prose unless the token appears in cited text.
 * Business rule: text citations own specs; VLM may keep layout prose only.
 */
export function filterVlmNotesAgainstCitations(
  notes: string,
  citedTexts: string[],
): string {
  const citedBlob = citedTexts.join('\n').toLowerCase();
  return notes.replace(NUMERIC_CLAIM_RE, (match) => {
    const compact = match.toLowerCase().replace(/\s+/g, '');
    if (citedBlob.replace(/\s+/g, '').includes(compact)) return match;
    const num = match.match(/\d+(?:\.\d+)?/)?.[0];
    if (num && citedBlob.includes(num.toLowerCase())) {
      // Number appears but full unit phrase may not — still omit to fail closed.
    }
    return '[spec omitted — not in text citation]';
  });
}

function ollamaBase(): string {
  return (process.env.OLLAMA_BASE_URL || 'http://127.0.0.1:11434').replace(/\/$/, '');
}

export async function callLocalVlm(input: {
  pngPaths: string[];
  question: string;
  timeoutMs?: number;
  model?: string;
  env?: NodeJS.ProcessEnv;
}): Promise<{ text: string; model: string; ms: number } | null> {
  const env = input.env ?? process.env;
  if ((env.MECHANIC_VLM_FORCE_FAIL || '').trim() === '1') {
    return null;
  }
  const model = input.model || env.MECHANIC_VLM_MODEL || VLM_MODEL_DEFAULT;
  const timeoutMs =
    input.timeoutMs ?? Number(env.MECHANIC_VLM_TIMEOUT_MS || VLM_TIMEOUT_MS_DEFAULT);
  const images: string[] = [];
  for (const p of input.pngPaths) {
    try {
      images.push(fs.readFileSync(p).toString('base64'));
    } catch {
      return null;
    }
  }
  if (images.length === 0) return null;

  const ctrl = new AbortController();
  const t = setTimeout(() => ctrl.abort(), timeoutMs);
  const t0 = Date.now();
  try {
    const res = await fetch(`${ollamaBase()}/api/generate`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({
        model,
        prompt: `${VLM_PROMPT}\n\nUser question: ${input.question}`,
        images,
        stream: false,
        options: { temperature: 0.2 },
      }),
      signal: ctrl.signal,
    });
    if (!res.ok) return null;
    const data = (await res.json()) as { response?: string };
    const text = (data.response || '').trim();
    if (!text) return null;
    return { text, model, ms: Date.now() - t0 };
  } catch {
    return null;
  } finally {
    clearTimeout(t);
  }
}

/**
 * Optional VLM assist. Always fail-open to notes=null (never throws).
 */
export async function maybeAssistWithVlm(input: {
  question: string;
  vehicleId: string;
  citations: Citation[];
  citedTexts: string[];
  diagramAssist?: boolean;
  env?: NodeJS.ProcessEnv;
}): Promise<VlmResult> {
  try {
    const env = input.env ?? process.env;
    if (!isVlmEnabled(env)) {
      return { invoked: false, notes: null, degraded: false, reason: 'vlm_disabled' };
    }
    if (!shouldInvokeVlm({ question: input.question, diagramAssist: input.diagramAssist })) {
      return { invoked: false, notes: null, degraded: false, reason: 'router_skip' };
    }
    const pngs = pickCachedPngsForVlm(input.citations, input.vehicleId, 2);
    if (pngs.length === 0) {
      return {
        invoked: false,
        notes: null,
        degraded: true,
        reason: 'no_cached_png',
      };
    }
    const raw = await callLocalVlm({
      pngPaths: pngs.map((p) => p.path),
      question: input.question,
      env,
    });
    if (!raw) {
      return {
        invoked: true,
        notes: null,
        degraded: true,
        reason: 'vlm_unavailable_or_timeout',
        pages: pngs.map((p) => p.page),
      };
    }
    const filtered = filterVlmNotesAgainstCitations(raw.text, input.citedTexts);
    return {
      invoked: true,
      notes: filtered,
      degraded: false,
      model: raw.model,
      ms: raw.ms,
      pages: pngs.map((p) => p.page),
    };
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'unknown';
    return {
      invoked: true,
      notes: null,
      degraded: true,
      reason: `vlm_internal_error:${msg.slice(0, 80)}`,
    };
  }
}
