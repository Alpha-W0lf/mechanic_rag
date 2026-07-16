# Context: Guide 05 — Model freeze or keep-with-justification

**Date:** 2026-07-15  
**Repos:** `mechanic_rag`  
**Status:** Refined (pass 59); **decision locked 2026-07-16** — keep candidates + honesty note; keep reranker in stack  
**Locks:** `second_brain/docs/2026-07-16_human_locks_pass60_fan_in.md`

## Problem

Guide 04 landed **30** S2000 fixture goldens and a paired-ask re-baseline with `ce_vs_rrf_ask_delta_hits=0`. Embed + CE remain **candidates**. Portfolio interview claims of “frozen models” or “CE improves retrieval” are still **unsafe**. `MODEL_FREEZE_STATUS.md` already has a keep-with-justification **stub** for human edit — not authored as lift.

## Acceptance criteria

- [ ] Human chooses one: **(A) freeze** embed and/or CE under freeze checklist, **or (B) keep-with-justification (MR2)** leaving candidate  
- [ ] `evals/MODEL_FREEZE_STATUS.md` updated by human-authored language (agent may format only)  
- [ ] VISION / GETTING_STARTED / INTERVIEW honesty match the choice (no lift theater)  
- [ ] Forbidden: freeze on proxy `+1`/`n=5`; inventing positive delta  
- [ ] Optional same delivery: strike stale “Grow to ≥30” rows in ARCHITECTURE if still present  

## In scope

- Decision capture + docs Align for freeze/keep  
- Optional thin note linking `last_run_summary.json` evidence  

## Out of scope

- Ranking redesign; second vehicle; PrivateGold; Drive/Ford  
- Changing CE/embed models mid-guide without new eval evidence  
- Claiming `insufficient_evidence` contract solved (g10 residual = separate optional slice)  

## Prior art (paths only)

- `evals/MODEL_FREEZE_STATUS.md`  
- `evals/last_run_summary.json` (n=30, delta=0)  
- `evals/PATH_TO_30.md`  
- `docs/VISION.md` §2 / §9  
- `INTERVIEW.md` §7–§9  
- Guide 04: `docs/dev_guides/2026-07-14_dev_guide_04_path_to_30_rebaseline.md`  

## Risks and blast radius

| Risk | Mitigation |
|------|------------|
| Agent invents freeze | Human-only checklist; agent stops for H-ME-FZ |
| Freeze despite flat delta without justification | Require MR2 prose or leave candidate |
| Interview overclaim | Align GETTING_STARTED / INTERVIEW banners |

## Edge cases

- Freeze embed only, CE stay candidate (allowed if human says so)  
- Keep CE for latency/diversity with explicit “no lift” sentence  
- Generator `gemma4:e2b` is **not** a freeze lock (already documented)  

## Unknowns

| Unknown | How to resolve | Blocking? |
|---------|----------------|-----------|
| Human preference freeze vs keep | **H-ME-FZ** | **Yes** for Implement/Align body |
| Whether g10 residual is in same guide | Recommend **no** — separate optional slice | No |

## Recommended approach

1. Human locks **H-ME-FZ** (prefer MR2 keep — see below).  
2. Thin Align-docs / docs-only guide — no product ranking code.  
3. Optional later: g10 grounding residual as its own guide.  

## Open decisions (human)

- **Plain title:** Should Mechanic lock (“freeze”) the embedding and rerank models, or leave them as candidates with a written honesty note? (id: H-ME-FZ)
  - In plain terms: We ran 30 test questions. Adding the cross-encoder reranker did **not** improve how often citations hit the gold answer vs the simpler ranking path. “Freeze” would mean declaring these models officially chosen. That claim is not earned yet.
  - Options: (A) freeze both models; (B) freeze embedding only; (C) leave both as candidates and write why we still keep the reranker in the stack; (D) park.
  - Recommendation: **(C)** — leave both as candidates; write a short honesty note.
  - Reasoning: Eval showed zero improvement from the reranker on this fixture set. Freezing would overclaim. Keeping the reranker as an optional step is still useful for demos and latency discussion if we say clearly it did not lift this metric.
  - Tradeoffs: Interviewers may ask why keep a reranker with no lift — answer must be written. Freezing sounds stronger in a one-liner but fails the evidence bar.

## Evidence opened this pass

- MODEL_FREEZE_STATUS.md; last_run_summary (n=30, delta=0)  
- VISION §9; Prioritize pass 58; Refine pass 59  

## Honest readiness

- Ready for Write-dev-guide? **Yes** — thin docs-only guide to author the keep-with-justification note and Align honesty banners. Reranker stays in the architecture; do not claim citation lift.  
- Context quality: sufficient.  
