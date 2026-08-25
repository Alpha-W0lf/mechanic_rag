/**
 * Provider dispatch for embeddings + generation.
 *
 * When GEMINI_API_KEY is present, the hosted Gemini path serves queries
 * (matching the public fixture corpus, which is embedded with
 * gemini-embedding-001 @ 768). Otherwise callers fall back to the local
 * Ollama path unchanged.
 */

import {
  OllamaError,
  embedText as ollamaEmbedText,
  generateAnswer as ollamaGenerateAnswer,
} from './ollama';

function geminiKey(): string {
  return process.env.GEMINI_API_KEY || '';
}

export { OllamaError };

async function geminiEmbed(
  text: string,
): Promise<{ embedding: number[]; model: string; dim: number }> {
  const key = geminiKey();
  const model = process.env.EMBEDDING_MODEL_GEMINI || 'gemini-embedding-001';
  const dim = Number(process.env.EMBEDDING_DIM || 768);
  const timeoutMs = Number(process.env.OLLAMA_TIMEOUT_MS || 60000);
  const ctrl = new AbortController();
  const t = setTimeout(() => ctrl.abort(), timeoutMs);
  try {
    const res = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/${model}:embedContent?key=${key}`,
      {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          model: `models/${model}`,
          content: { parts: [{ text }] },
          outputDimensionality: dim,
        }),
        signal: ctrl.signal,
      },
    );
    if (!res.ok) {
      throw new Error(`gemini embed failed: ${res.status}`);
    }
    const data = (await res.json()) as {
      embedding?: { values?: number[] };
    };
    const values = data.embedding?.values;
    if (!Array.isArray(values)) throw new Error('gemini embed missing values');
    if (values.length !== dim) {
      throw new Error(`gemini embed dim mismatch: ${values.length} != ${dim}`);
    }
    return { embedding: values, model, dim };
  } finally {
    clearTimeout(t);
  }
}

export async function embedText(
  text: string,
): Promise<{ embedding: number[]; model: string; dim: number }> {
  if (geminiKey()) return geminiEmbed(text);
  return ollamaEmbedText(text);
}

async function geminiGenerate(
  system: string,
  user: string,
): Promise<{ text: string; model: string }> {
  const key = geminiKey();
  const model = process.env.GEMINI_MODEL || 'gemini-3.6-flash';
  const timeoutMs = Number(process.env.OLLAMA_TIMEOUT_MS || 60000);
  const ctrl = new AbortController();
  const t = setTimeout(() => ctrl.abort(), timeoutMs);
  try {
    const res = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${key}`,
      {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          system_instruction: { parts: [{ text: system }] },
          contents: [{ role: 'user', parts: [{ text: user }] }],
          generationConfig: { temperature: 0.1 },
        }),
        signal: ctrl.signal,
      },
    );
    if (!res.ok) {
      throw new Error(`gemini generate failed: ${res.status}`);
    }
    const data = (await res.json()) as {
      candidates?: { content?: { parts?: { text?: string }[] } }[];
    };
    const parts = data.candidates?.[0]?.content?.parts ?? [];
    const text = parts.map((p) => p.text ?? '').join('');
    if (!text) throw new Error('gemini generate returned no text');
    return { text, model };
  } finally {
    clearTimeout(t);
  }
}

export async function generateAnswer(
  system: string,
  user: string,
): Promise<{ text: string; model: string }> {
  if (geminiKey()) return geminiGenerate(system, user);
  return ollamaGenerateAnswer(system, user);
}
