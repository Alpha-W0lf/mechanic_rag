"use client";
import { useState } from "react";

export default function Home() {
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<Record<string,unknown>[]>([]);
  const [error, setError] = useState<string | null>(null);

  async function onAsk(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    setResults([]);
    try {
      const res = await fetch("/api/ask", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ query }),
      });
      if (!res.ok) throw new Error(`${res.status}`);
      const data = await res.json();
      setResults(data.results || []);
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Request failed";
      setError(msg);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen p-6 max-w-3xl mx-auto">
      <h1 className="text-2xl font-semibold mb-4">Mechanic RAG (S2000)</h1>
      <form onSubmit={onAsk} className="flex gap-2 mb-4">
        <input
          className="flex-1 border rounded px-3 py-2"
          placeholder="Ask a question (stubbed retrieval)..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
        <button
          className="border rounded px-4 py-2 bg-black text-white disabled:opacity-50"
          disabled={loading || !query.trim()}
          type="submit"
        >
          {loading ? "Asking..." : "Ask"}
        </button>
      </form>
      {error && <div className="text-red-600 mb-2">{error}</div>}
      <div className="space-y-3">
        {results.map((r0, idx) => {
          const r = r0 as { documentName?: string; sectionPath?: string; pageStart?: number; pageEnd?: number; modality?: string; score?: number; content?: unknown };
          const scoreText = typeof r.score === "number" ? r.score.toFixed(3) : "";
          const contentText = String(r.content ?? "");
          return (
          <div key={idx} className="border rounded p-3">
            <div className="text-sm text-gray-600 mb-1">
              {r.documentName} {r.sectionPath ? `• ${r.sectionPath}` : ""}
              {r.pageStart ? ` • p.${r.pageStart}${r.pageEnd && r.pageEnd !== r.pageStart ? `–${r.pageEnd}` : ""}` : ""}
              {" • "}{r.modality} score {scoreText}
            </div>
            <div className="whitespace-pre-wrap text-sm">{contentText}</div>
          </div>
          );
        })}
      </div>
      <p className="text-xs text-gray-500 mt-6">Disclaimer: advisory only. Verify against your official service manual. Use at your own risk.</p>
    </div>
  );
}
