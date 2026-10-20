/**
 * M2 CLIP text-tower query embed via Python [m2] CLI.
 * Fail-open: returns null on timeout/missing deps so ask degrades to text RRF.
 */

import { spawn } from 'child_process';
import path from 'path';

const DEFAULT_DIM = 512;
const DEFAULT_MODEL = 'openai/clip-vit-base-patch32';

export type ClipQueryEmbed = {
  embedding: number[];
  model: string;
  dim: number;
};

function resolvePython(): string {
  const fromEnv = (process.env.MECHANIC_PYTHON || '').trim();
  if (fromEnv) return fromEnv;
  // web/ cwd → repo .venv
  return path.resolve(process.cwd(), '..', '.venv', 'bin', 'python');
}

/**
 * Embed query text with frozen CLIP text tower.
 * Business rule: dim must be 512; otherwise treat as failure (degrade).
 */
export async function embedClipQueryText(
  text: string,
  opts?: { timeoutMs?: number; pythonPath?: string },
): Promise<ClipQueryEmbed | null> {
  const q = text.trim();
  if (!q) return null;
  const timeoutMs = opts?.timeoutMs ?? Number(process.env.CLIP_QUERY_TIMEOUT_MS || 20000);
  const python = opts?.pythonPath ?? resolvePython();

  return new Promise((resolve) => {
    const child = spawn(
      python,
      ['-m', 'mecharag.clip_query', '--text', q],
      {
        cwd: path.resolve(process.cwd(), '..'),
        env: process.env,
        stdio: ['ignore', 'pipe', 'pipe'],
      },
    );
    let stdout = '';
    let stderr = '';
    const timer = setTimeout(() => {
      child.kill('SIGKILL');
      resolve(null);
    }, timeoutMs);

    child.stdout.on('data', (b: Buffer) => {
      stdout += b.toString('utf8');
    });
    child.stderr.on('data', (b: Buffer) => {
      stderr += b.toString('utf8');
    });
    child.on('error', () => {
      clearTimeout(timer);
      resolve(null);
    });
    child.on('close', (code) => {
      clearTimeout(timer);
      if (code !== 0) {
        resolve(null);
        return;
      }
      try {
        const data = JSON.parse(stdout.trim()) as {
          embedding?: number[];
          dim?: number;
          model?: string;
        };
        if (!data.embedding || !Array.isArray(data.embedding)) {
          resolve(null);
          return;
        }
        const dim = data.dim ?? data.embedding.length;
        if (dim !== DEFAULT_DIM || data.embedding.length !== DEFAULT_DIM) {
          resolve(null);
          return;
        }
        resolve({
          embedding: data.embedding,
          dim: DEFAULT_DIM,
          model: data.model || DEFAULT_MODEL,
        });
      } catch {
        void stderr;
        resolve(null);
      }
    });
  });
}
