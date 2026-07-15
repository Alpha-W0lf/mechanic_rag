# Model freeze status (Guide 01 → Guide 04 evidence)

| Lock | Candidate in use | Status |
|------|------------------|--------|
| Embedding model + dim | Ollama `nomic-embed-text` @ 768 | **Smoke verified**. Still **candidate** until human freezes for portfolio claims. |
| CE model + runtime | `Xenova/ms-marco-MiniLM-L-6-v2` via `transformers_js` (`classification` mode on 2026-07-14 paired run) | **Candidate** — paired ask delta **flat (0)** on n=30. **Not frozen.** Agent must not invent freeze. |

## Freeze checklist (human-only)

Do **not** flip status to frozen unless **all** are true and a human authors the freeze:

1. Paired ask ablation metrics present under generator **`gemma4:e2b`** (`rrf_only_ask_hits`, `ce_ask_hits`, `ce_vs_rrf_ask_delta_hits`).
2. Shared hit predicate = cited `chunk_id` ∩ allowed evidence (not answer-substring alone).
3. CE model id + **CE runtime mode** (`classification` vs `cosine`) recorded.
4. Degrade rate recorded (and distinct from `ablation_rrf_only`).
5. Golden set ≥30 on S2000 fixture (Guide 04 path complete).
6. **Forbidden:** freeze on proxy `ce_vs_rrf_delta_hits=+1` / `n=5` / lexical proxy alone.

If paired delta is flat/negative: leave **candidate**; human may write keep-with-justification (MR2) — do not invent lift language.

### Keep-with-justification stub (for human edit — not authored as lift)

Paired ask ablation (2026-07-14, gemma4:e2b, CE classification, n=30) shows `ce_vs_rrf_ask_delta_hits=0`. CE did not improve citation∩gold hits vs forced RRF-only on this fixture set. Human may still keep MiniLM as MR2 candidate for latency/diversity reasons with written justification — do not claim lift from this run or from historical proxy +1.

## Generator (not a freeze lock)

| Preference | Status |
|------------|--------|
| Primary `gemma4:e2b` | Confirmed on paired Guide 02 run (`generator_models_seen`) |
| Pass 8c baseline | **qwen3.5:4b** historical proxy / qwen-era only |

## Historical proxy baseline (2026-07-12 pass 8c) — NOT freeze evidence

| Metric | Value | Honesty |
|--------|-------|---------|
| n_cases | 5 | Too small; proxy era |
| rrf_only_retrieval_hits (lexical FTS proxy) | 4 | **Not** RRF-only ask |
| ce_or_ask_path_hits (answer-substring) | 5 | **Not** citation∩gold |
| ce_vs_rrf_delta_hits | +1 | **Proxy theater — do not freeze on this** |
| generator | qwen3.5:4b | Different era |

## Guide 04 paired ask ablation results (2026-07-14)

Source: `evals/last_run_summary.json` after:

```bash
# CE-on :3000 (FORCE unset) + RRF-only :3001 (MECHANIC_FORCE_RRF_ONLY=1)
mecharag eval --golden evals/ \
  --ask-url http://127.0.0.1:3000/api/ask \
  --ask-url-rrf-only http://127.0.0.1:3001/api/ask
```

| Field | Value |
|-------|-------|
| Date / run | 2026-07-14 Guide 04 Implement |
| n_cases | 30 |
| paired_cases_scored | 30 (0 asymmetric failures) |
| generator | `gemma4:e2b` |
| CE model | `Xenova/ms-marco-MiniLM-L-6-v2` |
| CE runtime mode | `classification` |
| rrf_only_ask_hits | 26 |
| ce_ask_hits | 26 |
| ce_vs_rrf_ask_delta_hits | **0** |
| degrade_rate | 0.0 |
| avg_ce_latency_ms | 94.7 |
| lexical_proxy_retrieval_hits | 8 (segregated; not lift) |
| Status | **candidate** — flat delta; human freeze only |

## Guide 02 paired ask ablation results (2026-07-13) — superseded n

Source: prior `evals/last_run_summary.json` (n=12). Retained for history only; **do not** cite n=12 as current eval maturity.

| Field | Value |
|-------|-------|
| Date / run | 2026-07-13 Guide 02 Implement pass 22 |
| n_cases | 12 |
| rrf_only_ask_hits | 11 |
| ce_ask_hits | 11 |
| ce_vs_rrf_ask_delta_hits | **0** |

No invented public-release pass/fail thresholds.
