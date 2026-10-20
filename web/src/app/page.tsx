'use client';
import React, { useEffect, useState } from 'react';
import {
  ASK_IN_FLIGHT_STATUS,
  ASK_QUESTION_PLACEHOLDER,
  CORPUS_COVERS_SUMMARY,
  DEGRADED_ASK_BANNER,
  DEGRADED_OUTCOME_LABEL,
  HEADER_TAGLINE,
  RETRY_SUMMARY_LABEL,
  stripDegradedBanner,
} from '@/lib/ask_copy';
import { vehicleLabel, visibleVehicles } from '@/lib/answer_markdown';
import {
  AnswerBody,
  CitationList,
  type Citation,
  type VisualAsset,
} from './answer_view';

type AskResponse = {
  answer?: string;
  citations?: Citation[];
  visual_assets?: VisualAsset[];
  outcome?: string;
  error?: string;
  error_class?: string;
};

const DEFAULT_VEHICLE = 'fixture:honda-s2000-demo';

function pickDefaultVehicle(ids: string[]): string {
  const oem = ids.find((id) => id === 'cat:2003-honda-s2000');
  if (oem) return oem;
  const fixture = ids.find((id) => id.startsWith('fixture:'));
  return fixture ?? ids[0] ?? DEFAULT_VEHICLE;
}

export default function Home() {
  const [vehicleId, setVehicleId] = useState(DEFAULT_VEHICLE);
  const [vehicles, setVehicles] = useState<string[]>([DEFAULT_VEHICLE]);
  const [question, setQuestion] = useState('');
  const [loading, setLoading] = useState(false);
  const [answer, setAnswer] = useState<string | null>(null);
  const [citations, setCitations] = useState<Citation[]>([]);
  const [visualAssets, setVisualAssets] = useState<VisualAsset[]>([]);
  const [outcome, setOutcome] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [listWarning, setListWarning] = useState<string | null>(null);

  useEffect(() => {
    // Thin UI: load askable vehicle ids from API (fixture: + cat:). No retrieval in the browser.
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch('/api/vehicles');
        const data = (await res.json()) as {
          vehicles?: string[];
          error?: string;
        };
        if (!res.ok) {
          throw new Error(data.error || `vehicles list failed (${res.status})`);
        }
        const ids = Array.isArray(data.vehicles)
          ? data.vehicles.filter(Boolean)
          : [];
        if (cancelled) return;
        if (ids.length === 0) {
          setVehicles([DEFAULT_VEHICLE]);
          setVehicleId(DEFAULT_VEHICLE);
          setListWarning('No vehicles in database — using default fixture id.');
          return;
        }
        const shown = visibleVehicles(ids);
        setVehicles(shown);
        setVehicleId(pickDefaultVehicle(shown));
        setListWarning(null);
      } catch (err) {
        if (cancelled) return;
        setVehicles([DEFAULT_VEHICLE]);
        setVehicleId(DEFAULT_VEHICLE);
        setListWarning(
          err instanceof Error ? err.message : 'Could not load vehicle list',
        );
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  async function submitAsk() {
    if (!question.trim() || loading) return;
    setError(null);
    setAnswer(null);
    setCitations([]);
    setVisualAssets([]);
    setOutcome(null);
    setLoading(true);
    try {
      const res = await fetch('/api/ask', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ vehicle_id: vehicleId, question }),
      });
      const data = (await res.json()) as AskResponse;
      if (!res.ok) {
        setError(data.error || `Request failed (${res.status})`);
        return;
      }
      setAnswer(data.answer ?? null);
      setCitations(data.citations ?? []);
      setVisualAssets(data.visual_assets ?? []);
      setOutcome(data.outcome ?? null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Request failed');
    } finally {
      setLoading(false);
    }
  }

  async function onAsk(e: React.FormEvent) {
    e.preventDefault();
    await submitAsk();
  }

  const controlsDisabled = loading;

  return (
    <div className="min-h-screen px-6 py-8 max-w-3xl mx-auto text-ink">
      <header className="mb-6 pb-5 border-b border-border">
        <h1 className="text-2xl font-semibold tracking-tight text-ink">
          Mechanic RAG
        </h1>
        <p className="mt-2 text-sm text-ink-muted leading-relaxed">
          {HEADER_TAGLINE}
        </p>
      </header>

      {listWarning && (
        <div
          className="outcome-panel outcome-insufficient text-sm"
          role="status"
        >
          <span className="outcome-label">Vehicle list warning</span>
          {listWarning}
        </div>
      )}

      <form onSubmit={onAsk} className="space-y-4 mb-6" aria-busy={loading}>
        <label className="block text-sm font-medium text-ink">
          Vehicle
          <select
            className="ui-control mt-1.5 w-full px-3 py-2 text-sm"
            value={vehicleId}
            onChange={(e) => setVehicleId(e.target.value)}
            disabled={controlsDisabled}
          >
            {vehicles.map((v) => (
              <option key={v} value={v}>
                {vehicleLabel(v)}
              </option>
            ))}
          </select>
        </label>
        <label className="block text-sm font-medium text-ink">
          Question
          <input
            className="ui-control mt-1.5 w-full px-3 py-2 text-sm"
            placeholder={ASK_QUESTION_PLACEHOLDER}
            value={question}
            onChange={(e) => setQuestion(e.target.value)}
            disabled={controlsDisabled}
          />
        </label>
        <div className="flex items-center gap-3">
          <button
            className="ui-btn-primary px-4 py-2 text-sm font-medium"
            disabled={controlsDisabled || !question.trim()}
            type="submit"
          >
            {loading ? 'Retrieving…' : 'Ask'}
          </button>
          {loading && (
            <span className="text-sm text-ink-muted" role="status">
              {ASK_IN_FLIGHT_STATUS}
            </span>
          )}
        </div>
      </form>

      {error && (
        <div className="outcome-panel outcome-error" role="alert">
          <span className="outcome-label">Request error</span>
          <p className="text-sm">{error}</p>
        </div>
      )}

      {outcome === 'insufficient_evidence' && (
        <div className="outcome-panel outcome-insufficient" role="status">
          <span className="outcome-label">Insufficient evidence</span>
          {answer ? (
            <AnswerBody text={answer} citations={citations} />
          ) : (
            <p className="text-sm">
              No sufficient indexed evidence for this question.
            </p>
          )}
          <p className="mt-3 pt-3 border-t border-border text-xs text-ink-muted">
            {CORPUS_COVERS_SUMMARY}
          </p>
        </div>
      )}

      {outcome === 'answered' && answer && (
        <section className="mb-6">
          <div className="outcome-panel outcome-answered">
            <span className="outcome-label text-accent">Answered</span>
            <AnswerBody text={answer} citations={citations} />
          </div>
        </section>
      )}

      {outcome === 'degraded' && answer && (
        <section className="mb-6">
          <div className="outcome-panel outcome-degraded" role="status">
            <span className="outcome-label">{DEGRADED_OUTCOME_LABEL}</span>
            <p className="text-sm mb-3">{DEGRADED_ASK_BANNER}</p>
            <AnswerBody
              text={stripDegradedBanner(answer)}
              citations={citations}
            />
            <div className="mt-3">
              <button
                type="button"
                className="ui-btn-secondary px-3 py-1.5 text-sm font-medium"
                onClick={() => void submitAsk()}
                disabled={controlsDisabled || !question.trim()}
              >
                {RETRY_SUMMARY_LABEL}
              </button>
            </div>
          </div>
        </section>
      )}

      {citations.length > 0 && (
        <CitationList citations={citations} visualAssets={visualAssets} />
      )}

      <footer className="mt-10 pt-4 border-t border-border text-xs text-ink-muted space-y-1">
        <p>
          Disclaimer: advisory only. Verify against your official service
          manual. Use at your own risk.
        </p>
      </footer>
    </div>
  );
}
