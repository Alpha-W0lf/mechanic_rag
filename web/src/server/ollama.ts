/** Ollama HTTP adapters for embeddings + generation. */

export class OllamaError extends Error {
  constructor(message: string, readonly status?: number) {
    super(message);
    this.name = 'OllamaError';
  }
}

function baseUrl(): string {
  return (process.env.OLLAMA_BASE_URL || 'http://127.0.0.1:11434').replace(
    /\/$/,
    '',
  );
}

export async function checkOllama(timeoutMs = 3000): Promise<boolean> {
  const ctrl = new AbortController();
  const t = setTimeout(() => ctrl.abort(), timeoutMs);
  try {
    const res = await fetch(`${baseUrl()}/api/tags`, { signal: ctrl.signal });
    return res.ok;
  } catch {
    return false;
  } finally {
    clearTimeout(t);
  }
}

export async function embedText(text: string): Promise<{
  embedding: number[];
  model: string;
  dim: number;
}> {
  const model = process.env.EMBEDDING_MODEL || 'nomic-embed-text';
  const expectedDim = Number(process.env.EMBEDDING_DIM || 768);
  const timeoutMs = Number(process.env.OLLAMA_TIMEOUT_MS || 60000);
  const ctrl = new AbortController();
  const t = setTimeout(() => ctrl.abort(), timeoutMs);
  try {
    const res = await fetch(`${baseUrl()}/api/embeddings`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ model, prompt: text }),
      signal: ctrl.signal,
    });
    if (!res.ok) {
      throw new OllamaError(`embed failed: ${res.status}`, res.status);
    }
    const data = (await res.json()) as { embedding?: number[] };
    if (!data.embedding || !Array.isArray(data.embedding)) {
      throw new OllamaError('embed response missing embedding');
    }
    if (data.embedding.length !== expectedDim) {
      throw new OllamaError(
        `embed dim mismatch: got ${data.embedding.length}, expected ${expectedDim}`,
      );
    }
    return { embedding: data.embedding, model, dim: expectedDim };
  } finally {
    clearTimeout(t);
  }
}

export async function generateAnswer(
  system: string,
  user: string,
): Promise<{ text: string; model: string }> {
  const model = process.env.OLLAMA_MODEL || 'gemma4:e2b';
  const timeoutMs = Number(process.env.OLLAMA_TIMEOUT_MS || 60000);
  const ctrl = new AbortController();
  const t = setTimeout(() => ctrl.abort(), timeoutMs);
  try {
    const res = await fetch(`${baseUrl()}/api/generate`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({
        model,
        system,
        prompt: user,
        stream: false,
        options: { temperature: 0.1 },
      }),
      signal: ctrl.signal,
    });
    if (!res.ok) {
      throw new OllamaError(`generate failed: ${res.status}`, res.status);
    }
    const data = (await res.json()) as { response?: string };
    if (typeof data.response !== 'string') {
      throw new OllamaError('generate response missing text');
    }
    return { text: data.response, model };
  } finally {
    clearTimeout(t);
  }
}
