import { describe, expect, it } from 'vitest';
import {
  assetHref,
  buildVisualAssets,
  citationPages,
  rejectTraversalSegment,
  resolveBronzePdf,
} from '@/server/page_assets';
import type { Citation } from '@/server/citations';
import fs from 'fs';
import os from 'os';
import path from 'path';

describe('page_assets M1', () => {
  it('rejects traversal segments', () => {
    expect(rejectTraversalSegment('../x')).toBe(true);
    expect(rejectTraversalSegment('ok-id')).toBe(false);
  });

  it('citationPages caps at +2', () => {
    expect(citationPages(5, 20)).toEqual([5, 6, 7]);
    expect(citationPages(null, 3)).toEqual([]);
    expect(citationPages(2, 2)).toEqual([2]);
  });

  it('buildVisualAssets emits href when bronze resolvable', () => {
    const root = fs.mkdtempSync(path.join(os.tmpdir(), 'm1-assets-'));
    const bronzeRel = path.join('bronze', 't', 'manual.pdf');
    const bronzeAbs = path.join(root, bronzeRel);
    fs.mkdirSync(path.dirname(bronzeAbs), { recursive: true });
    fs.writeFileSync(bronzeAbs, '%PDF');

    const citations: Citation[] = [
      {
        label: '1',
        chunk_id: 'c1',
        vehicle_id: 'cat:triumph',
        doc_family: 'service',
        document_id: 'doc-1',
        section_path: null,
        page_start: 1,
        page_end: 2,
      },
    ];
    const assets = buildVisualAssets({
      citations,
      provenanceByDocumentId: new Map([
        ['doc-1', { redacted_locator: 'bronze/t/manual.pdf' }],
      ]),
      garageRootPath: root,
    });
    expect(assets).toHaveLength(2);
    expect(assets[0].href).toBe(assetHref('cat:triumph', 'doc-1', 1));
    expect(assets[0].content_type).toBe('image/png');
  });

  it('omits visuals when bronze missing', () => {
    const root = fs.mkdtempSync(path.join(os.tmpdir(), 'm1-assets-'));
    const citations: Citation[] = [
      {
        label: '1',
        chunk_id: 'c1',
        vehicle_id: 'cat:triumph',
        doc_family: 'service',
        document_id: 'doc-1',
        section_path: null,
        page_start: 1,
        page_end: 1,
      },
    ];
    const assets = buildVisualAssets({
      citations,
      provenanceByDocumentId: new Map([
        ['doc-1', { redacted_locator: 'bronze/missing.pdf' }],
      ]),
      garageRootPath: root,
    });
    expect(assets).toEqual([]);
  });

  it('resolveBronzePdf blocks absolute and traversal', () => {
    const root = fs.mkdtempSync(path.join(os.tmpdir(), 'm1-assets-'));
    expect(resolveBronzePdf(root, '/etc/passwd')).toBeNull();
    expect(resolveBronzePdf(root, '../x')).toBeNull();
  });
});
