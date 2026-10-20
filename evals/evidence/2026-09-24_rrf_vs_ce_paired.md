# Measured RRF-only vs local RRF+CE (paired Ask)

**Date:** 2026-09-24  
**Git SHA:** `8eb5d59269e370f6c2ef50563afec3027e515241` (pre-release history; eval harness with `--ask-url-rrf-only` and `eval_rank_metrics.py`)  
**Golden:** `evals/golden_fixture_v1.json`  
**Arms:** PORT 3000 `MECHANIC_FORCE_RRF_ONLY=0` (CE on); PORT 3001 `MECHANIC_FORCE_RRF_ONLY=1` (RRF-only); both `MECHANIC_DIAGNOSTICS=1` `SECTION_DEDUP_ENABLED=1`  
**CE model:** Xenova/ms-marco-MiniLM-L-6-v2 (`@xenova/transformers`, classification runtime)  
**Evidence JSON:** `evals/evidence/2026-09-24_rrf_vs_ce_paired.json` (copy of `evals/last_run_summary.json`)  
**Production:** unchanged by this run.

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

The fixture is a small S2000 service-manual slice. Four golden cases (g10, g23, g24, g25) have no answer in the fixture by design, and the table above averages all 44. Over the 40 answerable cases gold is in the RRF shortlist for 40 of 40, MRR 0.9083 → 0.9208, Recall@1 0.825 → 0.850, Recall@3 1.000 both (+2 / −1 / 37 on MRR).

## Gate set before the run

Gate: more questions helped than hurt, **and** an MRR or Recall@1 gain, **and** `n ≥ 30`.

| Check | Result |
|-------|--------|
| n ≥ 30 | PASS (n=44) |
| helps > hurts | PASS (2 > 1) |
| positive MRR or R@1 lift | PASS (MRR +0.0113, R@1 +0.0227) |

### Result: gate met

Turning on hosted reranking is a separate product decision (see `evals/RERANKER_DECISION.md`).
