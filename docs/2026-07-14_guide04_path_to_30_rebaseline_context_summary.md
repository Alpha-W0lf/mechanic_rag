# Context: Guide 04 — Path-to-≥30 goldens + paired-ask re-baseline

**Date:** 2026-07-14  
**Repos:** `mechanic_rag`  
**Status:** Refined (pass 42)  
**Mode last used:** hub  
**Stage:** Refine context (pass 42 — second human-gated pass)  
**Role lens:** AI engineer (evals / retrieval honesty)  
**Prioritize SSOT:** `second_brain/docs/2026-07-14_prioritize_next_work_guide04_pass40_fan_in.md`

## Problem

Guides 01–03 shipped hybrid→CE slice, paired ablation (**flat delta 0 on n=12**), and packaging. VISION §9 still needs stronger eval: fixture goldens → **≥30** and fresh paired-ask re-baseline under `gemma4:e2b`. Freeze/keep is a **human** gate after evidence — not co-equal DoD.

## Live evidence (pass 42)

### Golden set

- File: `evals/golden_fixture_v1.json` — **n=12**, all `vehicle_id=fixture:honda-s2000-demo`
- Case schema keys: `id`, `question`, `vehicle_id`, `allowed_content_substrings`, `allowed_section_paths`, `notes`
- Current ids: g01–g12 (oil/clutch/spark/coolant/thermostat/valves/MTF capacity + g10 hard-miss ABS + g11 clutch fluid)

### Fixture corpus (~63 lines)

`fixtures/honda_s2000_demo/service_manual.txt` sections: Engine Oil, Clutch, Spark Plugs, Cooling, Valve Clearance, Transmission Fluid.

**Unused positive seeds still in text (not yet goldens):**

1. SAE 10W-30 / API SJ oil grade  
2. Oil filter install “additional 3/4 turn”  
3. Spark plug type NGK PFR7G-11  
4. Spark plug interval 105,000 miles  
5. Coolant 50/50 Honda Type 2  
6. Radiator cap 93–123 kPa  
7. Thermostat fully open 95 °C  
8. MTF fill-to-filler-hole procedure (capacity already g08)

→ **≥8 positives available without inventing text**; remaining growth = hard-miss / negative / multi-section variants + modest rephrasing of under-covered lines.

### Ablation operator path (existing)

```bash
# CE-on :3000 (FORCE unset) + RRF-only :3001 (MECHANIC_FORCE_RRF_ONLY=1)
mecharag eval --golden evals/ \
  --ask-url http://127.0.0.1:3000/api/ask \
  --ask-url-rrf-only http://127.0.0.1:3001/api/ask
```

Required honesty metrics: `rrf_only_ask_hits`, `ce_ask_hits`, `ce_vs_rrf_ask_delta_hits`.  
Forbidden as lift: proxy `ce_vs_rrf_delta_hits=+1` / `n=5` / bare non-ask delta.

### Stale meta

- `evals/PATH_TO_30.md` header still says “Guide 02” — Write/Implement must retitle/update for Guide 04 without changing theme list semantics.

## Soft pins (Refine)

| Pin | Value |
|-----|--------|
| Hard DoD count | **≥30** distinct cases in `golden_fixture_v1.json` |
| Vehicle scope | `fixture:honda-s2000-demo` only |
| Theme mix (new cases ≈ +18) | **+10** positives (prefer unused seeds above); **+3** hard misses; **+3** negative/never-mix; **+2** multi-section distractors |
| Deferred | Second vehicle (theme 2); wiring (theme 4 — no fixture text); degrade notes (theme 5 = meta, not cases) |
| Freeze | **Not** co-equal DoD — optional human keep-with-justification after re-baseline |
| Re-baseline | Same twin-server `mecharag eval` command; refresh `evals/last_run_summary.json` + `MODEL_FREEZE_STATUS.md` n/delta |
| Keep ceremony in same PR | Soft default: update evidence tables only; **do not** author freeze/keep-as-lift |

## Acceptance criteria

- [ ] `golden_fixture_v1.json` ≥30 on S2000 only; distinct `id`s; gold substrings map to real fixture lines  
- [ ] Theme mix meets soft pins (or honest shortfall documented if a theme cannot be filled without inventing text)  
- [ ] Paired ask re-run; ask-delta honesty; proxy lift forbidden  
- [ ] VISION §9 / README / `MODEL_FREEZE_STATUS.md` / `PATH_TO_30.md` updated for new n + delta  
- [ ] Optional: human keep stub refresh if flat/negative — no invented lift / no forced freeze  
- [ ] No ranking redesign; no PrivateGold/Drive/Ford; no second-vehicle invent  

## In scope

Fixture golden growth on existing S2000 text; paired-ask re-baseline; docs honesty.

## Out of scope

Second vehicle catalog; wiring-only cases; PrivateGold; Drive/Ford; ranking redesign; mandatory freeze-with-lift.

## Prior art (paths only)

- `evals/PATH_TO_30.md`, `evals/MODEL_FREEZE_STATUS.md`, `evals/golden_fixture_v1.json`, `evals/last_run_summary.json`  
- `fixtures/honda_s2000_demo/service_manual.txt`  
- `docs/dev_guides/2026-07-13_dev_guide_02_rrf_ablation_eval_freeze.md`  
- Pass 40–41 fan-ins  

## Risks and blast radius

| Risk | Mitigation |
|------|------------|
| Near-duplicate questions | Distinct ids + distinct gold substrings/sections |
| Invented fixture facts | Only quote lines present in `service_manual.txt` |
| Freeze mid-growth | Freeze not in core DoD |
| Twin-process flaky CI | Operator re-baseline documented; CI policy in Write (may stay manual) |
| PATH_TO_30 stale Guide 02 label | Update in same delivery |

## Edge cases

- Hard-miss: empty `allowed_*` / citation∩gold miss (g10 pattern)  
- Multi-section: thermostat vs coolant family (g09 pattern)  
- Negative polarity: never-mix fluids (g11 adjacent)  
- Flat/negative delta after growth → keep candidate, not freeze  
- Asymmetric paired failures → record; do not hide  

## Unknowns (post–pass 42)

| Unknown | How to resolve | Blocking for Write? |
|---------|----------------|---------------------|
| Exact new case ids / question prose | Implement craft under theme mix + unused seeds | No |
| Whether CI must run twin-server ablation | Write: prefer documented operator path; CI optional if flaky | No |

## Recommended approach

Grow goldens from unused fixture seeds first → fill hard-miss/negative/multi-section → re-baseline twin ask → refresh honesty docs. Freeze stays human-only after evidence.

## Open decisions (human)

- None material — ≥30 on S2000-only locked feasible  

## Evidence opened this pass (42)

- Enumerated all 12 case ids + schema keys  
- Listed 8 unused positive seeds from fixture text  
- Confirmed MTF section ends at fill procedure (line 63)  
- Confirmed ablation command in `MODEL_FREEZE_STATUS.md`  
- Confirmed PATH_TO_30 still titled Guide 02  

## Honest readiness

- Ready for Write-dev-guide? **Yes** — feasibility no longer hand-wavy; seeds + operator path pinned  
- Ready for Implement? **No**  
- Still weak: question-craft quality (near-duplicates) — Write must require distinct gold evidence  
