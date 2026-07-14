import { afterEach, describe, expect, it, vi } from 'vitest';
import {
  isForceRrfOnlyEnv,
  parseCeRuntimeMode,
  rankingDiagnosticFlags,
  validateAskRequest,
} from '@/server/ask';
import { FakeCrossEncoder } from '@/server/cross_encoder';

describe('ablation env + diagnostic flags', () => {
  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it('isForceRrfOnlyEnv reads MECHANIC_FORCE_RRF_ONLY=1 only', () => {
    expect(isForceRrfOnlyEnv({})).toBe(false);
    expect(isForceRrfOnlyEnv({ MECHANIC_FORCE_RRF_ONLY: '0' })).toBe(false);
    expect(isForceRrfOnlyEnv({ MECHANIC_FORCE_RRF_ONLY: '1' })).toBe(true);
  });

  it('ablation must not set rerank_degraded', () => {
    expect(
      rankingDiagnosticFlags({
        forceRrfOnly: true,
        ceFailedOrUnavailable: true,
      }),
    ).toEqual({ ablation_rrf_only: true, rerank_degraded: false });
  });

  it('natural CE failure sets rerank_degraded without ablation', () => {
    expect(
      rankingDiagnosticFlags({
        forceRrfOnly: false,
        ceFailedOrUnavailable: true,
      }),
    ).toEqual({ ablation_rrf_only: false, rerank_degraded: true });
    expect(
      rankingDiagnosticFlags({
        forceRrfOnly: false,
        ceFailedOrUnavailable: false,
      }),
    ).toEqual({ ablation_rrf_only: false, rerank_degraded: false });
  });

  it('parseCeRuntimeMode extracts classification vs cosine', () => {
    expect(parseCeRuntimeMode('transformers_js:classification')).toBe(
      'classification',
    );
    expect(parseCeRuntimeMode('transformers_js:cosine')).toBe('cosine');
    expect(parseCeRuntimeMode('fake')).toBe('fake');
    expect(parseCeRuntimeMode(undefined)).toBeUndefined();
  });
});

describe('ask contract stays thin (no skip_ce)', () => {
  it('does not accept skip_ce / ablation_mode as required fields', () => {
    const ok = validateAskRequest({
      vehicle_id: 'fixture:honda-s2000-demo',
      question: 'torque?',
      skip_ce: true,
      ablation_mode: 'rrf_only',
    });
    // additionalProperties are ignored by validateAskRequest (thin parse);
    // public schema remains vehicle_id + question (+ optional doc_family).
    expect(ok.ok).toBe(true);
    if (ok.ok) {
      expect(ok.value).toEqual({
        vehicle_id: 'fixture:honda-s2000-demo',
        question: 'torque?',
        doc_family: undefined,
      });
      expect('skip_ce' in ok.value).toBe(false);
    }
  });
});

describe('opts.ce still injects for tests when ablation env off', () => {
  it('FakeCrossEncoder remains usable as opts.ce inject', async () => {
    vi.stubEnv('MECHANIC_FORCE_RRF_ONLY', '0');
    const ce = new FakeCrossEncoder('throw');
    // Smoke: inject still constructs; throw mode is for degrade tests elsewhere.
    expect(ce.modelId).toBe('fake-ce');
    await expect(ce.scorePairs('q', [])).rejects.toThrow('fake CE failure');
  });
});
