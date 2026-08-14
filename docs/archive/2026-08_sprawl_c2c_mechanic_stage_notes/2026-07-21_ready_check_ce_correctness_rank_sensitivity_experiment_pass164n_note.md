> **ARCHIVED** — moved under Workflow OS documentation sprawl reform.
> Do not treat this file as living SSOT.
> Living successor: `docs/VISION.md` · `docs/ARCHITECTURE.md` · living guides under `docs/dev_guides/`
> Batch: `2026-08_sprawl_c2c_mechanic_stage_notes`
> Date: 2026-08-13
# Ready-check note — CE correctness + rank sensitivity experiment (pass 164n)

**Date:** 2026-07-21  
**Repo:** `mechanic_rag`  
**Mode:** spoke  
**Stage:** Ready check before code only  
**Guide:** `docs/dev_guides/2026-07-21_dev_guide_ce_correctness_rank_sensitivity_experiment.md`  
**Critical review SSOT:** `second_brain/docs/2026-07-21_reranking_robustness_critical_review_pass164n.md`  
**Handoff:** `second_brain/docs/2026-07-21_spoke_mechanic_ce_ready_check_pass164n_handoff.md`  
**Write handoff:** `second_brain/docs/2026-07-21_spoke_mechanic_ce_experiment_write_dev_guide_pass164n_handoff.md`  
**Locks (do not reopen):** experiment authorized; primary metric = top-rank relevance (MRR / Recall@1/@3); citation∩gold = product smoke; existing models stay; fail-open degrade stays  

## Call

**READY (Go)** for Implement of the bounded CE correctness + rank-aware sensitivity experiment — **with soft residuals**.  
**Do not Implement in this stage.** Score is below 9.0 and soft residuals remain → Tom should say `Authorize Implement CE experiment` before coding starts.

### Implement readiness

| Track | Score | Why not 10 |
|-------|-------|------------|
| CE correctness + rank sensitivity experiment | **8.8 / 10** | (1) Soft pin tension: `applyCeScores` contract stays slice-to-K, but rank metrics need **full CE-sorted shortlist IDs** (length ≤ N) in diagnostics — guide Step 3 says emit them; Implement must add a sort-without-slice helper (or equivalent) without weakening fail-open. (2) Exact Transformers.js logits tensor indexing (`outputs.logits` batch/shape → one float per pair) is correct-by-intent but not copy-paste pinned. (3) Fixture ceiling can still flatten citation smoke **and** limit rank headroom after a correct adapter — experiment honesty gate covers this, but cannot guarantee “CE wins” story. (4) Optional Berlin model-card smoke is operator-only (correct); live variance probe still needs env/model load at Implement. |

**Overall:** **8.8 / 10** · **Go** (authorize phrase still required)

**Not inflated:** Critical-review P0s mapped 1:1 into guide steps; Tom locks present; freeze honesty preserved; package API risk **cleared this Ready** (see evidence); no code started.

### Alignment (guide ↔ review ↔ live truth)

| Check | Status |
|-------|--------|
| Critical review P0 adapter defect (string+`[SEP]` + pipeline `.score`) | **Aligned** — still live in `web/src/server/cross_encoder.ts` L79–88; guide Step 1 replaces with `text_pair` + raw logits |
| Critical review P0 insensitive citation∩gold | **Aligned** — guide keeps smoke; adds MRR / Recall@1/@3 + `gold_in_rrf_top_k_*` |
| Critical review ceiling / sensitivity | **Aligned** — `gold_in_rrf_top_k_count` / rate + honesty table |
| Tom locks (experiment + top-rank primary + citation smoke) | **Aligned** — Soft pins + Write handoff Results |
| Models / fail-open / public-private / no Guide 16 | **Aligned** — Architecture constraints binding |
| Freeze honesty (override ≠ lift) | **Aligned** — guide forbids freeze invent; `evals/MODEL_FREEZE_STATUS.md` still override language |
| Pipeline order ARCHITECTURE §7 | **Aligned** — vector+lexical → RRF → dedup → CE N→K → citations |
| Eval harness reuse `_chunk_matches_gold` | **Aligned** — Soft pin; helpers exist in `mecharag/eval_cmd.py` |
| Ablation ≠ degrade | **Aligned** — `ask.ts` `rankingDiagnosticFlags`; guide edge cases |
| Diagnostics gate `MECHANIC_DIAGNOSTICS=1` | **Aligned** — ask already gates diagnostics; Step 3 extends fields |
| `@xenova/transformers` AutoTokenizer / AutoModelForSequenceClassification / `text_pair` | **Verified this Ready** — present on pinned `^2.17.2` (see evidence) |
| Guide status unchecked Implement DoD | **Correct** for Ready |

### Evidence attached this Ready-check

| Item | Result |
|------|--------|
| Live CE scoring | `cross_encoder.ts` still `ranker(\`${query} [SEP] ${c.content}\`)` + pipeline `.score` |
| Package exports | `AutoTokenizer`, `AutoModelForSequenceClassification` are functions from `@xenova/transformers` |
| `text_pair` API | `tokenizers.js` / `types/tokenizers.d.ts` document `options.text_pair`; batch arrays supported |
| Ask diagnostics today | Has `rerank_degraded`, `ablation_rrf_only`, `ce_runtime_mode`, `chunk_ids` — **not yet** `pre_ce_shortlist_chunk_ids` / `ce_ranked_chunk_ids` / score variance (expected pre-Implement) |
| Eval summary today | Emits `ce_vs_rrf_ask_delta_hits` citation smoke; **no** gold MRR/Recall fields yet (expected) |
| Unit tests | `ranking.test.ts` covers Fake CE success/throw/empty + invalid IDs via `rerankWithDegrade` / `applyCeScores` |
| Package pin | `web/package.json` → `@xenova/transformers` `^2.17.2` |

### Blast radius / rollback

| Angle | Assessment |
|-------|------------|
| Ask path | Adapter swap inside `cross_encoder.ts`; timeout + fail-open unchanged → rollback = revert adapter commit / leave cosine degrade |
| Eval | Additive rank fields in `eval_cmd.py` + summary JSON; citation smoke retained → rollback = drop new fields |
| Freeze docs | Guide forbids lift invent on first Implement — freeze file stays override until Tom packaging |
| Latency | Tokenizer+model may differ from pipeline; mitigated by existing CE timeout + degrade |
| Cosine fallback | Must remain labeled `transformers_js:cosine`; not countable as CE lift |

### Edge cases (guide covers — verified against code contracts)

1. Empty shortlist / insufficient evidence  
2. Ablation RRF-only (`MECHANIC_FORCE_RRF_ONLY`) vs natural degrade  
3. Gold absent from shortlist → MRR/Recall 0  
4. Multiple gold matches → first-in-list  
5. Degenerate scores → `ce_score_degenerate` / stop claiming model quality  
6. Diagnostics off → skip rank metrics + count (do not invent from citations alone)  
7. Invalid CE IDs → existing `applyCeScores` null → degrade  
8. Long passages → tokenizer truncation, not literal `[SEP]`  

### Refinements still required before Implement?

**None blocking Ready Go.** Soft Implement preferences (not No-Go):

1. **Name the helper:** when emitting `ce_ranked_chunk_ids`, sort the full scored shortlist (≤ N) **before** `applyCeScores` slice-to-K; keep `applyCeScores` contract unchanged.  
2. **Logits extraction:** assert one numeric logit per pair from model output; unit-test with stubbed logits → sort order.  
3. **Operator twin-process:** paired ask with diagnostics on remains the verification run after code (guide Step 5) — not a Ready blocker.  
4. **Optional:** one-line guide Soft-pin clarifying (1) if hub wants a micro Refine; otherwise Implement may follow Step 3 + Soft pins as written.

### Explicit non-claims (this stage)

- No Implement started  
- No model swap / Guide 16 / private OEM / paid API  
- No freeze lift invent  
- No commit / push  

### Open human gate

**Decision:** Authorize Implement for the CE experiment?  
**In plain terms:** Ready says Go at 8.8/10 with soft residuals; handoff requires an explicit authorize phrase when score &lt; 9.0 or residuals remain.  
**Options:** (A) Say `Authorize Implement CE experiment` and start Implement; (B) Optional micro Refine-dev-guide for the shortlist-ID helper sentence, then authorize; (C) Park.  
**Recommendation:** **(A)** — residuals are Implement-time clarity, not design holes; package API risk already cleared.  
**Reasoning:** Guide maps review P0s; locks present; blast/rollback clear; edge cases listed.  
**Tradeoffs:** Skipping micro-Refine saves a pass but leaves the slice-vs-full-shortlist detail for the Implement agent to resolve carefully.  
**Needs from you:** `Authorize Implement CE experiment` (or park / request Refine).

### QUALITY_STANDARD §5

Assumptions eliminated with package/code evidence where possible; spoke stayed in Ready slice; blast ≥2 angles; edges planned; numeric score + why not 10; findings written to this note + handoff Results; no Implement/commit/push.

### Stop

Ready Definition of Done Met (**Go 8.8/10**). Wait for Tom authorize before any Implement.
