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

### Keep-with-justification (Guide 05 — authored 2026-07-16)

**Decision:** Keep embedding and cross-encoder as **candidates** (not frozen). Keep the cross-encoder **in the ranking pipeline**.

**Evidence (Guide 04 paired ask):** n=30, generator `gemma4:e2b`, CE `Xenova/ms-marco-MiniLM-L-6-v2` in `classification` mode, `rrf_only_ask_hits=26`, `ce_ask_hits=26`, `ce_vs_rrf_ask_delta_hits=0`, `degrade_rate=0.0`, `avg_ce_latency_ms≈94.7` — see `evals/last_run_summary.json`.

1. Paired-ask citation∩gold delta was **0** on n=30.  
2. Models remain **candidates**, not frozen.  
3. Cross-encoder **stays in the stack** for architecture completeness (hybrid → RRF → section dedup → CE N→K), demo of local rerank, latency measurement, and degrade-to-fusion reliability — not because it improved this metric.  
4. **Do not** claim CE improved citation hits on this run. Historical proxy `ce_vs_rrf_delta_hits=+1` / `n=5` remains **forbidden** as lift or freeze evidence.

Formal freeze still requires the human-only checklist above after stronger evidence.

### Formal freeze packaging (Guide 06)

**What “freeze” means (interview language):** Declaring embedding and/or CE model IDs **locked** for portfolio ranking claims — not merely “present in the ask path.”

**Guide 05 keep-with-justification ≠ freeze.** Keeping CE in the stack with an honesty note is gate 1 (keep-in-stack). Formal freeze is gate 2 and remains **human-only**.

**Current evidence is insufficient to freeze:** Guide 04 paired ask on n=30 recorded `ce_vs_rrf_ask_delta_hits=0` (hits 26/26). Flat delta does **not** earn a freeze claim without new paired-ask evidence **or** an explicit Tom override lock.

**Tom lock (2026-07-17):** Formal freeze is **parked** until new evidence or explicit override. Status tables above stay **candidate**.

**Before any human freeze:** complete the six-item **Freeze checklist (human-only)** in this file. Do **not** invent new metric gates here. Do **not** use historical proxy `ce_vs_rrf_delta_hits=+1` / `n=5` as freeze evidence.

**Related:** Public-flip packaging checklist (gate 3, separate) → [`docs/PUBLIC_FLIP_CHECKLIST.md`](../docs/PUBLIC_FLIP_CHECKLIST.md). Checklist ≠ flip.

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
