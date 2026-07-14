# Context: Guide 04 — Path-to-≥30 goldens + paired-ask re-baseline

**Date:** 2026-07-14  
**Repos:** `mechanic_rag`  
**Status:** Refined  
**Mode last used:** hub  
**Stage:** Refine context (pass 41)  
**Prioritize SSOT:** `second_brain/docs/2026-07-14_prioritize_next_work_guide04_pass40_fan_in.md`

## Problem

Guides 01–03 shipped hybrid→CE slice, paired ablation (flat delta 0 on n=12), and packaging. VISION §9 still needs stronger eval: fixture goldens → **≥30** and fresh paired-ask re-baseline under `gemma4:e2b`. Freeze/keep is a **human** gate after evidence.

## Live evidence (Refine)

- `evals/golden_fixture_v1.json`: **n=12**, all `vehicle_id=fixture:honda-s2000-demo`  
- Fixture corpus: `fixtures/honda_s2000_demo/service_manual.txt` (~63 lines) covering oil, clutch, spark, coolant, thermostat, valves, MTF — **enough text for many more honest questions** without OEM  
- **No second synthetic vehicle** in fixtures today  
- `PATH_TO_30.md` themes 1,3,6,7 are feasible on S2000 text; theme 2 (second vehicle) **deferred**; theme 4 (wiring) **deferred** (no wiring fixture text); theme 5 is meta notes not cases  

## Soft pins (Refine)

| Pin | Value |
|-----|--------|
| Hard DoD count | **≥30** distinct golden cases in `golden_fixture_v1.json` |
| Vehicle scope | Stay on `fixture:honda-s2000-demo` only (no second vehicle in this guide) |
| Theme mix (targets, sum ≥18 new ≈ total ≥30) | **+10** S2000 positives (PATH theme 1); **+3** hard misses (theme 3); **+3** negative/never-mix polarity (theme 6); **+2** multi-section distractors (theme 7); remaining slack may reinforce positives |
| Freeze | **Not** co-equal DoD — optional human keep-with-justification **after** re-baseline only |
| Ablation | Re-run paired ask; refresh `last_run_summary.json`; forbid proxy lift fields |

## Acceptance criteria

- [ ] `golden_fixture_v1.json` has **≥30** cases on S2000 fixture only, following theme mix pins  
- [ ] Paired ask ablation re-run; `ce_vs_rrf_ask_delta_hits` honesty; proxy `+1`/`n=5`/bare `ce_vs_rrf_delta_hits` forbidden as lift  
- [ ] VISION §9 / README / MODEL_FREEZE_STATUS evidence updated for new n + delta  
- [ ] Optional: human keep-with-justification note if delta still flat/negative — **no invented lift / no forced freeze**  
- [ ] No ranking redesign; no PrivateGold/Drive/Ford; no second-vehicle invent  

## In scope

Fixture golden growth on existing S2000 text; paired-ask re-baseline; docs honesty; optional keep ceremony.

## Out of scope

Second vehicle catalog growth; wiring-only cases without fixture text; PrivateGold; Drive/Ford; ranking redesign; mandatory freeze-with-lift.

## Prior art (paths only)

- `mechanic_rag/evals/PATH_TO_30.md`  
- `mechanic_rag/evals/MODEL_FREEZE_STATUS.md`  
- `mechanic_rag/evals/golden_fixture_v1.json`  
- `mechanic_rag/fixtures/honda_s2000_demo/service_manual.txt`  
- `mechanic_rag/docs/dev_guides/2026-07-13_dev_guide_02_rrf_ablation_eval_freeze.md`  
- Pass 40 fan-in  

## Risks and blast radius

| Risk | Mitigation |
|------|------------|
| Duplicate near-identical questions | Require distinct `id` + meaningfully different gold substrings/sections |
| Freeze mid-growth | Freeze not in core DoD |
| Invented lift | Metric rails unchanged |
| Twin-process flaky in CI | Pin operator re-baseline path; CI policy in Write |

## Edge cases

- Hard-miss: empty `allowed_*` / citation∩gold miss  
- Multi-section distractors (thermostat vs coolant family pattern already in g09)  
- Negative polarity (never-mix fluids)  
- Flat/negative delta after growth → keep candidate  

## Unknowns (post-Refine)

| Unknown | Status |
|---------|--------|
| Exact new case ids / question prose | Implement craft under theme mix |
| Whether keep ceremony is in same PR | Soft default: docs stub update only unless human freezes |

## Open decisions (human)

- None material — ≥30 on S2000-only is locked feasible; override only if human wants second vehicle first  

## Evidence opened this Refine

- n=12 goldens; 63-line service_manual; PATH_TO_30 themes mapped  

## Honest readiness

- Ready for Write-dev-guide? **Yes**  
- Not Implement  
