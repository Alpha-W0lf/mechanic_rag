/**
 * JH-54: fail if a retired hosted project ref re-enters the tracked tree.
 *
 * The banned token is stored only as SHA-256. Candidates are every
 * 20-letter lowercase window in git-tracked files (case-folded).
 */
import { execFileSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import { readFileSync } from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';

const REF_LEN = 20;
const BANNED_SHA256 =
  '20c65ec1767cfc52e05de31b4f368a63267fa16c6f827115bf3dda4a582e865c';

function sha256Hex(value: string): string {
  return createHash('sha256').update(value, 'utf8').digest('hex');
}

function repoRoot(): string {
  return execFileSync('git', ['rev-parse', '--show-toplevel'], {
    encoding: 'utf8',
  }).trim();
}

function trackedFiles(root: string): string[] {
  const raw = execFileSync('git', ['ls-files', '-z'], {
    cwd: root,
    encoding: 'utf8',
  });
  return raw.split('\0').filter(Boolean);
}

function fileHasBannedToken(text: string): boolean {
  const runs = text.toLowerCase().match(/[a-z]{20,}/g) ?? [];
  for (const run of runs) {
    for (let i = 0; i + REF_LEN <= run.length; i++) {
      if (sha256Hex(run.slice(i, i + REF_LEN)) === BANNED_SHA256) {
        return true;
      }
    }
  }
  return false;
}

describe('retired hosted project ref (JH-54)', () => {
  it('does not appear as a 20-letter token in the tracked tree', () => {
    expect(BANNED_SHA256).toMatch(/^[0-9a-f]{64}$/);
    const root = repoRoot();
    const hits: string[] = [];
    for (const rel of trackedFiles(root)) {
      const buf = readFileSync(path.join(root, rel));
      if (buf.includes(0)) continue;
      if (fileHasBannedToken(buf.toString('utf8'))) {
        hits.push(rel);
      }
    }
    expect(hits).toEqual([]);
  });
});
