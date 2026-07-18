# Model freeze status (Guide 01 → Guide 09)

| Lock | Model in use | Status |
|------|--------------|--------|
| Embedding model + dim | Ollama `nomic-embed-text` @ 768 | **Frozen (Tom override — flat delta; no lift claim)** — Guide 09 Path B (pass 152). |
| CE model + runtime | `Xenova/ms-marco-MiniLM-L-6-v2` via `transformers_js` (`classification` mode on 2026-07-17 Guide 08 paired run) | **Frozen (Tom override — flat delta; no lift claim)** — Guide 09 Path B (pass 152). Paired ask delta remains **0** on n=44. |

## Freeze checklist (human-only)

Do **not** flip status to frozen unless **all** are true and a human authors the freeze:

1. Paired ask ablation metrics present under generator **`gemma4:e2b`** (`rrf_only_ask_hits`, `ce_ask_hits`, `ce_vs_rrf_ask_delta_hits`).
2. Shared hit predicate = cited `chunk_id` ∩ allowed evidence (not answer-substring alone).
3. CE model id + **CE runtime mode** (`classification` vs `cosine`) recorded.
4. Degrade rate recorded (and distinct from `ablation_rrf_only`).
5. Golden set ≥30 on S2000 fixture (Guide 04 path complete; current evidence n=44 after Guide 08 T1).
6. **Forbidden:** freeze on proxy `ce_vs_rrf_delta_hits=+1` / `n=5` / lexical proxy alone.

**Unlock paths:** (Lift) stronger citation∩gold asymmetry, **or** (Override) explicit Tom Path B lock despite flat delta — see Guide 09 below. If paired delta is flat/negative and no override: leave **candidate**; human may write keep-with-justification (MR2) — do not invent lift language.

### Keep-with-justification (Guide 05 — authored 2026-07-16; historical)

**Decision (historical):** Keep embedding and cross-encoder as **candidates** (not frozen). Keep the cross-encoder **in the ranking pipeline**.

**Status supersession (Guide 09):** Guide 09 Path B **supersedes status** (candidates → **frozen by Tom override**). Historical keep honesty below is retained — delta **0** still true; freeze is **override**, not earned lift.

**Evidence (Guide 04 paired ask):** n=30, generator `gemma4:e2b`, CE `Xenova/ms-marco-MiniLM-L-6-v2` in `classification` mode, `rrf_only_ask_hits=26`, `ce_ask_hits=26`, `ce_vs_rrf_ask_delta_hits=0`, `degrade_rate=0.0`, `avg_ce_latency_ms≈94.7`.

**Evidence refresh (Guide 07 Path A — 2026-07-17):** n=38 (+8 traps g31–g38), `rrf_only_ask_hits=34`, `ce_ask_hits=34`, `ce_vs_rrf_ask_delta_hits=0`, CE-helps=0 / CE-hurts=0.

**Evidence refresh (Guide 08 T1 — 2026-07-17):** n=44 (+3 synthetic confusable `###` + g39–g44 anti-paraphrase traps), same generator/CE/mode, `rrf_only_ask_hits=39`, `ce_ask_hits=39`, `ce_vs_rrf_ask_delta_hits=0`, **CE-helps=0**, **CE-hurts=0**, `degrade_rate=0.0`, `avg_ce_latency_ms≈129.8` — see `evals/last_run_summary.json`. Traps: 5/6 both-hit, g44 both-miss; still **no** citation∩gold asymmetry.

1. Paired-ask citation∩gold delta was **0** on n=30, n=38, and again **0** on n=44 after T1.  
2. *(Historical)* Models remained **candidates**, not frozen — until Guide 09 override.  
3. Cross-encoder **stays in the stack** for architecture completeness (hybrid → RRF → section dedup → CE N→K), demo of local rerank, latency measurement, and degrade-to-fusion reliability — not because it improved this metric.  
4. **Do not** claim CE improved citation hits on these runs. Historical proxy `ce_vs_rrf_delta_hits=+1` / `n=5` remains **forbidden** as lift or freeze evidence.

### Formal freeze packaging (Guide 06)

**What “freeze” means (interview language):** Declaring embedding and/or CE model IDs **locked** for portfolio ranking claims — not merely “present in the ask path.”

**Guide 05 keep-with-justification ≠ freeze.** Keeping CE in the stack with an honesty note is gate 1 (keep-in-stack). Formal freeze is gate 2 and is **human-only**.

**Evidence alone was insufficient to earn a freeze from lift:** Guide 04 (n=30), Guide 07 (n=38), and Guide 08 T1 (n=44) all recorded `ce_vs_rrf_ask_delta_hits=0` with CE-helps=0 / CE-hurts=0. Flat delta after T1 confusable sections does **not** earn a freeze claim from ablation.

**Tom lock (2026-07-17):** Formal freeze was **parked** until new evidence or explicit override. Guide 07/08 did **not** auto-freeze.

**Guide 09 (2026-07-18):** Explicit Tom Path **B** override **unparked** freeze — see section below. Public flip remains a **separate** gate.

**Before any human freeze:** complete the six-item **Freeze checklist (human-only)** in this file (process fields). Path B override does **not** invent new metric gates and does **not** use historical proxy `ce_vs_rrf_delta_hits=+1` / `n=5` as freeze evidence.

**Related:** Public-flip packaging checklist (gate 3, separate) → [`docs/PUBLIC_FLIP_CHECKLIST.md`](../docs/PUBLIC_FLIP_CHECKLIST.md). Checklist ≠ flip. Guide 09 freeze ≠ public flip / v1 Done / LICENSE.

### Formal freeze — Tom override (Guide 09)

**Decision (Tom Path B — pass 152, 2026-07-18):** Freeze embedding and cross-encoder model IDs for portfolio ranking claims via **explicit override**, despite flat paired-ask ablation.

**Evidence cited (Guide 08 current; `evals/last_run_summary.json`):**

| Field | Value |
|-------|-------|
| n_cases | 44 |
| generator | `gemma4:e2b` |
| CE model | `Xenova/ms-marco-MiniLM-L-6-v2` |
| CE runtime mode | `classification` |
| rrf_only_ask_hits | 39 |
| ce_ask_hits | 39 |
| ce_vs_rrf_ask_delta_hits | **0** |
| CE-helps / CE-hurts | **0 / 0** |
| degrade_rate | 0.0 |
| avg_ce_latency_ms | ≈129.8 |

**Required honesty (Guide 09):**

1. Paired-ask citation∩gold delta was **0** on n=30, n=38, and **n=44**.  
2. Models are **frozen by Tom override**, not because CE proved lift.  
3. Cross-encoder **stays in the stack**.  
4. **Do not** claim CE improved citation hits on these runs.  
5. Guide 09 freeze **≠** public flip / portfolio v1 Done / LICENSE.

**Unlock used:** Override unlock (flat delta + Tom Path B lock) — **not** lift unlock. **Forbidden:** “earned freeze from ablation”; proxy `+1` / `n=5` as proof.

## Generator (not a freeze lock)

| Preference | Status |
|------------|--------|
| Primary `gemma4:e2b` | Confirmed on paired Guide 02 run (`generator_models_seen`) — **not** a model freeze lock |
| Pass 8c baseline | **qwen3.5:4b** historical proxy / qwen-era only |

## Historical proxy baseline (2026-07-12 pass 8c) — NOT freeze evidence

| Metric | Value | Honesty |
|--------|-------|---------|
| n_cases | 5 | Too small; proxy era |
| rrf_only_retrieval_hits (lexical FTS proxy) | 4 | **Not** RRF-only ask |
| ce_or_ask_path_hits (answer-substring) | 5 | **Not** citation∩gold |
| ce_vs_rrf_delta_hits | +1 | **Proxy theater — do not freeze on this** |
| generator | qwen3.5:4b | Different era |

## Guide 08 paired ask ablation results (2026-07-17) — current evidence

Source: `evals/last_run_summary.json` after T1 synthetic confusable sections + g39–g44 + twin-process paired ask:

```bash
# CE-on :3000 (FORCE unset) + RRF-only :3001 (MECHANIC_FORCE_RRF_ONLY=1)
mecharag eval --golden evals/ \
  --ask-url http://127.0.0.1:3000/api/ask \
  --ask-url-rrf-only http://127.0.0.1:3001/api/ask
```

| Field | Value |
|-------|-------|
| Date / run | 2026-07-17 Guide 08 Implement |
| n_cases | 44 |
| paired_cases_scored | 44 (0 asymmetric failures) |
| generator | `gemma4:e2b` |
| CE model | `Xenova/ms-marco-MiniLM-L-6-v2` |
| CE runtime mode | `classification` |
| rrf_only_ask_hits | 39 |
| ce_ask_hits | 39 |
| ce_vs_rrf_ask_delta_hits | **0** |
| CE-helps (CE hit, RRF miss) | **0** |
| CE-hurts (RRF hit, CE miss) | **0** |
| both_hit / both_miss | 39 / 5 |
| T1 sections | +3 synthetic confusable `###` (1-3, 3-3, 4-3) |
| trap band (g39–g44) | 5 both-hit; g44 both-miss |
| degrade_rate | 0.0 |
| avg_ce_latency_ms | 129.8 |
| Evidence status | Flat — **no lift**; freeze later via Guide 09 **override** (not auto-freeze from this run) |

## Guide 07 paired ask ablation results (2026-07-17) — superseded n

Retained for history; **current** evidence is Guide 08 n=44 above.

| Field | Value |
|-------|-------|
| Date / run | 2026-07-17 Guide 07 Implement |
| n_cases | 38 |
| rrf_only_ask_hits / ce_ask_hits | 34 / 34 |
| ce_vs_rrf_ask_delta_hits | **0** |
| CE-helps / CE-hurts | 0 / 0 |
| Status at run | **candidate** — flat; superseded by Guide 08 evidence; freeze later Guide 09 override |

## Guide 04 paired ask ablation results (2026-07-14) — superseded n

Retained for history; **current** evidence is Guide 08 n=44 above.

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
| Status at run | **candidate** — flat delta; freeze later Guide 09 override |

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
