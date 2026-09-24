/**
 * JH-42 — POST /api/ask wires the abuse shield onto the public error shape.
 *
 * Under limit → handleAsk runs.
 * Over limit → HTTP 429, error_class rate_limited, Retry-After, handleAsk skipped.
 * Store fail-open → handleAsk still runs.
 */
import { NextRequest } from 'next/server';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { PUBLIC_ASK_ERROR } from '@/server/ask_errors';

const consumeAskRateLimit = vi.fn();
const handleAsk = vi.fn();

vi.mock('@/server/ask_rate_limit', () => ({
  consumeAskRateLimit: (...args: unknown[]) => consumeAskRateLimit(...args),
}));

vi.mock('@/server/ask', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@/server/ask')>();
  return {
    ...actual,
    handleAsk: (...args: unknown[]) => handleAsk(...args),
  };
});

async function postAsk(ip = '203.0.113.10'): Promise<{
  status: number;
  body: Record<string, unknown>;
  raw: string;
  retryAfter: string | null;
}> {
  const { POST } = await import('@/app/api/ask/route');
  const res = await POST(
    new NextRequest('http://localhost/api/ask', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-real-ip': ip,
      },
      body: JSON.stringify({
        vehicle_id: 'fixture:honda-s2000-demo',
        question: 'What is the oil drain plug torque?',
      }),
    }),
  );
  const raw = await res.text();
  return {
    status: res.status,
    body: JSON.parse(raw) as Record<string, unknown>,
    raw,
    retryAfter: res.headers.get('Retry-After'),
  };
}

describe('POST /api/ask rate shield', () => {
  beforeEach(() => {
    consumeAskRateLimit.mockReset();
    handleAsk.mockReset();
    vi.resetModules();
  });

  it('passes a request that is under the limit through to handleAsk', async () => {
    consumeAskRateLimit.mockResolvedValue({ ok: true });
    handleAsk.mockResolvedValue({
      answer: 'ok',
      citations: [],
      outcome: 'answered',
      diagnostics: null,
      visual_assets: [],
    });
    const result = await postAsk();
    expect(result.status).toBe(200);
    expect(result.body.outcome).toBe('answered');
    expect(handleAsk).toHaveBeenCalledTimes(1);
  });

  it('returns 429 + rate_limited + Retry-After when over the per-client limit', async () => {
    consumeAskRateLimit.mockResolvedValue({
      ok: false,
      retryAfterSec: 42,
      reason: 'client_minute',
    });
    const result = await postAsk();
    expect(result.status).toBe(429);
    expect(result.body).toEqual({
      error: PUBLIC_ASK_ERROR.rate_limited,
      error_class: 'rate_limited',
    });
    expect(result.retryAfter).toBe('42');
    expect(result.raw).not.toMatch(/203\.0\.113\.10|ENOTFOUND|ask_rate_buckets/i);
    expect(handleAsk).not.toHaveBeenCalled();
  });

  it('returns 429 when the global daily cap is hit', async () => {
    consumeAskRateLimit.mockResolvedValue({
      ok: false,
      retryAfterSec: 3600,
      reason: 'global_day',
    });
    const result = await postAsk();
    expect(result.status).toBe(429);
    expect(result.body.error_class).toBe('rate_limited');
    expect(result.retryAfter).toBe('3600');
    expect(handleAsk).not.toHaveBeenCalled();
  });

  it('still answers when the limiter store fails open', async () => {
    consumeAskRateLimit.mockResolvedValue({ ok: true, failedOpen: true });
    handleAsk.mockResolvedValue({
      answer: 'ok',
      citations: [],
      outcome: 'answered',
      diagnostics: null,
      visual_assets: [],
    });
    const result = await postAsk();
    expect(result.status).toBe(200);
    expect(handleAsk).toHaveBeenCalledTimes(1);
  });
});
