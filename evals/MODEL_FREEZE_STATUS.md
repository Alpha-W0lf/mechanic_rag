# Model freeze status

| Lock | Model in use | Status |
|------|--------------|--------|
| Embedding model + dimension | Ollama `nomic-embed-text` @ 768 | **Frozen by deliberate decision** — flat measured delta, no lift claim (2026-07-18). |
| Cross-encoder model + runtime | `Xenova/ms-marco-MiniLM-L-6-v2` via `transformers_js`, `classification` mode | **Frozen by deliberate decision** — flat measured delta, no lift claim (2026-07-18). Paired-ask delta stays **0** across every eval round through n=44. |

## What it took to freeze this (the checklist that was actually satisfied)

A freeze here means declaring the embedding and/or cross-encoder model IDs locked for portfolio ranking claims — not merely "present in the ask path." Before that claim was made, all of the following had to be true, and a human had to make the call explicitly:

1. Paired ask ablation metrics present, under the same generator (`gemma4:e2b`): `rrf_only_ask_hits`, `ce_ask_hits`, `ce_vs_rrf_ask_delta_hits`.
2. A precisely shared hit predicate — cited `chunk_id` intersected with the allowed evidence set, not a looser answer-substring match.
3. The cross-encoder's model ID and runtime mode (`classification` vs `cosine`) recorded exactly.
4. The degrade rate recorded, and kept distinct from an RRF-only ablation run.
5. A golden eval set of at least 30 cases on the S2000 fixture corpus (current evidence: n=44).
6. **Explicitly forbidden as freeze evidence:** an early proxy result (`ce_vs_rrf_delta_hits=+1` on n=5) — far too small a sample to freeze a model choice on, called out and rejected on its own terms below.

**The honest bottom line, stated plainly:** across four progressively larger evaluation rounds, the paired-ask delta between RRF-only and RRF+cross-encoder ranking was **exactly zero, every time.** The cross-encoder was frozen into the stack anyway — deliberately, not because it earned the freeze through measured improvement. That distinction is the whole point of this document.

## Why the cross-encoder stays in the pipeline despite a flat delta

The cross-encoder remains in the stack for architecture completeness (the intended pipeline is hybrid → RRF → section dedup → cross-encoder), as a real demonstration of local reranking, for latency measurement, and to exercise the degrade-to-RRF-only reliability path — not because it measurably improved citation accuracy on these evals. That's stated directly rather than implied otherwise.

## Evaluation history (paired ask ablation, RRF-only vs. RRF + cross-encoder)

Each round used the same generator (`gemma4:e2b`), the same cross-encoder (`Xenova/ms-marco-MiniLM-L-6-v2`, `classification` mode), and the same hit definition (cited `chunk_id` ∩ gold evidence) unless noted. Retained here for history — the current, authoritative evidence is the n=44 round.

| Date | n | RRF-only hits | RRF+CE hits | Delta | CE-helps / CE-hurts | Degrade rate | Avg. CE latency | Note |
|------|---|---|---|---|---|---|---|---|
| 2026-07-13 | 12 | 11 | 11 | **0** | — | — | — | Earliest round; too small to be current eval maturity — not cited as such |
| 2026-07-14 | 30 | 26 | 26 | **0** | — | 0.0 | ≈94.7ms | A parallel lexical-proxy metric (8 hits) was tracked separately and is not a lift measure |
| 2026-07-17 | 38 | 34 | 34 | **0** | 0 / 0 | — | — | Added 8 harder "trap" cases designed to be confusable |
| 2026-07-17 | 44 | 39 | 39 | **0** | **0 / 0** | 0.0 | ≈129.8ms | Added 3 synthetic confusable sections + 6 more trap cases; 39/44 both-hit, 5 both-miss; see `evals/last_run_summary.json` |

**Not freeze evidence, and explicitly rejected as such:** an even earlier proxy run (2026-07-12, n=5) showed `ce_vs_rrf_delta_hits=+1` using a looser answer-substring hit definition on a different generator era (`qwen3.5:4b`) — a sample far too small, and a hit definition too loose, to support any real conclusion. It is called out here specifically so it's never mistaken for supporting evidence.

## The freeze decision itself (2026-07-18)

Given a persistently flat delta across four rounds of increasingly rigorous evaluation, the embedding and cross-encoder model choices were frozen by explicit, deliberate decision — not because the cross-encoder proved a measurable lift. Required honesty, stated directly:

1. The paired-ask citation∩gold delta was 0 on n=30, n=38, and n=44.
2. The models are frozen by deliberate decision, not because the cross-encoder proved lift.
3. The cross-encoder stays in the stack regardless (see above for why).
4. This freeze does not claim the cross-encoder improved citation hits on these runs.
5. This freeze is not an earned cross-encoder lift claim. Separately: the project's license (PolyForm Noncommercial) is not an OSI open-source license, and the fixtures-only public packaging is not the same claim as a completed second-vehicle or dual-product build — none of these should be read into each other.

**Generator note (not a freeze lock):** `gemma4:e2b` is the confirmed primary generator; `qwen3.5:4b` is kept as a historical/fallback baseline from an earlier evaluation era. Neither is part of the frozen-model claim above — only the embedding and cross-encoder models are.

## 2026-08-25 — serving-path embedding provider note

The public fixture corpus is now embedded and queried with `gemini-embedding-001` @ 768 for the hosted serverless deployment (dimension-compatible with the frozen `vector(768)` column). This changes the public serving path only — it does not reopen the freeze above, does not alter the ranking architecture (hybrid → RRF → dedup → cross-encoder), and makes no cross-encoder-lift claim. The local/BYO path continues to default to Ollama `nomic-embed-text` @ 768. Hosted generation uses `gemini-flash`; generation was never part of the freeze scope.

## A follow-up local evaluation (2026-09-24) — measured a small real lift, not shipped

A later, separate local evaluation compared RRF-only against local RRF + cross-encoder ranking using richer retrieval metrics (MRR, Recall@1, Recall@3) rather than the binary ask-hit measure used above:

- Evidence: `evals/evidence/2026-09-24_rrf_vs_ce_paired.json` / `.md`
- n=44; gold MRR 0.8258 → 0.8371; Recall@1 0.75 → 0.7727; Recall@3 flat at 0.9091
- Helps / hurts / unchanged (by MRR): 2 / 1 / 41; degradation rate 0.0227; gold-in-RRF-top-K rate 0.9091
- Cross-encoder latency: p50/p95 ≈ 800/983ms (avg 822.66ms), same model as above
- Against a pre-registered gate (helps > hurts, and a measured MRR or Recall@1 lift, on n ≥ 30): this **passes** — a small but real lift, though likely a fixture-ceiling effect rather than a result from genuinely hard negative examples
- **This did not ship.** No Production change, hosted cross-encoder not enabled, no release built on it.
