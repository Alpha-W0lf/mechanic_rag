# Context: Mechanic RAG (Align docs pass 10 refresh)

**Date:** 2026-07-13 (originally architecture Pass 4 refine 2026-07-12)  
**Repos:** `mechanic_rag`  
**Status:** Guide 01 vertical slice **shipped** · docs aligned to reality · **Not** portfolio-complete  
**Mode last used:** spoke (Align docs)

## Problem

Keep product docs honest relative to repo reality after Guide 01 Implement + Review: no stub-ask theater, no dual-app-tree warnings as if current, gemma as operator default, embedding/CE freeze still pending, slice ≠ full portfolio v1.

## Acceptance criteria

- [x] `ARCHITECTURE.md` matches locked MR2 (order, N→K, scores, module boundary, degrade, eval lift)
- [x] VISION ranking language aligned
- [x] Research guide marked non-authoritative for ranking
- [x] Write-dev-guide (Guide 01) authored and DoD met
- [x] Live ask path (hybrid → RRF → section dedup → CE → Ollama + citations)
- [ ] Embedding + CE model IDs **frozen** with fixture evidence (candidates smoke-verified only — `evals/MODEL_FREEZE_STATUS.md`)
- [ ] Portfolio v1 packaging (GETTING_STARTED, INTERVIEW, ≥30 evals, public flip)

## In scope (this align pass)

- Status lines, §15 honesty table, VISION success checkboxes, guide generator default, dual-tree / mmr / stub drift

## Out of scope

- Code changes, Drive/Ford, model freeze ceremony, new Implement work

## Prior art (paths only)

- `docs/ARCHITECTURE.md`, `docs/VISION.md`, `docs/dev_guides/2026-07-12_dev_guide_01_hybrid_rrf_ce_ask_path.md`
- `evals/MODEL_FREEZE_STATUS.md`, `README.md`
- `second_brain/docs/2026-07-13_mechanic_review_impl_pass9.md`
- `second_brain/docs/2026-07-12_hybrid_rag_reranker_decision.md`

## Risks and blast radius

- Stale “stub ask / dual app tree / mmr.ts” language poisons next Implement if left as “today”
- Overclaiming freeze or “v1 complete” from Guide 01 DoD fails portfolio honesty

## Edge cases

- Guide DoD met while portfolio success checklist still open — both must be visible
- Pass 8c qwen baseline vs pass 9 gemma default — both true in different roles (historical vs operator)

## Unknowns (must resolve or escalate)

| Unknown | How to resolve | Blocking? |
|---------|----------------|-----------|
| Human freeze of embed/CE | Stronger paired eval + Tom gate | Yes for ranking “frozen” claims |
| Grow to ≥30 goldens | Later eval guide | Yes for portfolio-complete |
| GETTING_STARTED / INTERVIEW | Packaging pass | Yes for public-done packaging claim |

## Recommended approach

Treat Guide 01 as closed slice; next human-gated work is freeze evidence and/or packaging — not reopening ranking architecture.

## Open decisions (human)

- Freeze `nomic-embed-text@768` + Xenova MiniLM CE now (provisional keep) vs demand true RRF-only ablation first?
- Prioritize ≥30 goldens vs GETTING_STARTED/INTERVIEW next?

## Evidence opened this pass

- QUALITY_STANDARD, ALWAYS, LEARNING_MODE, align-docs stage
- Pass 10 handoff; pass 9 review; Guide 01; VISION; ARCHITECTURE; README; MODEL_FREEZE_STATUS
- Repo reality: `web/src/app` only; `section_dedup.ts`; no `web/app`; no `mmr.ts`

## Honest readiness

- Guide 01: **shippable** (already reviewed pass 9).
- Portfolio v1 / public flip: **not ready** — freeze pending, eval n=5, packaging gaps.
- Docs (after this pass): **aligned** to that honesty line.
