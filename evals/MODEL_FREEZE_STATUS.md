# Model freeze status (Guide 01)

| Lock | Candidate in use | Status |
|------|------------------|--------|
| Embedding model + dim | Ollama `nomic-embed-text` @ 768 | **Smoke verified** (Compose ingest → 17 chunks @ dim 768; live ask retrieve). Still **candidate** until human freezes for portfolio claims. |
| CE model + runtime | `Xenova/ms-marco-MiniLM-L-6-v2` via `transformers_js` (maps to architecture candidate `cross-encoder/ms-marco-MiniLM-L-6-v2`) | **Keep as MR2 candidate** — first paired baseline shows weak proxy lift (`ce_vs_rrf_delta_hits=+1` where RRF-only side is lexical-FTS proxy, not a true RRF-only ask). Degrade rate 0.0 on golden run; avg CE latency ~183ms. **Not frozen.** |

## Generator (not a freeze lock)

| Preference | Status |
|------------|--------|
| Primary `gemma4:e2b` | **Pass 9 smoke OK** (2026-07-13): live `POST /api/ask` with diagnostics `generator_model=gemma4:e2b`, outcome=answered, DB citations, CE not degraded. Code defaults + `.env.example` + repo `.env` already preferred gemma; hub/pass-9 synced leftover `web/.env.local` qwen → gemma (Next loads `.env.local`). |
| Pass 8c baseline | Live ask + golden eval ran on fallback **`qwen3.5:4b`** while gemma was mid-upgrade / absent at resume start. Keep as historical baseline; prefer gemma for operator default now that tag + smoke exist. |

## First honest baseline (2026-07-12 pass 8c)

Source: `evals/last_run_summary.json` (`mecharag eval --golden evals/ --ask-url http://localhost:3000/api/ask`)

| Metric | Value |
|--------|-------|
| n_cases | 5 |
| recall_at_k_proxy (lexical FTS) | 0.8 |
| citation_correctness_rate | 1.0 |
| ask_http_ok | 5/5 |
| rrf_only_retrieval_hits (proxy) | 4 |
| ce_or_ask_path_hits | 5 |
| ce_vs_rrf_delta_hits | +1 |
| degrade_rate | 0.0 |
| avg_ce_latency_ms | 183.4 |

No invented public-release pass/fail thresholds.

## Host note (pass 8c)

Ollama inference was broken until app restart: client/server skew left a stuck **0.18.2** serve after a partial **0.31.2** upgrade (`unknown runner engine`). Restart → `0.31.2` fixed embeds/generate.
