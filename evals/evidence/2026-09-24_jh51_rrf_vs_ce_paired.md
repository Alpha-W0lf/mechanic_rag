# JH-51 measured RRF-only vs local RRF+CE (paired Ask)

**Date:** 2026-09-24 (America/Chicago)  
**Git SHA:** `8eb5d59269e370f6c2ef50563afec3027e515241` (`8eb5d59`) — stayed on local main; did **not** merge `origin/main` (`d044c60`). Eval harness (`--ask-url-rrf-only`, `eval_rank_metrics.py`) already present.  
**Machine:** Toms-MB-Pro-M2-Pro (`75e939cd-aeeb-4f71-9e40-ae8dfbd16e8c`)  
**Golden:** `evals/golden_fixture_v1.json`  
**Arms:** PORT 3000 `MECHANIC_FORCE_RRF_ONLY=0` (CE on); PORT 3001 `MECHANIC_FORCE_RRF_ONLY=1` (RRF-only); both `MECHANIC_DIAGNOSTICS=1` `SECTION_DEDUP_ENABLED=1`  
**CE model:** Xenova/ms-marco-MiniLM-L-6-v2 (`@xenova/transformers`, classification runtime)  
**Evidence JSON:** `evals/evidence/2026-09-24_jh51_rrf_vs_ce_paired.json` (copy of `evals/last_run_summary.json`)  
**Production / hosted CE / shipping:** **not** changed; no PR; no deploy.

## Metrics table (n=44, paired_cases_scored=44, asymmetric_failures=0)

| Metric | RRF-only | RRF+CE | Δ (CE − RRF) |
|--------|----------|--------|--------------|
| gold_mrr | 0.8258 | 0.8371 | +0.0113 |
| Recall@1 | 0.7500 | 0.7727 | +0.0227 |
| Recall@3 | 0.9091 | 0.9091 | +0.0000 |
| ask citation∩gold hits (smoke) | 39 | 39 | +0 |

| Paired rank outcome | Count | Rate |
|---------------------|------:|-----:|
| helps (MRR↑) | 2 | 0.0455 |
| hurts (MRR↓) | 1 | 0.0227 |
| unchanged | 41 | 0.9318 |
| degradation rate (hurts/n) | 1 | 0.0227 |

| Other | Value |
|-------|------:|
| gold_in_rrf_top_k_rate | 0.9091 (40/44) |
| avg_ce_latency_ms | 822.66 |
| ce_latency_ms p50 | 799.5 |
| ce_latency_ms p95 | 982.9 |
| ask_http_ok | 44/44 |
| degrade_rate (rerank) | 0.0 |

**Help case ids:** g04-spark-plug-gap, g28-never-atf-in-mtf  
**Hurt case ids:** g44-trap-cold-install-gap-not-hot

## Hard-negative / headroom note

Fixture corpus is a tiny S2000 service-manual slice (~20 chunks in shortlist / ~13-section-class ceiling historically). `gold_in_rrf_top_k_rate=0.9091` — gold is already in the RRF shortlist for most cases, so CE has little room to help and the measured lift is small (+2 / −1 / 41 flat on MRR). This is **not** a hard-negative stress set; treat effect size as braided by fixture ceiling.

## Locked gate → Go/No-go

Gate: `helps > hurts` **AND** (positive MRR **or** R@1 lift) **AND** `n ≥ 30`; else No-go (leave hosted CE skipped).

| Check | Result |
|-------|--------|
| n ≥ 30 | PASS (n=44) |
| helps > hurts | PASS (2 > 1) |
| positive MRR or R@1 lift | PASS (MRR +0.0113, R@1 +0.0227) |

### Recommendation: **GO (gate met)**

Gate arithmetic is met, so this is a **GO** vs the locked JH-51 gate. Effect size is tiny and fixture-headroom-limited; do **not** auto-ship hosted CE or Production reranking from this alone — human freeze / product decision still required. No PR opened.

## Ops notes

- Docker Desktop was started for this run; `docker compose up -d` brought up `mechanic_rag_postgres` (already had 16 docs / 18267 chunks — no re-ingest).
- Local Ask servers on :3000/:3001 torn down after evidence write.
- `origin/main` was at `d044c60` (ahead); working tree stayed clean at `8eb5d59` for harness parity without merging.
