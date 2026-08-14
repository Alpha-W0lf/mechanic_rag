> **ARCHIVED** — moved under Workflow OS documentation sprawl reform.
> Do not treat this file as living SSOT.
> Living successor: `docs/VISION.md` · `docs/ARCHITECTURE.md` · living guides under `docs/dev_guides/`
> Batch: `2026-08_sprawl_c2c_mechanic_stage_notes`
> Date: 2026-08-13
# Review — Mechanic M3 vision answers

**Date:** 2026-07-27  
**Mode:** waterfall · Build · **Stage:** Review implementation  
**Guide:** `docs/dev_guides/2026-07-26_dev_guide_mechanic_m3_vision_answers.md`  
**B1 evidence:** `docs/2026-07-27_m3_vlm_eval_evidence.json`  
**Goldens:** `evals/golden_m3_vision_v1.json`  
**Harness:** `scripts/m3_vlm_eval_harness.py`  
**Arms:** `:3000` `MECHANIC_VLM=1` · `:3002` VLM off · `:3003` `MECHANIC_VLM_FORCE_FAIL=1`

### Declare

| Item | Value |
|------|-------|
| Will review | Optional VLM assist + torque non-regression + degrade + filter honesty |
| Will **not** | Claim VLM replaces manuals; invent pass thresholds; start M4; Align VISION (C1/MR-4) |

---

## Guide DoD checklist

| # | DoD | Evidence | Status |
|---|-----|----------|--------|
| 1 | Flag-off path = M1/M0 behavior | `m3-t02` → `vlm_disabled`; torque `39 N·m` / `29 lbf·ft` | **Pass** |
| 2 | Flag-on: diagram assist works; torque still text-cited | `m3-d01`/`d02`: `vlm_invoked=true`, `vlm_degraded=false`, pages cached; `m3-t01`/`t03` router_skip + correct specs | **Pass** |
| 3 | VLM down → degrade, no hang | `m3-g01` force-fail → `vlm_unavailable_or_timeout`, text answered; `m3-g02` → `no_cached_png` | **Pass** |
| 4 | Evals honest | Evidence JSON 8 rows; `no_invented_pass_threshold: true` | **Pass** |
| 5 | Review Pass / Pass-with-nits | This note | **Pass-with-nits** |

## B1 harness summary (no pass threshold invented)

| Case | Result | Notes |
|------|--------|-------|
| m3-d01 diagram | invoked, not degraded, pages 22–23 | Post-fix evidence |
| m3-d02 wiring | invoked, not degraded, pages 23, 687 | |
| m3-t01 torque VLM on | router_skip; 39 N·m / 29 lbf·ft | |
| m3-t02 torque VLM off | vlm_disabled; same torque | |
| m3-t03 capacity | router_skip; 4.8 liters | |
| m3-g01 force-fail | degraded unavailable; text answered | |
| m3-g02 no PNG | degraded `no_cached_png` | fixture |
| m3-f01 filter unit | strips 99; keeps 39 | synthetic |

## Findings (smallest set)

| Sev | Finding | Action |
|-----|---------|--------|
| **Bug (fixed)** | `maybeAssistWithVlm` called `filterVlmNotesAgainstCitations(..., citedTexts)` with **unbound** `citedTexts` (should be `input.citedTexts`) → `ReferenceError` → ask outer catch `vlm_internal_error` while standalone Ollama vision worked | Fixed to `input.citedTexts`; inner try/catch fail-open with truncated reason |
| Nit | No unit regression that would have caught the unbound identifier (tsc/`vitest` did not exercise the live filter path) | Optional follow-up: mock `callLocalVlm` + assert filter receives cited texts |
| Nit | Ask outer catch still maps any throw to generic `vlm_internal_error` (inner catch now carries message prefix) | Acceptable defense-in-depth; leave |
| Deferred | Guide **C1** VISION/ARCHITECTURE honesty pointers | **MR-4 Align** (not this Review) |

## Verdict

**Pass-with-nits — shippable for M3 Implement DoD (A1–A3 + B1).** Optional local VLM assist is real on cache-hit PNGs; text owns torque/spec; degrade paths honest; default flag remains off.

**M3 Review Met.** Next: **C1 / MR-4 Align** (VISION honesty) · hub **VD-3 Align** counts · batch-3 remains planning until Ready≥8 + separate Go (live OUT of current finish-line Build Met).
