# Dev Guide 10a — MIT LICENSE packaging only (P1)

**Date:** 2026-07-18  
**Repo:** `mechanic_rag`  
**Work item:** Guide 10a — add root **MIT** `LICENSE`; refresh public-flip checklist gate 6 honesty; **no** public flip / VISION §9 marketing tick  
**Stage that authored this:** Write-dev-guide (pass 153)  
**Status:** **Draft — Write complete** (not Implemented)  
**Context SSOT:** `mechanic_rag/docs/2026-07-18_license_public_flip_path_context_summary.md`  
**Handoff (Write):** `second_brain/docs/2026-07-18_spoke_mechanic_write_license_pass153_handoff.md`  
**Prerequisite:** Guide 09 Path B freeze-override **Aligned / Closed**; Tom locks **MIT** + **P1** (pass 153)

**Tom locks (pass 153 — do not reopen):**

| Pin | Lock |
|-----|------|
| LICENSE | **MIT** (standard MIT text; peer: `ai-knowledge-base-public/LICENSE`) |
| Split | **P1** — LICENSE only; **no** public flip / §9 public-flip tick / v1 Done claim |
| Freeze honesty | Keep Guide 09 **frozen (Tom override)**; n=44 delta **0**; no earned lift |
| Guide 10b | Out of Met — public flip after LICENSE Met + checklist re-verify + separate Tom flip lock |

---

## Objective

Land **root MIT LICENSE** so PUBLIC_FLIP checklist gate 6 can become honest (“LICENSE present”) **without** claiming portfolio public flip / v1 Done.

1. Create repo-root `LICENSE` with standard MIT text.  
2. Update `docs/PUBLIC_FLIP_CHECKLIST.md` gate 6 + thin honesty surfaces (README / GETTING_STARTED / INTERVIEW / VISION §9 **prose only** where they say “LICENSE absent”) — **§9 public-flip checkbox stays `[ ]`**.  
3. Preserve freeze-override honesty (Guide 09).  
4. **Stop.** Do not start Guide 10b / public flip.

**Success signal (after Implement):** `test -f LICENSE` green; gate 6 says MIT present; a reviewer cannot honestly believe “public flip ready / v1 Done” from this guide alone.

**This Write stage does not Implement and does not add `LICENSE`.**

---

## Learning notes (interview-portable)

1. **License as release hygiene** — Portfolio repos usually need an explicit LICENSE before a public “done” claim.  
2. **Prerequisite ≠ marketing flip** — LICENSE Met does not auto-check VISION §9 public flip.  
3. **Gate separation** — keep ≠ freeze ≠ LICENSE ≠ public flip.  
4. **SPDX / peer consistency** — Matching a sister repo’s MIT reduces reviewer surprise.

---

## References (paths only)

- `mechanic_rag/docs/2026-07-18_license_public_flip_path_context_summary.md`
- `mechanic_rag/docs/PUBLIC_FLIP_CHECKLIST.md`
- `mechanic_rag/docs/VISION.md` (§9 — public flip stays unchecked)
- `mechanic_rag/evals/MODEL_FREEZE_STATUS.md` (freeze honesty — do not regress)
- `mechanic_rag/GETTING_STARTED.md` / `INTERVIEW.md` / `README.md`
- `mechanic_rag/docs/dev_guides/2026-07-18_dev_guide_09_tom_freeze_override_packaging.md` (closed)
- `ai-knowledge-base-public/LICENSE` (MIT peer text)
- `second_brain/docs/2026-07-18_spoke_mechanic_write_license_pass153_handoff.md`
- `second_brain/docs/workflow_os/rails/QUALITY_STANDARD.md`

---

## Architecture constraints (binding)

1. **LICENSE + thin docs only.** No ranking, eval, fixture, ingest, PrivateGold, Drive, Ford, OEM.  
2. **MIT only.** Do not substitute Apache-2.0 or invent custom personal-use terms.  
3. **P1 only.** VISION §9 public-flip row **must stay `[ ]`**. No “public flip ready” / “v1 Done” positive claims.  
4. **Freeze honesty unchanged.** Do not flip models back to candidates or invent CE lift.  
5. **Copyright pin:** `Copyright (c) 2026 Tom Chacko` (match AI KB public peer) unless Tom overrides before Implement.  
6. **Guide 10b out of Met.** Fail-closed / stranger-clone re-verify for flip are deferred.  
7. **Do not** edit Guide 09 closed outcomes except thin cross-links if needed.

---

## Soft pins (binding for Implement)

| Pin | Locked default |
|-----|----------------|
| File path | Repo root `LICENSE` (exact name; not `LICENSE.md`) |
| License family | **MIT** |
| Body | Standard MIT permission + warranty disclaimer (copy structure from `ai-knowledge-base-public/LICENSE`) |
| Copyright line | `Copyright (c) 2026 Tom Chacko` |
| PUBLIC_FLIP gate 6 | Update to: LICENSE **present (MIT, Guide 10a)**; secrets fail-closed still required before flip |
| PUBLIC_FLIP gates 1–5 | Refresh date/honesty only if needed; **do not** claim flip Met |
| VISION §9 public-flip | **Must remain `[ ]`**; optional prose: “LICENSE Met Guide 10a; flip still separate” |
| VISION §9 freeze | Unchanged `[x]` Guide 09 override |
| README / GETTING_STARTED / INTERVIEW | Replace “LICENSE absent / unmet” with “MIT LICENSE present (Guide 10a); public flip still open” |
| Forbidden phrases (positive claims) | “public flip ready”; “v1 Done”; “portfolio complete” from Guide 10a alone; “earned CE lift” |
| Optional | One-line README badge/link “License: MIT” — craft OK; not required if honesty table covers it |

---

## Locked decisions (do not reopen)

| Decision | Lock |
|----------|------|
| LICENSE family | **MIT** |
| Delivery split | **P1** — LICENSE only |
| Public flip in this guide | **Forbidden** |
| Freeze | Guide 09 override honesty **retained** |

---

## Acceptance criteria (for later Implement — unchecked at Write)

- [ ] Root `LICENSE` exists with MIT text + pinned copyright  
- [ ] `docs/PUBLIC_FLIP_CHECKLIST.md` gate 6 honest (MIT present; flip still separate)  
- [ ] README / GETTING_STARTED / INTERVIEW no longer claim LICENSE absent  
- [ ] VISION §9 public-flip still `[ ]`; freeze still `[x]` with override honesty  
- [ ] Verification commands pass; no ranking/code changes  

---

## Ordered step checklist

All boxes start unchecked. **Do not check boxes in Write / Ready-check.**

### Phase A — Anchor

- [ ] **A1.** Confirm `test ! -f LICENSE` before create (or stop if unexpected LICENSE already exists — escalate Tom).  
- [ ] **A2.** Confirm freeze surfaces still say **frozen (Tom override)** / n=44 delta 0 (no regression).  
- [ ] **A3.** Confirm VISION §9 public-flip is `[ ]` before edits.

### Phase B — Add MIT LICENSE

- [ ] **B1.** Create root `LICENSE` using standard MIT body; copyright `Copyright (c) 2026 Tom Chacko`.  
- [ ] **B2.** `test -f LICENSE` and spot-check first lines include `MIT License` + copyright.

### Phase C — Honesty Align (LICENSE only)

- [ ] **C1.** Update `docs/PUBLIC_FLIP_CHECKLIST.md` gate 6 + explicit non-claims: LICENSE Met ≠ public flip.  
- [ ] **C2.** Thin updates: README / GETTING_STARTED / INTERVIEW “LICENSE absent” → MIT present; public flip still open.  
- [ ] **C3.** VISION: optional §9 public-flip **prose** note LICENSE Met; **checkbox stays unchecked**. Banner may mention LICENSE present / flip still open.  
- [ ] **C4.** Grep: no new “public flip ready” / “v1 Done” positive claims; freeze override honesty intact.

### Phase D — Stop

- [ ] **D1.** No ranking/eval/fixture code; no Guide 10b; no §9 public-flip tick.  
- [ ] **D2.** Stop for Review.

---

## Verification / Definition of Done

```bash
# From mechanic_rag/
test -f LICENSE
head -n 3 LICENSE   # expect: MIT License / blank / Copyright (c) 2026 Tom Chacko

rg -n 'LICENSE|MIT|public flip|v1 Done|frozen \(Tom override\)|ce_vs_rrf_ask_delta' \
  LICENSE docs/PUBLIC_FLIP_CHECKLIST.md docs/VISION.md \
  README.md GETTING_STARTED.md INTERVIEW.md evals/MODEL_FREEZE_STATUS.md

# Must find: MIT LICENSE present; public flip still open / §9 public-flip unchecked
# Must NOT find as positive claims: public flip ready; v1 Done from Guide 10a; earned CE lift

rg -n '^- \[ \] Public flip' docs/VISION.md   # must still match unchecked
rg -n '^- \[x\] Formal embed/CE' docs/VISION.md  # freeze still checked
```

**DoD (Implement):** Root MIT `LICENSE` present; gate 6 honest; LICENSE-absent claims removed; §9 public-flip unchecked; freeze honesty intact; no ranking code.

**DoD (this Write):** Executable guide with steps / DoD / blast / edges; **no** Implement; **no** LICENSE file created in Write.

---

## Blast radius and risks

| Risk | Angle | Mitigation |
|------|-------|------------|
| Auto public flip with LICENSE | Marketing | P1 soft pin; verification requires §9 unchecked |
| Wrong license family | Legal | MIT lock; peer text |
| Wrong copyright | Legal | Pin Tom Chacko 2026 |
| Freeze honesty regression | Interview | Phase A2 + C4 |
| Scope into Guide 10b | Scope | Phase D hard stop |

**Blast radius:** `LICENSE`, `PUBLIC_FLIP_CHECKLIST.md`, thin README / GETTING_STARTED / INTERVIEW / VISION prose — **not** ranking/eval/fixtures.

### Rollback

Delete `LICENSE`; revert doc commits; restore “LICENSE absent” honesty.

---

## Edge-case handling

| Case | Behavior |
|------|----------|
| `LICENSE` already exists | Stop; compare to MIT pin; escalate Tom |
| Temptation to check §9 public flip | **Hard fail** Review |
| Temptation to run full flip checklist as DoD | Out of Met — Guide 10b |
| Tom changes copyright string | Amend soft pin before Implement |
| Secrets found while editing docs | Do not commit secrets; fail closed |

---

## Stop conditions

- Write: this guide landed; handoff Results filled; no Implement.  
- Implement (later): Phases A–D DoD met; LICENSE Met; public flip **not** Met.  
- **No** Guide 10b without new authorize.

---

## Ready for Ready-check?

**Yes** — thin packaging guide; MIT + P1 locked; placements pinned. Residual craft: exact README sentence voice at Implement.
