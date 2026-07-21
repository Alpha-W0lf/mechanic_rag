# Review note — CE correctness + rank sensitivity experiment (pass 164n)

**Date:** 2026-07-21  
**Repo:** `mechanic_rag`  
**Mode:** spoke  
**Stage:** Review implementation only  
**Guide:** `docs/dev_guides/2026-07-21_dev_guide_ce_correctness_rank_sensitivity_experiment.md`  
**Implement note:** `docs/2026-07-21_implement_ce_correctness_rank_sensitivity_experiment_pass164n_note.md`  
**Handoff:** `second_brain/docs/2026-07-21_spoke_mechanic_ce_review_pass164n_handoff.md`  
**Fan-in (Implement):** `second_brain/docs/2026-07-21_hub_fanin_mechanic_ce_implement_pass164n.md`  
**Freeze SSOT:** `evals/MODEL_FREEZE_STATUS.md` — **untouched** (no lift invent)

## Call

**PASS — shippable as-is** for the bounded CE correctness + rank-aware sensitivity experiment Implement.

No must-fix Soft/Hard Adjust. No commit this Review (prefer hub delivery commit). Twin-process paired n=44 remains an **optional operator residual**, not a ship blocker for adapter + harness land.

### Verified against guide Soft pins / DoD

| Check | Result |
|-------|--------|
| Classification uses `text_pair` + raw logits (no `` `[SEP]` `` concat / pipeline `text-classification` `.score`) | **Pass** — `cross_encoder.ts` `AutoTokenizer` + `AutoModelForSequenceClassification`; score via `logitsToPairScores` |
| Cosine fallback remains `transformers_js:cosine`; not CE lift | **Pass** — runtime string + per-case `cosine_runtime_not_ce_lift` + summary honesty note |
| `applyCeScores` still slices to K; full shortlist IDs via `sortScoredChunkIds` | **Pass** — product path unchanged; `ce_ranked_chunk_ids` = full CE order ≤ N |
| Variance probe (`ε = 1e-3`) + diagnostics fields | **Pass** — `summarizeCeScores` / `CE_SCORE_DEGENERATE_EPS`; ask diagnostics when `MECHANIC_DIAGNOSTICS=1` |
| Ablation emits RRF shortlist on both ID fields; no CE call | **Pass** — `ask.ts` force-RRF branch |
| Rank metrics + citation∩gold smoke retained | **Pass** — `eval_rank_metrics.py` + `eval_cmd.py` aggregates; skip counter when lists missing |
| Unit tests | **Pass** — `npm test -- src/lib/retrieval/__tests__/ranking.test.ts` → **17/17** (re-run this Review) |
| Rank helper logic | **Pass** — skip-on-missing; RRF MRR=1 / CE MRR=0.5 fixture order; cosine honesty flag |
| Freeze honesty | **Pass** — `MODEL_FREEZE_STATUS.md` clean (no working-tree edits); no lift language |
| Guide 16 / model swap / paid API / private OEM | **Pass** — out of scope held |

### Soft residuals (non-blocking)

1. **Twin-process paired n=44 (guide Step 5)** — not re-run this Review: `:3000` / `:3001` ask ports not listening. Harness + skip counters are ready; operator can run when twin Next processes + `MECHANIC_DIAGNOSTICS=1` are up. Do **not** invent freeze lift from missing live numbers.
2. **Per-case cosine flag not rolled into summary counts** — `cosine_runtime_not_ce_lift` is case-level; summary has a static honesty note. Optional tiny Align/polish later; not required to ship.
3. **`eval_cmd.py` `model_status` still says “candidate pending lock”** — pre-existing vs Guide 09 override freeze SSOT. Do **not** “fix” by inventing lift; optional Align language only if Tom authorizes (status wording ≠ freeze invent).

### Explicit non-claims

- Not earned CE citation∩gold lift · Not freeze unlock from this Review  
- Not Guide 16 · Not model zoo · Not twin-process n=44 Met this pass  

### QUALITY_STANDARD §5

Findings tied to guide Soft pins + honesty gate; spoke stayed in Review slice; edge cases (missing diagnostics → skip; ablation ≠ degrade; cosine ≠ lift; slice-K vs full shortlist IDs) checked; blast (eval false confidence, freeze doc drift) considered; no scope creep; no commit.

### Stop

Review Definition of Done Met (**Pass — shippable as-is**). Hub: commit Implement + notes when ready; optional operator Step 5; Align/freeze prose only with Tom authorize.
