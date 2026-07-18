# Dev Guide 10a — PolyForm Noncommercial LICENSE packaging only (P1)

**Date:** 2026-07-18  
**Repo:** `mechanic_rag`  
**Work item:** Guide 10a — add root **PolyForm Noncommercial License 1.0.0** `LICENSE`; refresh public-flip checklist gate 6 honesty; **no** public flip / VISION §9 marketing tick  
**Stage that authored this:** Write-dev-guide (pass 153) · **Soft Adjust** Write (pass 154) — MIT → PolyForm-NC  
**Status:** **Implemented** 2026-07-18 (Guide 10a PolyForm-NC LICENSE packaging) — LICENSE Met; public flip **not** Met  
**Ready-check:** `docs/2026-07-18_guide10a_ready_check_polyform_nc_pass155_note.md` (9.2/10)  
**Handoff (Implement):** `second_brain/docs/2026-07-18_spoke_mechanic_implement_polyform_nc_pass155_handoff.md`  
**Context SSOT:** `mechanic_rag/docs/2026-07-18_license_public_flip_path_context_summary.md`  
**Decision note:** `second_brain/docs/2026-07-18_license_polyform_nc_decision_note.md`  
**Handoff (Soft Adjust):** `second_brain/docs/2026-07-18_spoke_mechanic_soft_adjust_polyform_nc_pass154_handoff.md`  
**Handoff (Write MIT — superseded):** `second_brain/docs/2026-07-18_spoke_mechanic_write_license_pass153_handoff.md`  
**Prerequisite:** Guide 09 Path B freeze-override **Aligned / Closed**; Tom locks **PolyForm-NC 1.0.0** + **P1** (pass 154)

**Supersedes:** pass-153 MIT pins in the former `…_mit_license_packaging.md` guide.

**Tom locks (pass 154 — do not reopen):**

| Pin | Lock |
|-----|------|
| LICENSE | **PolyForm Noncommercial License 1.0.0** (SPDX: `PolyForm-Noncommercial-1.0.0`) — **not** MIT, **not** pure All Rights Reserved |
| Split | **P1** — LICENSE only; **no** public flip / §9 public-flip tick / v1 Done claim |
| Honesty label | **Source-available / non-commercial** — **not** OSI “open source”; README must say so |
| Freeze honesty | Keep Guide 09 **frozen (Tom override)**; n=44 delta **0**; no earned lift |
| Guide 10b | Out of Met — public flip after LICENSE Met + checklist re-verify + separate Tom flip lock |

---

## Objective

Land **root PolyForm Noncommercial 1.0.0 LICENSE** so PUBLIC_FLIP checklist gate 6 can become honest (“LICENSE present”) **without** claiming portfolio public flip / v1 Done, and **without** claiming OSI open-source / MIT permissiveness.

1. Create repo-root `LICENSE` with the **official** PolyForm Noncommercial 1.0.0 text.  
2. Update `docs/PUBLIC_FLIP_CHECKLIST.md` gate 6 + thin honesty surfaces (README / GETTING_STARTED / INTERVIEW / VISION §9 **prose only**) — **§9 public-flip checkbox stays `[ ]`**.  
3. README (and related honesty) must state: **source-available · non-commercial OK · contact for commercial** — not “open source” / not MIT.  
4. Preserve freeze-override honesty (Guide 09).  
5. **Stop.** Do not start Guide 10b / public flip.

**Success signal (after Implement):** `test -f LICENSE` green; gate 6 says PolyForm-NC present; a reviewer cannot honestly believe “OSI open source,” “MIT,” “public flip ready,” or “v1 Done” from this guide alone.

**Soft Adjust Write (pass 154) did not Implement.** Implement (pass 155) added root `LICENSE` + honesty surfaces; public flip still open.

---

## Learning notes (interview-portable)

1. **Source-available ≠ open source** — Non-commercial licenses allow public GitHub + learning forks while reserving commercial rights; do not badge as OSI open source.  
2. **Prerequisite ≠ marketing flip** — LICENSE Met does not auto-check VISION §9 public flip.  
3. **Gate separation** — keep ≠ freeze ≠ LICENSE ≠ public flip.  
4. **License text fidelity** — Use the official PolyForm text (URL / SPDX), not a paraphrased summary in `LICENSE`.

---

## References (paths only)

- `mechanic_rag/docs/2026-07-18_license_public_flip_path_context_summary.md`
- `second_brain/docs/2026-07-18_license_polyform_nc_decision_note.md`
- `mechanic_rag/docs/PUBLIC_FLIP_CHECKLIST.md`
- `mechanic_rag/docs/VISION.md` (§9 — public flip stays unchecked)
- `mechanic_rag/evals/MODEL_FREEZE_STATUS.md` (freeze honesty — do not regress)
- `mechanic_rag/GETTING_STARTED.md` / `INTERVIEW.md` / `README.md`
- `mechanic_rag/docs/dev_guides/2026-07-18_dev_guide_09_tom_freeze_override_packaging.md` (closed)
- Official text: https://polyformproject.org/licenses/noncommercial/1.0.0  
- SPDX: `PolyForm-Noncommercial-1.0.0` — https://spdx.org/licenses/PolyForm-Noncommercial-1.0.0  
- Canonical markdown source (optional copy): https://github.com/polyformproject/polyform-licenses/blob/1.0.0/PolyForm-Noncommercial-1.0.0.md  
- `second_brain/docs/2026-07-18_spoke_mechanic_soft_adjust_polyform_nc_pass154_handoff.md`
- `second_brain/docs/workflow_os/rails/QUALITY_STANDARD.md`

**Do not** use `ai-knowledge-base-public/LICENSE` (MIT) as the body for Mechanic.

---

## Architecture constraints (binding)

1. **LICENSE + thin docs only.** No ranking, eval, fixture, ingest, PrivateGold, Drive, Ford, OEM.  
2. **PolyForm-NC 1.0.0 only.** Do not substitute MIT, Apache-2.0, ARR-only, or invent custom terms.  
3. **P1 only.** VISION §9 public-flip row **must stay `[ ]`**. No “public flip ready” / “v1 Done” positive claims.  
4. **Freeze honesty unchanged.** Do not flip models back to candidates or invent CE lift.  
5. **Copyright / licensor pin:** Keep copyright notice consistent with PolyForm requirements; use `Copyright (c) 2026 Tom Chacko` (or Tom-chosen) where the license expects a copyright line / notice — do not invent a second conflicting copyright block.  
6. **Honesty language:** Must **not** call the repo OSI open source or MIT after this guide. Prefer “source-available / non-commercial.”  
7. **Guide 10b out of Met.** Fail-closed / stranger-clone re-verify for flip are deferred.  
8. **Do not** edit Guide 09 closed outcomes except thin cross-links if needed.

---

## Soft pins (binding for Implement)

| Pin | Locked default |
|-----|----------------|
| File path | Repo root `LICENSE` (exact name; not `LICENSE.md`) |
| License family | **PolyForm Noncommercial License 1.0.0** |
| SPDX id | `PolyForm-Noncommercial-1.0.0` |
| Body source | Official PolyForm Noncommercial 1.0.0 full text from polyformproject.org (or polyform-licenses `1.0.0` tag) — **verbatim**, not paraphrased |
| Copyright / notice | `Copyright (c) 2026 Tom Chacko` as licensor notice where appropriate |
| PUBLIC_FLIP gate 6 | Update to: LICENSE **present (PolyForm-Noncommercial-1.0.0, Guide 10a)**; secrets fail-closed still required before flip |
| PUBLIC_FLIP gates 1–5 | Refresh date/honesty only if needed; **do not** claim flip Met |
| VISION §9 public-flip | **Must remain `[ ]`**; optional prose: “LICENSE Met Guide 10a (PolyForm-NC); flip still separate” |
| VISION §9 freeze | Unchanged `[x]` Guide 09 override |
| README / GETTING_STARTED / INTERVIEW | Replace “LICENSE absent / unmet” with PolyForm-NC present; state **source-available / non-commercial** (not OSI open source); public flip still open; commercial use → contact copyright holder |
| Forbidden phrases (positive claims) | “open source” (OSI sense) as the repo license; “MIT”; “public flip ready”; “v1 Done”; “portfolio complete” from Guide 10a alone; “earned CE lift”; “all rights reserved” as the sole license story |
| Optional | README one-liner: `License: PolyForm Noncommercial 1.0.0 (source-available · non-commercial)` — craft OK |

---

## Locked decisions (do not reopen)

| Decision | Lock |
|----------|------|
| LICENSE family | **PolyForm-Noncommercial-1.0.0** (pass 154 Soft Adjust; supersedes pass-153 MIT) |
| Delivery split | **P1** — LICENSE only |
| Public flip in this guide | **Forbidden** |
| Freeze | Guide 09 override honesty **retained** |
| Marketing label | Source-available / non-commercial — **not** OSI open source |

---

## Acceptance criteria (Implement)

- [x] Root `LICENSE` exists with **verbatim** PolyForm Noncommercial 1.0.0 text + pinned copyright/notice  
- [x] `docs/PUBLIC_FLIP_CHECKLIST.md` gate 6 honest (PolyForm-NC present; flip still separate)  
- [x] README / GETTING_STARTED / INTERVIEW: LICENSE present; **source-available / non-commercial** honesty; no MIT/OSI-open-source mislabel  
- [x] VISION §9 public-flip still `[ ]`; freeze still `[x]` with override honesty  
- [x] Verification commands pass; no ranking/code changes  

---

## Ordered step checklist

### Phase A — Anchor

- [x] **A1.** Confirm `test ! -f LICENSE` before create (or stop if unexpected LICENSE already exists — escalate Tom).  
- [x] **A2.** Confirm freeze surfaces still say **frozen (Tom override)** / n=44 delta 0 (no regression).  
- [x] **A3.** Confirm VISION §9 public-flip is `[ ]` before edits.  
- [x] **A4.** Fetch official PolyForm-NC 1.0.0 text (polyformproject.org or polyform-licenses tag `1.0.0`) for verbatim copy.

### Phase B — Add PolyForm-NC LICENSE

- [x] **B1.** Create root `LICENSE` with **verbatim** PolyForm Noncommercial 1.0.0 body; include copyright/notice `Copyright (c) 2026 Tom Chacko` as required by the license’s notice practice.  
- [x] **B2.** `test -f LICENSE` and spot-check title line includes `PolyForm Noncommercial License 1.0.0` (not `MIT License`).

### Phase C — Honesty Align (LICENSE only)

- [x] **C1.** Update `docs/PUBLIC_FLIP_CHECKLIST.md` gate 6 + explicit non-claims: LICENSE Met ≠ public flip; license is PolyForm-NC not MIT.  
- [x] **C2.** Thin updates: README / GETTING_STARTED / INTERVIEW — LICENSE present; **source-available / non-commercial**; public flip still open; commercial contact.  
- [x] **C3.** VISION: optional §9 public-flip **prose** note LICENSE Met (PolyForm-NC); **checkbox stays unchecked**.  
- [x] **C4.** Grep: no “MIT” as current license claim; no OSI “open source” as the license claim; no “public flip ready” / “v1 Done”; freeze override honesty intact.

### Phase D — Stop

- [x] **D1.** No ranking/eval/fixture code; no Guide 10b; no §9 public-flip tick.  
- [x] **D2.** Stop for Review (after Ready-check → Implement authorize).

---

## Verification / Definition of Done

```bash
# From mechanic_rag/
test -f LICENSE
head -n 5 LICENSE   # expect PolyForm Noncommercial License 1.0.0 (not MIT)

rg -n 'LICENSE|PolyForm|Noncommercial|MIT|open source|source-available|public flip|v1 Done|frozen \(Tom override\)' \
  LICENSE docs/PUBLIC_FLIP_CHECKLIST.md docs/VISION.md \
  README.md GETTING_STARTED.md INTERVIEW.md evals/MODEL_FREEZE_STATUS.md

# Must find: PolyForm-NC LICENSE present; source-available / non-commercial honesty;
#   public flip still open / §9 public-flip unchecked; freeze Tom override
# Must NOT find as positive claims: MIT as current license; OSI open source as license;
#   public flip ready; v1 Done from Guide 10a; earned CE lift

rg -n '^- \[ \] Public flip' docs/VISION.md   # must still match unchecked
rg -n '^- \[x\] Formal embed/CE' docs/VISION.md  # freeze still checked
```

**DoD (Implement):** Root PolyForm-NC `LICENSE` present (verbatim); gate 6 honest; LICENSE-absent claims removed; source-available / non-commercial honesty present; §9 public-flip unchecked; freeze honesty intact; no ranking code.

**DoD (this Soft Adjust Write):** Guide retargeted MIT → PolyForm-NC; steps / DoD / blast / edges updated; **no** Implement; **no** LICENSE file created.

---

## Blast radius and risks

| Risk | Angle | Mitigation |
|------|-------|------------|
| Auto public flip with LICENSE | Marketing | P1 soft pin; verification requires §9 unchecked |
| Mislabel as OSI open source / MIT | Recruiter / legal honesty | Soft pins + C4 grep |
| Paraphrased LICENSE body | Legal fidelity | Verbatim official text only |
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
| `LICENSE` already exists (e.g. accidental MIT) | Stop; compare to PolyForm-NC pin; escalate Tom |
| Temptation to check §9 public flip | **Hard fail** Review |
| Temptation to badge “Open Source” | **Hard fail** — use source-available / non-commercial |
| Temptation to run full flip checklist as DoD | Out of Met — Guide 10b |
| Tom changes copyright string | Amend soft pin before Implement |
| Secrets found while editing docs | Do not commit secrets; fail closed |

---

## Stop conditions

- Soft Adjust Write: this guide retargeted; handoff Results filled; no Implement; no LICENSE file.  
- Implement (later): Phases A–D DoD met; LICENSE Met (PolyForm-NC); public flip **not** Met.  
- **No** Guide 10b without new authorize.

---

## Soft Adjust changelog (pass 154)

- LICENSE pin: MIT → **PolyForm Noncommercial 1.0.0** (`PolyForm-Noncommercial-1.0.0`).  
- Honesty: require **source-available / non-commercial** (not OSI open source).  
- Body source: official PolyForm text (not AI KB MIT peer).  
- File renamed from `…_mit_license_packaging.md` → `…_polyform_nc_license_packaging.md`.

---

## Ready for Ready-check?

**Yes** — Soft Adjust complete; PolyForm-NC + P1 locked; placements pinned. Residual craft: exact README commercial-contact sentence at Implement. Re-run Ready-check before Implement (prior MIT Ready score is stale).
