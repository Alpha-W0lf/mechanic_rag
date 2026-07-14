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

type AskResponse = {
  answer?: string;
  citations?: Citation[];
  outcome?: string;
  error?: string;
};

const DEFAULT_VEHICLE = "fixture:honda-s2000-demo";

export default function Home() {
  const [vehicleId, setVehicleId] = useState(DEFAULT_VEHICLE);
  const [vehicles, setVehicles] = useState<string[]>([DEFAULT_VEHICLE]);
  const [question, setQuestion] = useState("");
  const [loading, setLoading] = useState(false);
  const [answer, setAnswer] = useState<string | null>(null);
  const [citations, setCitations] = useState<Citation[]>([]);
  const [outcome, setOutcome] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Thin UI: fixture ids only; no retrieval logic in the browser.
    setVehicles([DEFAULT_VEHICLE]);
  }, []);

  async function onAsk(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setAnswer(null);
    setCitations([]);
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
      setOutcome(data.outcome ?? null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Request failed");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen p-6 max-w-3xl mx-auto">
      <h1 className="text-2xl font-semibold mb-1">Mechanic RAG</h1>
      <p className="text-sm text-gray-600 mb-4">
        Vertical slice — fixtures only. Not portfolio-complete.
      </p>
      <form onSubmit={onAsk} className="space-y-3 mb-6">
        <label className="block text-sm">
          Vehicle
          <select
            className="mt-1 w-full border rounded px-3 py-2"
            value={vehicleId}
            onChange={(e) => setVehicleId(e.target.value)}
          >
            {vehicles.map((v) => (
              <option key={v} value={v}>
                {v}
              </option>
            ))}
          </select>
        </label>
        <label className="block text-sm">
          Question
          <input
            className="mt-1 w-full border rounded px-3 py-2"
            placeholder="e.g. What is the oil drain plug torque?"
            value={question}
            onChange={(e) => setQuestion(e.target.value)}
          />
        </label>
        <button
          className="border rounded px-4 py-2 bg-black text-white disabled:opacity-50"
          disabled={loading || !question.trim()}
          type="submit"
        >
          {loading ? "Asking..." : "Ask"}
        </button>
      </form>

      {error && (
        <div className="text-red-700 mb-4 border border-red-200 rounded p-3">
          Dependency or request error: {error}
        </div>
      )}

      {outcome === "insufficient_evidence" && (
        <div className="text-amber-800 mb-4 border border-amber-200 rounded p-3">
          No sufficient indexed evidence for this question.
        </div>
      )}

      {answer && (
        <div className="mb-4">
          <h2 className="font-medium mb-2">Answer</h2>
          <div className="whitespace-pre-wrap text-sm border rounded p-3">
            {answer}
          </div>
        </div>
      )}

      {citations.length > 0 && (
        <div>
          <h2 className="font-medium mb-2">Citations</h2>
          <ul className="space-y-2">
            {citations.map((c) => (
              <li key={c.chunk_id} className="border rounded p-3 text-sm">
                <div className="font-medium">[{c.label}] {c.document_id}</div>
                <div className="text-gray-600">
                  {c.section_path ?? "—"}
                  {c.page_start != null
                    ? ` · p.${c.page_start}${c.page_end && c.page_end !== c.page_start ? `–${c.page_end}` : ""}`
                    : ""}
                </div>
                <div className="text-xs text-gray-500 mt-1">{c.chunk_id}</div>
              </li>
            ))}
          </ul>
        </div>
      )}

      <p className="text-xs text-gray-500 mt-8">
        Disclaimer: advisory only. Verify against your official service manual.
        Use at your own risk.
      </p>
    </div>
  );
}
