# Reranker decision

**Decision:** the hosted demo ranks with hybrid search → RRF → section dedup. The cross-encoder reranker (`Xenova/ms-marco-MiniLM-L-6-v2`) runs in the local Compose stack only, after section dedup, and falls back to RRF order if it fails.

**Why:** on the 40 answerable fixture questions (2026-09-24), the reranker added about 1 point of MRR (0.908 → 0.921) and 2.5 points of Recall@1 (0.825 → 0.850). Recall@3 was 1.000 in both arms and citation hits stayed at 39 of 40. The fixture is small and fusion alone put the gold chunk in its shortlist for all 40, so fusion does most of the work there. The reranker adds latency to every question (822.66 ms on average in this run, about 0.8 s), and its runtime doesn't fit Vercel Hobby's serverless functions. So the hosted path skips it (`ce_skip_reason=hosted_ce_disabled`) and the local stack keeps it.

**Which path changes:** hosted demo, none (it already ran without the reranker). Local Compose, reranker on by default; set `MECHANIC_FORCE_RRF_ONLY=1` to compare.

Current results table: [README eval results](../README.md#eval-results).

## Models in the evals

| Role | Local stack | Hosted demo |
|------|-------------|-------------|
| Embeddings | Ollama `nomic-embed-text` @ 768 (pinned since 2026-07-18 so runs stay comparable) | `gemini-embedding-001` @ 768 (same `vector(768)` column) |
| Reranker | `Xenova/ms-marco-MiniLM-L-6-v2` via `transformers_js`, `classification` mode | not used |
| Generator | Ollama `gemma4:e2b` | `gemma-4-26b-a4b-it` by default (`web/src/server/providers.ts`) |

## Evidence

**2026-09-24 paired run** (`evals/evidence/2026-09-24_rrf_vs_ce_paired.json` / `.md`): 40 answerable questions (plus 4 with no answer in the fixture by design), both arms on the same questions, same generator. Over the 40 answerable ones, MRR 0.9083 → 0.9208, Recall@1 0.825 → 0.850, Recall@3 1.000 both (the evidence file's headline figures average all 44). The gate set before the run (more questions helped than hurt, and an MRR or Recall@1 gain, on n ≥ 30) was met: 2 helped, 1 hurt.

*2026-10-19 notes:* the label fields `model_status` and `historical_proxy_note` in the recorded 2026-09-24 JSON (and `evals/last_run_summary.json`) were updated to current wording; no metric changed. The recorded `mrr_lexical_proxy` (0.1818) predates the harness fix that computes it from gold ranks; it is a copy of the lexical recall. The fixture's three look-alike section notes were reworded the same day without changing any spec value; the 2026-09-24 run used the earlier text (sha256 `49423e133eaf420350fded8756138e7b36cdd8954fa34039262772f1052a73d9`).

**Earlier rounds (July 2026)** grew the golden set and measured citation hits (cited `chunk_id` ∩ gold evidence) in both arms:

| Date | n | Fusion | Fusion + reranker | Added in this round |
|------|---|---|---|---|
| 2026-07-13 | 12 | 11 | 11 | First cases |
| 2026-07-14 | 30 | 26 | 26 | Core set (positives, hard misses, negative polarity, multi-section) |
| 2026-07-17 | 38 | 34 | 34 | 8 trap cases |
| 2026-07-17 | 44 | 39 | 39 | 3 look-alike sections + 6 anti-paraphrase traps |

Each round used the same generator (`gemma4:e2b`), the same reranker in `classification` mode, and the same hit definition.
