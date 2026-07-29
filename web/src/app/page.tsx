"use client";
import { useEffect, useState } from "react";

type Citation = {
  label: string;
  chunk_id: string;
  vehicle_id: string;
  doc_family: string;
  document_id: string;
  section_path: string | null;
  page_start: number | null;
  page_end: number | null;
};

type VisualAsset = {
  chunk_id: string;
  document_id: string;
  page_start: number;
  content_type: string;
  href: string;
};

type AskResponse = {
  answer?: string;
  citations?: Citation[];
  visual_assets?: VisualAsset[];
  outcome?: string;
  error?: string;
};

const DEFAULT_VEHICLE = "fixture:honda-s2000-demo";

function pickDefaultVehicle(ids: string[]): string {
  const fixture = ids.find((id) => id.startsWith("fixture:"));
  return fixture ?? ids[0] ?? DEFAULT_VEHICLE;
}

function formatPageRange(start: number | null, end: number | null): string {
  if (start == null) return "";
  if (end != null && end !== start) return `p. ${start}–${end}`;
  return `p. ${start}`;
}

export default function Home() {
  const [vehicleId, setVehicleId] = useState(DEFAULT_VEHICLE);
  const [vehicles, setVehicles] = useState<string[]>([DEFAULT_VEHICLE]);
  const [question, setQuestion] = useState("");
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
        const res = await fetch("/api/vehicles");
        const data = (await res.json()) as { vehicles?: string[]; error?: string };
        if (!res.ok) {
          throw new Error(data.error || `vehicles list failed (${res.status})`);
        }
        const ids = Array.isArray(data.vehicles) ? data.vehicles.filter(Boolean) : [];
        if (cancelled) return;
        if (ids.length === 0) {
          setVehicles([DEFAULT_VEHICLE]);
          setVehicleId(DEFAULT_VEHICLE);
          setListWarning("No vehicles in database — using default fixture id.");
          return;
        }
        setVehicles(ids);
        setVehicleId(pickDefaultVehicle(ids));
        setListWarning(null);
      } catch (err) {
        if (cancelled) return;
        setVehicles([DEFAULT_VEHICLE]);
        setVehicleId(DEFAULT_VEHICLE);
        setListWarning(
          err instanceof Error ? err.message : "Could not load vehicle list",
        );
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  async function onAsk(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setAnswer(null);
    setCitations([]);
    setVisualAssets([]);
    setOutcome(null);
    setLoading(true);
    try {
      const res = await fetch("/api/ask", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
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
      setError(err instanceof Error ? err.message : "Request failed");
    } finally {
      setLoading(false);
    }
  }

  const controlsDisabled = loading;

  return (
    <div className="min-h-screen px-6 py-8 max-w-3xl mx-auto text-ink">
      <header className="mb-6 pb-5 border-b border-border">
        <h1 className="text-2xl font-semibold tracking-tight text-ink">
          Mechanic RAG
        </h1>
        <p className="mt-2 text-sm text-ink-muted leading-relaxed">
          Fixture-backed ask demo —{" "}
          <span className="text-ink font-medium">M0 text default</span> ·
          multimodal opt-in via local env flags. Stranger clone path uses public
          fixtures only.
        </p>
        <p className="mt-1 text-xs text-ink-muted">
          Deliberate vertical slice; not portfolio-complete.
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
                {v}
              </option>
            ))}
          </select>
        </label>
        <label className="block text-sm font-medium text-ink">
          Question
          <input
            className="ui-control mt-1.5 w-full px-3 py-2 text-sm"
            placeholder="e.g. What is the oil drain plug torque?"
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
            {loading ? "Retrieving…" : "Ask"}
          </button>
          {loading && (
            <span className="text-sm text-ink-muted" role="status">
              Ranking evidence and generating answer…
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

      {outcome === "insufficient_evidence" && (
        <div className="outcome-panel outcome-insufficient" role="status">
          <span className="outcome-label">Insufficient evidence</span>
          <p className="text-sm whitespace-pre-wrap">
            {answer ?? "No sufficient indexed evidence for this question."}
          </p>
        </div>
      )}

      {outcome === "answered" && answer && (
        <section className="mb-6">
          <div className="outcome-panel outcome-answered">
            <span className="outcome-label text-accent">Answered</span>
            <div className="whitespace-pre-wrap text-sm leading-relaxed text-ink">
              {answer}
            </div>
          </div>
        </section>
      )}

      {citations.length > 0 && (
        <section>
          <h2 className="text-sm font-semibold uppercase tracking-wide text-ink-muted mb-3">
            Citations ({citations.length})
          </h2>
          <ul className="space-y-3">
            {citations.map((c) => {
              const pages = visualAssets.filter(
                (v) =>
                  v.document_id === c.document_id && v.chunk_id === c.chunk_id,
              );
              const pageLine = formatPageRange(c.page_start, c.page_end);
              return (
                <li
                  key={c.chunk_id}
                  className="border border-border rounded-[var(--radius-lg)] p-4 text-sm bg-surface"
                >
                  <div className="flex flex-wrap items-baseline gap-x-2 gap-y-1">
                    <span className="font-semibold text-accent">
                      [{c.label}]
                    </span>
                    <span className="font-medium text-ink">{c.document_id}</span>
                  </div>
                  <div className="mt-1 text-ink-muted">
                    <span className="font-medium text-ink">Section:</span>{" "}
                    {c.section_path ?? "—"}
                  </div>
                  {pageLine && (
                    <div className="mt-0.5 text-ink-muted">
                      <span className="font-medium text-ink">Page:</span>{" "}
                      {pageLine}
                    </div>
                  )}
                  <div className="text-xs text-ink-muted mt-2 font-mono">
                    {c.chunk_id}
                  </div>
                  {pages.length > 0 && (
                    <div className="mt-3 pt-3 border-t border-border">
                      <p className="text-xs font-semibold uppercase tracking-wide text-accent mb-2">
                        Page figure
                      </p>
                      <div className="flex flex-col gap-3">
                        {pages.map((v) => (
                          <figure key={v.href}>
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img
                              src={v.href}
                              alt={`Manual page ${v.page_start}`}
                              className="max-w-full border border-border rounded-[var(--radius-md)]"
                            />
                            <figcaption className="text-xs text-ink-muted mt-1">
                              Manual page {v.page_start}
                            </figcaption>
                          </figure>
                        ))}
                      </div>
                    </div>
                  )}
                </li>
              );
            })}
          </ul>
        </section>
      )}

      <footer className="mt-10 pt-4 border-t border-border text-xs text-ink-muted space-y-1">
        <p>
          M0 text path default · M2 image channel and M3 VLM are opt-in locally.
        </p>
        <p>
          Disclaimer: advisory only. Verify against your official service manual.
          Use at your own risk.
        </p>
      </footer>
    </div>
  );
}
