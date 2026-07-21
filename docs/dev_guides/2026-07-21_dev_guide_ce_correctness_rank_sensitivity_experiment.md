# Dev Guide — Bounded CE correctness + rank-aware sensitivity experiment

**Date:** 2026-07-21  
**Repo:** `mechanic_rag`  
**Work item:** Bounded cross-encoder (CE) correctness probe + rank-aware sensitivity metrics  
**Stage that authored this:** Write-dev-guide (pass 164n spoke)  
**Status:** **Implement Met** (2026-07-21 pass 164n) — see `docs/2026-07-21_implement_ce_correctness_rank_sensitivity_experiment_pass164n_note.md`  
**Handoff (Write):** `second_brain/docs/2026-07-21_spoke_mechanic_ce_experiment_write_dev_guide_pass164n_handoff.md`  
**Handoff (Implement):** `second_brain/docs/2026-07-21_spoke_mechanic_ce_implement_pass164n_handoff.md`  
**Critical review SSOT:** `second_brain/docs/2026-07-21_reranking_robustness_critical_review_pass164n.md`  
**Freeze SSOT:** `mechanic_rag/evals/MODEL_FREEZE_STATUS.md`  
**Architecture SSOT:** `mechanic_rag/docs/ARCHITECTURE.md` (§7 ranking, §10 eval)

**Not Guide 16.** This is a thin experiment guide only. Do not invent product-plane expansion.

---

## Objective

Prove whether the live Transformers.js CE adapter is scoring pairs the way the model card requires, and whether the flat citation∩gold ablation (`ce_vs_rrf_ask_delta_hits=0` on n=44) is an **eval ceiling / insensitive metric** problem versus a broken ranker.

**Success signal (this guide’s Definition of Done):**

1. Classification-mode CE uses **`text_pair` tokenization + raw logits** (not string+`[SEP]` + pipeline `score`).
2. A fixed shortlist shows **non-degenerate score variance** (logged min / max / mean / variance; assert not all-ones).
3. Same n=44 fixtures gain **rank-aware** metrics: gold **MRR**, **Recall@1**, **Recall@3** on RRF shortlist vs CE-ranked list — **without** removing citation∩gold as product smoke.
4. Summary counts **how often gold is already inside RRF top-K before CE** (ceiling indicator).
5. Freeze / honesty language unchanged: **no lift claim** unless rank metrics show clear top-rank improvement; override freeze stays override.

**Primary optimization target (Tom lock 2026-07-21):** **top-rank relevance** (MRR / Recall@1/@3).  
**Citation∩gold:** remains **product smoke** only — not the keep/kill proof for CE.

---

## Learning notes (interview-portable)

1. **Cross-encoder** — Jointly encodes `(query, passage)` and emits a relevance score; not the same as embedding both sides and taking cosine (bi-encoder).
2. **Ceiling effect** — When the baseline already places gold inside the final citation set, a binary hit metric cannot move even if order improves.
3. **Proxy vs task metric** — Citation set intersection is a product smoke check; Mean Reciprocal Rank (MRR) / Recall@k measure ranking quality.
4. **Fail-open degrade** — Serve fused ranks when an optional ranker fails; never confuse that with an intentional RRF-only ablation (`MECHANIC_FORCE_RRF_ONLY`).

---

## References (paths only)

- `second_brain/docs/2026-07-21_reranking_robustness_critical_review_pass164n.md`
- `second_brain/docs/2026-07-21_spoke_mechanic_ce_experiment_write_dev_guide_pass164n_handoff.md`
- `mechanic_rag/web/src/server/cross_encoder.ts`
- `mechanic_rag/web/src/server/ask.ts`
- `mechanic_rag/web/src/lib/retrieval/__tests__/ranking.test.ts`
- `mechanic_rag/web/src/lib/retrieval/types.ts`
- `mechanic_rag/mecharag/eval_cmd.py`
- `mechanic_rag/evals/golden_fixture_v1.json`
- `mechanic_rag/evals/last_run_summary.json`
- `mechanic_rag/evals/MODEL_FREEZE_STATUS.md`
- `mechanic_rag/docs/ARCHITECTURE.md`
- Hugging Face model card: `Xenova/ms-marco-MiniLM-L-6-v2` (`AutoTokenizer` + `text_pair` + raw logits)

---

## Architecture constraints (binding)

1. **Pipeline order unchanged:** vector + lexical → RRF → section dedup → CE N→K → citations (`ARCHITECTURE.md` §7).
2. **Models unchanged:** `Xenova/ms-marco-MiniLM-L-6-v2` via `@xenova/transformers`; embedding `nomic-embed-text` @ 768. No model zoo.
3. **Fail-open degrade unchanged:** timeout / empty / throw → RRF order; `rerank_degraded` ≠ `ablation_rrf_only`.
4. **Public/private boundary unchanged:** fixture-only experiment; no private OEM corpus; no paid rerank API.
5. **CE stays in stack** for this experiment; abandonment forbidden until experiment completes or Tom parks.
6. **Do not edit freeze claims** in `MODEL_FREEZE_STATUS.md` to invent lift. Optional: append an “experiment pending / results” note **only after Implement** if Tom authorizes — Write stage does not touch freeze.
7. **Keep package:** `@xenova/transformers` (current `web/package.json`). Do not migrate to `@huggingface/transformers` in this slice unless import of `AutoTokenizer` / `AutoModelForSequenceClassification` is proven broken on the pinned version — then stop for human.
8. **N/K defaults stay** (`CE_TOP_N=20`, `CE_TOP_K=8`) unless a later Ready-check explicitly reopens sizes with evidence.

---

## Soft pins (binding for Implement)

| Pin | Locked default |
|-----|----------------|
| Scope | Correctness adapter + diagnostics + eval metric add-on only |
| CE scoring API | `AutoTokenizer` + `AutoModelForSequenceClassification`; pairs via `text_pair`; score = **raw logit** |
| Forbidden scoring | `` `${query} [SEP] ${content}` `` string concat; pipeline `text-classification` `.score` as the sole ranking signal |
| Cosine fallback | Keep as degrade/alternate init path; runtime must remain `transformers_js:cosine` and **must not** be reported as true CE lift |
| Variance probe | On a fixed shortlist (≥3 candidates with distinct content), assert `max(score) - min(score) > ε` (recommend `ε = 1e-3`); log min/max/mean/variance |
| Goldens | Same `evals/golden_fixture_v1.json` (n=44); no new trap band in this guide |
| Product smoke | Keep `citation_gold_hit` / `ce_vs_rrf_ask_delta_hits` emission |
| Primary experiment metrics | `gold_mrr_rrf`, `gold_mrr_ce`, `gold_recall_at_1_rrf`, `gold_recall_at_1_ce`, `gold_recall_at_3_rrf`, `gold_recall_at_3_ce`, `gold_in_rrf_top_k_count` / rate |
| Rank list for metrics | Pre-CE shortlist order (post-dedup, length ≤ N) vs post-CE ranked list (same IDs, CE order; use full scored shortlist before slice to K when available) |
| Gold match | Reuse `_chunk_matches_gold` / citation gold predicate (section path ∪ content substring) — do not invent a second gold language |
| Diagnostics gate | Extra rank fields only when `MECHANIC_DIAGNOSTICS=1` (or structured ask log) — never log full chunk bodies |
| Generator | `gemma4:e2b` for any paired re-run |
| Auto-freeze / lift language | **Forbidden** |
| Guide 16 / PrivateGold / paid API | **Out of scope** |

### Metric definitions (recommended — not a freeze lock)

For a ranked `chunk_id` list `L` and case gold (allowed sections/substrings):

- Let `rank` = 1-based index of the **first** chunk in `L` that matches gold (via DB content/section load, same as today). If none match: contribution `0` for Recall@k; MRR term `0`.
- **Recall@k** = 1 if `rank ≤ k`, else 0; report mean over paired-scored cases.
- **MRR** = mean of `1/rank` (or `0` if absent) over paired-scored cases.
- Compute separately on **RRF shortlist order** and **CE order** for the same shortlist IDs.
- **`gold_in_rrf_top_k`:** 1 if any gold-matching chunk appears in RRF-ordered shortlist positions `1..K` (K = `CE_TOP_K`, default 8) **before** CE. Aggregate count and rate. If this rate ≈ citation hit rate, document ceiling — do not call CE “failed.”

**Interpretation rule (honesty):** Top-rank deltas (MRR / Recall@1/@3) are the experiment’s decision signal. Citation∩gold delta remaining 0 is compatible with “CE helps rank but not set membership.”

---

## Ordered steps (Implement later — do not run in Write)

### Step 0 — Preconditions

1. Confirm Tom locks still in handoff: experiment authorized; optimize for top-rank relevance; citation hit = smoke.
2. Read current `cross_encoder.ts` classification branch (string+`[SEP]` + pipeline score) and review artifact P0.
3. Do **not** change `MODEL_FREEZE_STATUS.md` freeze rows in this experiment’s first Implement pass.

### Step 1 — Correctness: CE adapter

1. In `web/src/server/cross_encoder.ts`, replace classification scoring with model-card pattern:
   - Load `AutoTokenizer` + `AutoModelForSequenceClassification` from `@xenova/transformers` for `CE_MODEL` / default `Xenova/ms-marco-MiniLM-L-6-v2`.
   - For each pair (or a small batch of query×candidates): tokenize with `text_pair` (query list + passage list), `padding: true`, `truncation: true` (set explicit `max_length` if the API accepts it — prefer 512 when supported).
   - Forward model; take **raw logits** as `ce_score` (single-logit head → one float per pair). Sort descending by that score in `applyCeScores` (unchanged contract).
2. Preserve `CrossEncoder` interface (`scorePairs` → `{ chunk_id, ce_score }[]`).
3. Preserve cosine fallback if classification init fails; keep `runtime: transformers_js:classification|cosine`.
4. Keep `FakeCrossEncoder` + `rerankWithDegrade` behavior; do not weaken fail-open.
5. Update / add unit tests:
   - Existing fake-CE ranking tests still pass.
   - New test (prefer injectable / stubbed model **or** a focused helper that maps logits→scores) proving sort uses raw numeric logits, not pipeline softmax confidences.
   - Optional offline smoke (operator, not CI-mandatory): score the model-card Berlin example and expect positive vs negative logit split in the same direction as the card (`≈ +8` vs `≈ -11` scale, not both `≈ 1.0`).

### Step 2 — Score variance instrumentation

1. When diagnostics/logging is on, after `scorePairs` on the live shortlist, compute and emit:
   - `ce_score_min`, `ce_score_max`, `ce_score_mean`, `ce_score_variance` (or stddev)
   - `ce_score_degenerate: boolean` when `max - min ≤ ε` (pin ε in Soft pins)
2. Prefer structured ask log + `diagnostics` object; **never** log passage bodies.
3. Correctness probe DoD: at least one real shortlist (fixture ask or unit with real model if env allows) must show **non-degenerate** variance in `classification` mode. If variance is zero after the adapter fix, **stop** and report — do not claim metric work proves model quality.

### Step 3 — Expose ranked IDs for eval (minimal)

1. With `MECHANIC_DIAGNOSTICS=1`, extend ask diagnostics (and ask log fields as needed) to include:
   - `pre_ce_shortlist_chunk_ids`: post-dedup RRF order, length ≤ `CE_TOP_N`
   - `ce_ranked_chunk_ids`: CE order for the scored shortlist (or RRF order if degraded / ablation)
   - Existing `chunk_ids` / citations remain the assembled citation set
2. Ablation arm (`MECHANIC_FORCE_RRF_ONLY=1`): `ce_ranked_chunk_ids` may equal shortlist prefix; still emit `pre_ce_shortlist_chunk_ids` so the harness can compute RRF-side rank metrics without CE.
3. Do not require a second DB round-trip in the eval harness beyond loading chunk rows for gold match (same pattern as `_citation_gold_hit`).

### Step 4 — Rank-aware metrics in `eval_cmd.py`

1. Keep existing paired citation∩gold fields and delta.
2. Add helpers to compute gold rank / Recall@k / MRR from an ordered `chunk_id` list + case gold + DB.
3. For each paired-scored case, read diagnostics lists from both arms when present; if missing, mark case `rank_metrics_skipped` (do not invent ranks from citations alone without documenting that fallback — **prefer fail soft and count skips**).
4. Aggregate into `evals/last_run_summary.json`:
   - `gold_mrr_rrf`, `gold_mrr_ce`
   - `gold_recall_at_1_rrf`, `gold_recall_at_1_ce`
   - `gold_recall_at_3_rrf`, `gold_recall_at_3_ce`
   - `gold_in_rrf_top_k_count`, `gold_in_rrf_top_k_rate`
   - `rank_metric_cases_scored`, `rank_metric_cases_skipped`
   - Keep `ce_vs_rrf_ask_delta_hits` as smoke
5. Log a one-line honesty note in summary JSON: citation delta is smoke; rank metrics are the experiment signal.

### Step 5 — Operator verification run (Implement / Review — not Write)

1. Twin-process paired ask (CE-on + `MECHANIC_FORCE_RRF_ONLY=1`) with diagnostics on, same as Guide 08 path.
2. `mecharag eval --golden evals/ --ask-url … --ask-url-rrf-only …`
3. Record outcomes in a short Implement note (path under `mechanic_rag/docs/` or handoff Results) — **do not** flip freeze to “earned lift” from Write/Implement alone.

### Step 6 — Honesty gate after numbers

| Observation | Allowed claim |
|-------------|----------------|
| Degenerate scores after fix | Adapter still broken / env issue — **not** “CE has no value” |
| Non-degenerate scores + flat citation delta + flat MRR/Recall@1 | CE may be weak on this fixture domain — still not abandon without Tom |
| Non-degenerate + gold_in_rrf_top_k ≈ citation hit rate | Ceiling documented; citation metric insensitive |
| Clear CE MRR / Recall@1 lift vs RRF | Report as **rank evidence**; still no auto-freeze; Tom decides packaging |
| Cosine mode only | Not a true CE result — say so |

---

## Verification / Definition of Done

- [x] `cross_encoder.ts` classification path uses `text_pair` + raw logits (code reviewable).
- [x] Unit tests: fake CE / degrade / ablation unchanged in spirit; logit-based scoring covered.
- [x] Diagnostics (when enabled) expose score summary + pre-CE / CE-ranked chunk id lists without chunk bodies.
- [x] `eval_cmd.py` emits rank-aware aggregates **and** keeps citation∩gold smoke fields.
- [x] At least one operator or documented probe shows **non-degenerate** CE score variance in `classification` mode (or Explicit fail written if still degenerate).
- [x] `gold_in_rrf_top_k_*` present in summary after a paired run (or skipped count explained). *(Fields + skip counter shipped; live twin-process paired n=44 deferred to Review/operator — see Implement note.)*
- [x] No model swap; no paid API; no private OEM; no Guide 16 invent.
- [x] No freeze lift language; `MODEL_FREEZE_STATUS.md` honesty preserved.
- [x] No commit/push unless a later human-authorized handoff says so. *(Left to hub.)*

**Write-stage DoD (this pass only):** this guide exists with steps, DoD, blast radius, edge cases; handoff Results updated; **no code**.

**Implement-stage DoD:** Met 2026-07-21 — evidence `docs/2026-07-21_implement_ce_correctness_rank_sensitivity_experiment_pass164n_note.md`.
---

## Blast radius and risks

| Angle | Risk | Mitigation |
|-------|------|------------|
| Ask latency | Tokenizer+model path may differ from pipeline; batching changes CPU time | Keep timeout + fail-open; log `ce_latency_ms`; optional micro-batch later — not required for DoD |
| Score scale | Raw logits are unbounded; sorting still valid; do not treat as probabilities | Docs/types already say `ce_score` is model-native |
| Cosine fallback | Silent “CE” that is not CE | Runtime mode string + summary `ce_runtime_modes_seen` |
| Eval false confidence | Using citation order as rank proxy | Prefer diagnostics shortlist fields; skip + count if absent |
| Freeze doc drift | Someone claims lift from MRR alone | Soft pin: no auto-freeze; human packaging later |
| Fixture ceiling | Rank metrics also flat because gold always rank-1 under RRF | `gold_in_rrf_top_k_rate` makes that visible |
| Package API drift | `@xenova/transformers` vs HF v3 import paths | Stay on pinned package; stop for human if API missing |

---

## Edge cases (must handle in Implement)

1. **Empty shortlist / insufficient evidence** — no CE scores; rank metrics skipped; no crash.
2. **Ablation RRF-only** — no CE call; RRF rank metrics still computable from `pre_ce_shortlist_chunk_ids`.
3. **Degrade mid-request** — `rerank_degraded=true`; CE rank list = RRF prefix; do not label as ablation.
4. **Gold absent from shortlist** — MRR term 0; Recall@k 0; still counts toward ceiling analysis (CE cannot recover).
5. **Multiple gold-matching chunks** — use **first** match in ranked list for MRR/Recall.
6. **All-ones / near-ties after “fix”** — set `ce_score_degenerate`; fail correctness probe DoD.
7. **Hard-miss / `insufficient_evidence` goldens** — do not special-case outcome enforcement in this guide (known harness gap from review); rank metrics still apply to returned lists.
8. **Diagnostics off** — harness must not invent ranks; skip with counter.
9. **Invalid CE IDs** — existing `applyCeScores` null → degrade; unchanged.
10. **Long passages** — truncation via tokenizer flags; do not concatenate with literal `[SEP]`.

---

## Out of scope (non-goals)

- Implement / Ready-check execution in this Write stage
- Model replacement or embedding unlock
- Private OEM corpus, paid rerank API, Guide 16 product expansion
- Abandoning CE
- Changing freeze override into “earned lift”
- Growing goldens / confusable sections (that was Guide 08; only if a later guide says so)
- Enforcing `expect_outcome: insufficient_evidence` in the harness
- nDCG (nice-to-have later; MRR + Recall@1/@3 sufficient here)

---

## Open recommendations (not locks)

| Topic | Recommendation | Reasoning | Tradeoff |
|-------|----------------|-----------|----------|
| Batch vs sequential forward | Batch the shortlist in one tokenizer/model call when API allows | Matches model card; usually faster/more stable | Slightly more adapter complexity; fall back to per-pair if batch API fails |
| Whether citation delta must move | No — success can be rank-only | Tom locked top-rank as primary | Interviewers may still ask about citation smoke — keep emitting it |
| Next step if rank also flat after correct adapter | Document domain/fixture limits; Tom decides park vs harder discriminative band | Avoid model zoo before adapter+metrics are honest | Delays “CE wins” portfolio story |

---

## QUALITY_STANDARD self-check (Write)

- [x] Objective, references, constraints, ordered steps, DoD, blast radius, edge cases present
- [x] No code implemented this stage
- [x] Scope limited to handoff slice; Guide 16 / abandon / freeze invent avoided
- [x] Locked Tom decisions honored (experiment authorize; top-rank primary; citation smoke)
