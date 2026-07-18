# Dev Guide 10b — Public flip packaging (fixtures-only)

**Date:** 2026-07-18  
**Repo:** `mechanic_rag`  
**Work item:** Guide 10b — tick VISION §9 **public flip / portfolio “v1 Done”** (fixtures-only) + banner Align; dry-run evidence required  
**Stage that authored this:** Write-dev-guide (pass 156)  
**Status:** **Implemented** 2026-07-18 (Guide 10b fixtures-only public flip) — §9 public flip Met; freeze override + PolyForm-NC honesty retained  
**Ready-check:** `docs/2026-07-18_guide10b_ready_check_public_flip_pass156_note.md` (9.2/10)  
**Handoff (Implement):** `second_brain/docs/2026-07-18_spoke_mechanic_implement_public_flip_pass156_handoff.md`  
**Context SSOT:** `mechanic_rag/docs/2026-07-18_public_flip_dry_run_context_summary.md`  
**Handoff (Ready):** `second_brain/docs/2026-07-18_spoke_mechanic_ready_public_flip_pass156_handoff.md`  
**Handoff (Write):** `second_brain/docs/2026-07-18_spoke_mechanic_write_public_flip_pass156_handoff.md`  
**Handoff (Gather):** `second_brain/docs/2026-07-18_spoke_mechanic_gather_public_flip_pass156_handoff.md`  
**Prerequisite:** Guide 09 freeze-override **Aligned / Closed**; Guide 10a PolyForm-NC LICENSE **Aligned / Closed**; hub pass 156 locks **A** + **S2** · Ready Met under lock A

**Tom / hub locks (pass 156 — do not reopen):**

| Pin | Lock |
|-----|------|
| Implement authorize | **A** — Standing authorize once Ready attaches fail-closed OK + honesty greps (no fresh chat lock required if evidence Met) |
| Stranger-clone depth | **S2** — Always fail-closed + GETTING_STARTED attestation; health/ask **when env is up**; not mandatory full twin (S3) |
| Honesty | Flip ≠ earned CE lift; freeze = Tom override; PolyForm-NC ≠ OSI; LICENSE Met ≠ flip (already Met Guide 10a) |
| Corpus narrative | **Fixtures-only** public flip — PrivateGold / Drive / Ford / second-vehicle deferred themes **non-blocking** |

---

## Objective

Land an **honest fixtures-only public flip**: check VISION §9 public-flip row and Align marketing banners **after** dry-run evidence, **without** inventing CE lift or OSI open-source claims.

1. Ready-check attaches dry-run evidence (fail-closed OK + honesty greps; S2 stranger attestation).  
2. Implement (after Ready Met under lock A): tick §9 public flip; update README / GETTING_STARTED / INTERVIEW / VISION / ARCHITECTURE / PUBLIC_FLIP checklist gate 5.  
3. Preserve Guide 09 freeze-override + Guide 10a PolyForm-NC honesty on every surface touched.  
4. **Stop.** No ranking/OEM invent.

**Success signal (after Implement):** §9 public flip `[x]`; banners claim fixtures-only portfolio flip / “v1 Done” **with** required honesty clauses; a reviewer cannot honestly believe “earned CE lift” or “OSI open source.”

**This Write does not Implement and does not tick §9.**

---

## Learning notes (interview-portable)

1. **Release gate vs feature gate** — Marketing “done” is a separate gate from capability evidence; checklist green ≠ ship claim until humans lock flip.  
2. **Fail-closed corpus checks** — Public repos often use automated scanners for forbidden artifacts (OEM PDFs, private rights) before claiming public readiness.  
3. **Honesty in portfolio packaging** — Freeze-by-override and source-available licenses must survive the flip banner rewrite.  
4. **Attestation vs full twin** — S2 balances operator cost vs confidence: always legal corpus check; runtime smoke when environment allows.

---

## References (paths only)

- `mechanic_rag/docs/2026-07-18_public_flip_dry_run_context_summary.md`
- `mechanic_rag/docs/PUBLIC_FLIP_CHECKLIST.md`
- `mechanic_rag/docs/VISION.md` (§9 public flip — currently `[ ]`)
- `mechanic_rag/evals/MODEL_FREEZE_STATUS.md`
- `mechanic_rag/LICENSE` (PolyForm-NC — do not rewrite)
- `mechanic_rag/GETTING_STARTED.md` / `README.md` / `INTERVIEW.md` / `docs/ARCHITECTURE.md`
- `mechanic_rag/scripts/checks/public_fail_closed.py`
- `mechanic_rag/docs/dev_guides/2026-07-18_dev_guide_10a_polyform_nc_license_packaging.md` (closed)
- `mechanic_rag/docs/dev_guides/2026-07-18_dev_guide_09_tom_freeze_override_packaging.md` (closed)
- `second_brain/docs/2026-07-18_spoke_mechanic_write_public_flip_pass156_handoff.md`
- `second_brain/docs/2026-07-18_prioritize_hub_pass156.md`
- `second_brain/docs/workflow_os/rails/QUALITY_STANDARD.md`

---

## Architecture constraints (binding)

1. **Docs-only.** No ranking, eval, fixture, ingest, PrivateGold, Drive, Ford, OEM code/corpus invent.  
2. **Do not rewrite `LICENSE`.** PolyForm-NC stays; never badge OSI open source / MIT.  
3. **Do not regress freeze honesty.** Keep **Frozen (Tom override)**; n=44 delta **0**; no earned-lift claim.  
4. **Dry-run before tick.** Ready and Implement both require fail-closed OK; Implement blocked if red.  
5. **S2 stranger-clone.** Always fail-closed + GETTING_STARTED attestation; health/ask when Compose/Ollama/Next up; if unavailable, note gap in Ready/Implement note — do not fake ask smoke.  
6. **Fixtures-only flip narrative.** Deferred PATH_TO_30 themes remain open and explicitly non-blocking.  
7. **Standing authorize A.** After Ready Met with attached evidence, Implement may proceed without a new Tom chat lock.  
8. **Do not** edit Guide 09 / 10a closed outcomes except thin cross-links if needed.

---

## Soft pins (binding for Ready / Implement)

| Pin | Locked default |
|-----|----------------|
| VISION §9 public flip | `- [x]` at Implement after Ready Met (Guide 10b) |
| Banner claim | Fixtures-only **public flip** / portfolio **“v1 Done”** marketing — must co-state: freeze = Tom override (not lift); PolyForm-NC = source-available / non-commercial (not OSI / not MIT) |
| Forbidden positive claims | “earned CE lift”; “OSI open source”; “MIT”; implying PrivateGold/Drive/OEM in public git |
| PUBLIC_FLIP gate 5 | Update to flip Met (Guide 10b) after Implement; refresh date |
| PUBLIC_FLIP gates 1–4, 6 | Re-verify honesty; gate 1 evidence = fail-closed OK; gate 6 LICENSE still PolyForm-NC |
| Fail-closed command | `python3 scripts/checks/public_fail_closed.py fixtures` must print `OK` and exit 0 |
| Health/ask (when env up) | Copy README/GETTING_STARTED targets only — `fixture:honda-s2000-demo` + oil drain plug torque question; do not invent IDs |
| Ready evidence attachment | Ready note must record: fail-closed output/exit; honesty greps; S2 attestation (and health/ask result or explicit env gap) |

---

## Locked decisions (do not reopen)

| Decision | Lock |
|----------|------|
| Authorize path | **A** (pass 156) |
| Stranger-clone | **S2** (pass 156) |
| LICENSE family | PolyForm-NC (Guide 10a closed) — out of scope to change |
| Freeze | Guide 09 override honesty retained |

---

## Acceptance criteria (Implement)

- [x] Ready note attaches fail-closed OK + honesty greps + S2 attestation (health/ask or env gap)  
- [x] VISION §9 public flip `[x]` with fixtures-only + honesty prose  
- [x] README / GETTING_STARTED / INTERVIEW / VISION / ARCHITECTURE banners Align (flip Met; no CE-lift / OSI mislabel)  
- [x] `PUBLIC_FLIP_CHECKLIST.md` gate 5 updated; non-claims retain override + PolyForm-NC honesty  
- [x] Verification commands pass; no ranking/code changes  

---

## Ordered step checklist

### Phase A — Ready dry-run (before Implement)

- [x] **A1.** Run `python3 scripts/checks/public_fail_closed.py fixtures` — must OK / exit 0. Attach evidence to Ready note.  
- [x] **A2.** Honesty greps: freeze Tom override + n=44 delta 0; PolyForm-NC / source-available; §9 public flip still `[ ]` pre-Implement.  
- [x] **A3.** S2: attest GETTING_STARTED path still matches reality (read steps 1–8).  
- [x] **A4.** S2 optional runtime: if Compose + Ollama + Next available, run health + one ask from GETTING_STARTED; else record **env gap** (do not fake).  
- [x] **A5.** Confirm `.env` / `web/.env.local` not tracked (`git ls-files`).  
- [x] **A6.** Ready-check score ≥ Ready bar; attach A1–A5 evidence. Under lock **A**, Ready Met ⇒ Implement authorized.

### Phase B — Tick public flip

- [x] **B1.** VISION §9: check public-flip row; prose = fixtures-only flip; freeze = override not lift; PolyForm-NC ≠ OSI.  
- [x] **B2.** VISION status banner: portfolio public flip Met (fixtures-only) while retaining freeze/LICENSE honesty.  
- [x] **B3.** Update `docs/PUBLIC_FLIP_CHECKLIST.md` gate 5 (+ date); keep explicit non-claims.

### Phase C — Banner Align

- [x] **C1.** README — remove “Not public-flip ready”; claim fixtures-only flip / v1 Done marketing **with** honesty clauses.  
- [x] **C2.** GETTING_STARTED Honesty table — Public flip Met (fixtures-only); retain freeze + LICENSE rows.  
- [x] **C3.** INTERVIEW — packaging FAQ: flip Met; still not earned CE lift; still not OSI open source.  
- [x] **C4.** ARCHITECTURE status / deferred rows — public flip Met; LICENSE already Met Guide 10a.  
- [x] **C5.** Grep: no “earned CE lift” / OSI-open-source-as-license positive claims; freeze override intact.

### Phase D — Stop

- [x] **D1.** No ranking/eval/fixture/OEM changes; no LICENSE rewrite.  
- [x] **D2.** Stop for Review (after Implement). Align docs if Review finds soft residuals.

---

## Verification / Definition of Done

```bash
# From mechanic_rag/
python3 scripts/checks/public_fail_closed.py fixtures   # must OK

rg -n '^- \[x\] Public flip' docs/VISION.md
rg -n 'frozen \(Tom override\)|Frozen \(Tom override\)|ce_vs_rrf_ask_delta_hits|PolyForm|source-available|public flip|v1 Done|open source' \
  docs/VISION.md docs/PUBLIC_FLIP_CHECKLIST.md docs/ARCHITECTURE.md \
  README.md GETTING_STARTED.md INTERVIEW.md evals/MODEL_FREEZE_STATUS.md

# Must find: §9 public flip checked; fixtures-only flip / v1 Done with honesty;
#   freeze Tom override + delta 0; PolyForm-NC source-available
# Must NOT find as positive claims: earned CE lift; OSI open source as license; MIT as license
```

**DoD (Ready):** Fail-closed OK + honesty greps + S2 attestation attached; score Ready; §9 still unchecked until Implement.

**DoD (Implement):** Phases B–D Met; verification green; docs-only.

**DoD (this Write):** Guide 10b authored with locks A/S2; steps / DoD / blast / edges; **no** Implement; **no** §9 tick.

---

## Blast radius and risks

| Risk | Angle | Mitigation |
|------|-------|------------|
| Flip without dry-run | Marketing honesty | Phase A hard gate; Ready attaches evidence |
| “v1 Done” ⇒ earned CE lift | Interview | Soft pins + C5 grep |
| OSI / MIT mislabel | Legal / recruiter | Keep PolyForm-NC wording |
| Flip ⇒ PrivateGold done | Scope | Fixtures-only narrative + deferred list |
| Env gap faked as ask smoke | Integrity | Explicit env-gap note; no fake curls |
| Scope into ranking | Blast | Docs-only constraint |

**Blast radius:** VISION §9 + README / GETTING_STARTED / INTERVIEW / ARCHITECTURE banners + `PUBLIC_FLIP_CHECKLIST.md` — **not** ranking/eval/fixtures/`LICENSE` body.

### Rollback

Revert banner/§9 commits; restore “Not public-flip ready” honesty; leave LICENSE + freeze intact.

---

## Edge-case handling

| Case | Behavior |
|------|----------|
| Fail-closed red | **Hard stop** — fix fixtures before Ready Met / Implement |
| Compose/Ollama/Next down | Record env gap; S2 still Met via fail-closed + GETTING_STARTED attestation |
| Temptation to claim CE lift at flip | **Hard fail** |
| Temptation to badge “Open Source” | **Hard fail** — source-available / non-commercial |
| Secrets appear in git | Fail closed; stop flip |
| Tom parks after Write | Soft Adjust park; leave §9 `[ ]` |

---

## Stop conditions

- Write: this guide complete; handoff Results filled; no Implement; §9 still `[ ]`.  
- Ready (later): evidence attached; Ready Met under lock A ⇒ Implement authorized.  
- Implement (later): Phases B–D DoD met; flip Met; freeze/LICENSE honesty intact.

---

## Implement / close

**Implemented** 2026-07-18 under lock A. §9 public flip Met (fixtures-only). S2 health/ask env gap soft-attested. Stop for Review when hub authorizes.
