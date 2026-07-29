# Review — Personal garage golden eval (thin v1)

**Date:** 2026-07-25  
**Repo:** `mechanic_rag`  
**Stage:** Review implementation — **Pass**  
**Guide:** `docs/dev_guides/2026-07-25_dev_guide_personal_garage_golden_eval.md`

### Declare

| Item | Value |
|------|-------|
| Will write | This review · living context |
| Will **not** | Expand case count · paired ablation · freeze reopen |

---

## Verdict

**Shippable as-is (Review Pass).**

`evals/golden_garage_v1.json` (8 cases) + live eval: **4/4** positive citation∩gold hits; **4/4** hard-miss correctly non-hits. Public `golden_fixture_v1.json` untouched. No harness fork.

---

## DoD vs evidence

| Gate | Result |
|------|--------|
| Separate garage file | **Pass** |
| 8 cases / 4 vehicles | **Pass** |
| Live eval Met thresholds | **Pass** |
| Fixture isolation | **Pass** |
| Docs / honesty | **Pass** |
| Non-goals | **Honored** |

---

## Findings

| ID | Severity | Finding |
|----|----------|---------|
| R1 | Soft | Hard-miss cases often still `outcome=answered` — generator may invent; Met correctly uses citation∩gold=false |
| R2 | Soft | `mecharag eval --golden evals/` still loads first `golden*.json` only — operators must pass garage **file path** |
| R3 | Info | `last_run_summary.json` overwritten by this run — preserved `last_run_summary_garage_v1.json` |

**None required** for Review Pass.

---

## Next

Personal-garage Rank-1–3 closed. Optional later: larger garage eval / paired ablation. Friend program: Ram continue (promote in progress for `ram:2015:3500`).
