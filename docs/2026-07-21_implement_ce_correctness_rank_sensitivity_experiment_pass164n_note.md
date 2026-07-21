# Implement note — CE correctness + rank sensitivity experiment (pass 164n)

**Date:** 2026-07-21  
**Repo:** `mechanic_rag`  
**Mode:** spoke  
**Stage:** Implement only  
**Authorize:** Tom — `Authorize Implement CE experiment`  
**Guide:** `docs/dev_guides/2026-07-21_dev_guide_ce_correctness_rank_sensitivity_experiment.md`  
**Handoff:** `second_brain/docs/2026-07-21_spoke_mechanic_ce_implement_pass164n_handoff.md`

## Verdict

**Implement Met** (code + unit tests + non-degenerate classification probe).  
**No freeze lift invent.** `evals/MODEL_FREEZE_STATUS.md` untouched.  
**No commit/push** this spoke — leave delivery commit to hub.

Soft residual for Review / operator: live twin-process paired ask (Guide Step 5) not executed here (needs two ask URLs with `MECHANIC_DIAGNOSTICS=1`). Harness emits `gold_in_rrf_*` when diagnostics lists present; otherwise increments `rank_metric_cases_skipped`.

## What shipped

| Step | Change |
|------|--------|
| 1 Adapter | `web/src/server/cross_encoder.ts` — `AutoTokenizer` + `AutoModelForSequenceClassification`; batch `text_pair`; raw logits via `logitsToPairScores`; cosine fallback remains `transformers_js:cosine` (not CE lift) |
| Soft residual | `sortScoredChunkIds` = full CE-sorted shortlist IDs (≤ N); `applyCeScores` still slices to K |
| 2 Variance | `summarizeCeScores` + diagnostics fields `ce_score_{min,max,mean,variance,degenerate}` |
| 3 Diagnostics | `ask.ts` emits `pre_ce_shortlist_chunk_ids` / `ce_ranked_chunk_ids` (+ score summary) when `MECHANIC_DIAGNOSTICS=1`; ablation emits RRF shortlist on both ID fields |
| 4 Eval | `mecharag/eval_rank_metrics.py` + `eval_cmd.py` aggregates MRR / Recall@1/@3 / `gold_in_rrf_top_k_*` + skip counters; citation∩gold smoke retained; cosine flagged `cosine_runtime_not_ce_lift` |

## Verification evidence

| Check | Result |
|-------|--------|
| `npm test -- src/lib/retrieval/__tests__/ranking.test.ts` | **17/17 passed** |
| Berlin / shortlist logit probe (classification) | scores ≈ `[8.63, -11.25, 5.33]`; `ce_score_degenerate=false`; `berlin_pos_gt_neg=true` |
| Rank helper logic (PYTHONPATH=.) | skip-on-missing; RRF MRR=1 / CE MRR=0.5 on fixture order; cosine honesty flag |
| Freeze file | **unchanged** |
| Commit | **none** (hub) |

## Honesty (Step 6)

- Non-degenerate classification logits after adapter fix → adapter correctness probe **passed**.
- No paired n=44 rank deltas claimed this stage (no live twin-process).
- Cosine mode must never be summarized as CE lift.

## Files touched (uncommitted)

- `web/src/server/cross_encoder.ts`
- `web/src/server/ask.ts`
- `web/src/lib/retrieval/__tests__/ranking.test.ts`
- `mecharag/eval_cmd.py`
- `mecharag/eval_rank_metrics.py` (new)
- this note + guide status checkoffs + handoff Results
