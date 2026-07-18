# Context: Public flip (fixtures-only · dry-run first)

**Date:** 2026-07-18  
**Repos:** `mechanic_rag`  
**Status:** **Write complete** — Guide 10b drafted (pass 156); Ready-check next; §9 public flip still `[ ]`  
**Mode last used:** spoke  
**Guide (Write):** `docs/dev_guides/2026-07-18_dev_guide_10b_public_flip_packaging.md`  
**Handoff (Write):** `second_brain/docs/2026-07-18_spoke_mechanic_write_public_flip_pass156_handoff.md`  
**Handoff (Gather):** `second_brain/docs/2026-07-18_spoke_mechanic_gather_public_flip_pass156_handoff.md`  
**Hub:** `second_brain/docs/2026-07-18_prioritize_hub_pass156.md`  
**Checklist:** `docs/PUBLIC_FLIP_CHECKLIST.md`  
**Lens:** Portfolio packaging / marketing honesty (not ranking/ML)

**Prior closed:** Guide 09 freeze-override · Guide 10a PolyForm-NC LICENSE (Aligned / Closed `7c77563`).  
**Tom / hub locks (pass 156):** **A** (standing Implement after Ready evidence) · **S2** (fail-closed + GETTING_STARTED; health/ask when env up).  
**VISION §9 (live):** freeze `[x]` · public flip `[ ]` · LICENSE Met (PolyForm-NC).

---

## Problem

Mechanic’s last VISION §9 build checkbox is **public flip / portfolio “v1 Done.”** Packaging prerequisites are largely Met (freeze override, LICENSE, checklist file, fail-closed path). Flip must **not** silently invent earned CE lift or OSI “open source.” Tom unlocked **intent**; hub still gates Implement on **dry-run evidence** (fail-closed + honesty re-verify; stranger-clone depth TBD).

---

## Acceptance criteria

- [ ] Written path: re-verify PUBLIC_FLIP gates 1–6 with evidence → thin Guide 10b → Ready (attach dry-run) → Tom/hub Implement authorize → tick VISION §9 public flip + banner Align  
- [ ] Freeze honesty unchanged: **Tom override**; n=44 `ce_vs_rrf_ask_delta_hits=0`; **no** earned-lift claim  
- [ ] LICENSE honesty unchanged: PolyForm-NC — **source-available / non-commercial**; **not** OSI open source / **not** MIT  
- [ ] No silent flip in Gather/Write/Ready; no ranking/OEM invent  
- [ ] Deferred PATH_TO_30 themes (second vehicle / wiring) explicitly **non-blocking** for fixtures-only flip narrative  

---

## In scope (this Gather)

- Re-verify gate paths with commands where possible  
- List exact Implement steps for honest §9 public-flip tick  
- Recommend Write shape (Guide **10b**)  
- Context under `mechanic_rag/docs/`  
- Fill handoff Results  

## Out of scope

- Implement / checking VISION §9 public flip this stage  
- LICENSE rewrites · freeze reopen · ranking/eval/fixture changes  
- PrivateGold / Drive / Ford / OEM PDFs  
- Interview-prep VISION boxes (separate initiative)  

---

## Prior art (paths only)

- `docs/PUBLIC_FLIP_CHECKLIST.md` — six gates (post–Guide 10a status)  
- `docs/VISION.md` §9 — public flip unchecked  
- `evals/MODEL_FREEZE_STATUS.md` — Frozen (Tom override); n=44 delta 0  
- `LICENSE` — PolyForm Noncommercial 1.0.0 (`a36303f`)  
- `docs/dev_guides/2026-07-18_dev_guide_10a_polyform_nc_license_packaging.md` — Aligned / Closed  
- `docs/2026-07-18_license_public_flip_path_context_summary.md` — Guide 10a P1 closed; flip open  
- `docs/2026-07-18_path_to_formal_freeze_public_flip_context_summary.md` — freeze closed; LICENSE Met  
- `docs/dev_guides/2026-07-17_dev_guide_06_formal_freeze_packaging.md` — checklist ≠ flip  
- `scripts/checks/public_fail_closed.py`  
- `GETTING_STARTED.md` / `README.md` / `INTERVIEW.md` — still deny public-flip ready / v1 Done  
- Hub pass 156 item #1 — Mechanic public-flip dry-run Gather → Write → Ready → Implement  

---

## Current gate map (honest · pass 156 dry-run)

| # | Gate | Live status (this Gather) | Evidence |
|---|------|---------------------------|----------|
| 1 | Fixtures-only + `public_fail_closed.py fixtures` | **Green this pass** | `python3 scripts/checks/public_fail_closed.py fixtures` → `OK` exit 0 |
| 2 | Stranger-clone `GETTING_STARTED` | **Documented; full clone path not re-run this Gather** | Path exists (Compose → env → Ollama → ingest → fail-closed → web → health/ask). Operator/agent re-verify still required before Implement tick |
| 3 | Honesty (freeze override; no lift theater) | **Honest** | MODEL_FREEZE + README/INTERVIEW/VISION; n=44 delta 0; helps=0/hurts=0 |
| 4 | Formal freeze | **Met** (Guide 09 Path B override) | §9 freeze `[x]` |
| 5 | VISION §9 / banners public flip | **Unchecked** | `- [ ] Public flip…`; README still **Not** public-flip ready |
| 6 | Secrets + LICENSE | **LICENSE Met**; secrets fail-closed path | `test -f LICENSE` PolyForm-NC; `.env` / `web/.env.local` gitignored; not tracked |

**Non-claims this Gather:** Flip not Met · Not OSI open source · Not earned CE lift · Checklist green≠flip.

---

## Exact Implement steps (for later Guide 10b — not this stage)

1. **Preflight dry-run (block tick if red):**  
   - `python3 scripts/checks/public_fail_closed.py fixtures` (must OK)  
   - Confirm `test -f LICENSE` + PolyForm-NC title / source-available honesty  
   - Confirm freeze surfaces still say **Frozen (Tom override)** + n=44 delta **0**  
   - Confirm no tracked `.env` / secrets  
2. **Stranger-clone attestation** (depth per Decision 2): at minimum re-read GETTING_STARTED + note fail-closed green; prefer smoke health/ask if Compose/Ollama available — do not invent vehicle IDs.  
3. **Tick** VISION §9 `- [ ] Public flip…` → `[x]` with prose: fixtures-only public flip; freeze = override not lift; PolyForm-NC ≠ OSI.  
4. **Banner Align** (same delivery): README / GETTING_STARTED / INTERVIEW / VISION status — claim portfolio **fixtures-only** public flip / “v1 Done” **marketing** only with honesty clauses above; update `PUBLIC_FLIP_CHECKLIST.md` gate 5 status date.  
5. **Stop.** No ranking/OEM; no Guide invent beyond flip packaging.

---

## Recommended approach

1. **Do not Implement flip in Gather/Write.**  
2. **Guide 10b written** — `docs/dev_guides/2026-07-18_dev_guide_10b_public_flip_packaging.md` (locks **A** + **S2**).  
3. **Ready-check** must attach dry-run evidence (fail-closed OK + honesty greps; S2 attestation).  
4. **Implement** after Ready Met under standing authorize **A**.  
5. Keep four-way separation: keep ≠ freeze ≠ LICENSE ≠ public flip.

**Guide path:** `docs/dev_guides/2026-07-18_dev_guide_10b_public_flip_packaging.md`

---

## Risks and blast radius

| Risk | Angle | Mitigation |
|------|-------|------------|
| Silent flip without dry-run | Hub lock | Ready/Implement require fail-closed evidence |
| “v1 Done” implies earned CE lift | Interview honesty | Required override + delta 0 sentences on banners |
| “Open source” mislabel | Legal / recruiter | Keep PolyForm-NC / source-available wording |
| Flip implies PrivateGold/Drive done | Scope | Explicit deferred list; fixtures-only narrative |
| Full stranger-clone skipped | Operator quality | Decision 2 — pin minimum DoD |
| Checking flip without Tom intent | Process | Hub pass 156 intent + explicit Implement authorize |

**Blast radius (flip Implement):** VISION §9 row + README / GETTING_STARTED / INTERVIEW / ARCHITECTURE banners + PUBLIC_FLIP checklist gate 5 — **docs only**.

---

## Edge cases

| Case | Behavior |
|------|----------|
| Fail-closed red at Ready/Implement | **Hard stop** — fix fixtures before flip |
| Tom parks flip after Gather | Leave §9 `[ ]`; Guide 10b Write may still draft then Soft Adjust park |
| Stranger-clone full twin unavailable (no Ollama) | Attest fail-closed + documented path; note environment gap; do not fake ask smoke |
| Temptation to claim OSI open source | **Hard fail** |
| Temptation to claim CE lift at flip | **Hard fail** |
| Secrets found in git | Fail closed; stop flip |

---

## Unknowns

| Unknown | How to resolve | Blocking Write? |
|---------|----------------|-----------------|
| Exact stranger-clone depth for DoD | Decision 2 below | Soft (Write can pin default) |
| Whether hub “intent unlock” = Implement authorize after Ready | Decision 1 — prefer Ready → explicit Implement handoff | Blocks Implement only |
| Banner exact “v1 Done” vs “fixtures-only public flip” wording craft | Write soft pin | Soft |

---

## Open decisions (human)

### Decision 1: Implement authorize after dry-run Ready

- **Plain title:** After Guide 10b Ready-check with dry-run evidence, may Implement tick public flip without a new Tom chat lock?
- **In plain terms:** You unlocked flip **intent** at hub. Implement still changes marketing truth on VISION §9.
- **Options:** (A) Standing authorize — Ready Met ⇒ Implement may flip · (B) Require fresh “Implement flip now” after Ready · (C) Park flip indefinitely  
- **Recommendation:** **(A)** standing authorize **only if** Ready note attaches fail-closed OK + honesty greps; else (B).  
- **Reasoning:** Matches hub “dry-run evidence first”; avoids double-gating once evidence exists.  
- **Tradeoffs:** (A) faster; (B) safer if you want last look at banner wording; (C) leaves §9 open forever.  
- **Needs from you:** Lock A, B, or C (or confirm A as default).

### Decision 2: Stranger-clone depth before flip tick

- **Plain title:** How much clone-path re-verify is required before checking public flip?
- **In plain terms:** Gate 2 is documented; full Compose/Ollama/ask smoke is heavier than fail-closed.  
- **Options:** (S1) Fail-closed + GETTING_STARTED checklist attestation only · (S2) S1 + health/ask smoke when env available · (S3) Mandatory full twin clone every flip  
- **Recommendation:** **(S2)** — require S1 always; run health/ask when Compose/Ollama up; if unavailable, note gap and still allow flip only with Tom/hub accept of attestation-only.  
- **Reasoning:** Fail-closed catches corpus legality; ask smoke catches broken stranger path without blocking forever on env.  
- **Tradeoffs:** S1 faster/weaker; S3 strongest/slowest.  
- **Needs from you:** Lock S1/S2/S3 (default S2 if silent).

---

## Evidence opened this pass

- Handoff pass 156; hub pass 156  
- `docs/PUBLIC_FLIP_CHECKLIST.md` (full)  
- `docs/VISION.md` §9; README / GETTING_STARTED / INTERVIEW banners  
- `evals/MODEL_FREEZE_STATUS.md` freeze override pointers  
- `LICENSE` head (PolyForm-NC)  
- `python3 scripts/checks/public_fail_closed.py fixtures` → **OK**  
- `git check-ignore` `.env` / `web/.env.local`; `git ls-files` neither tracked  
- Prior Guide 10a Align / license context summaries  

---

## Honest readiness

- **Gather DoD:** Met (pass 156).  
- **Write DoD:** Met — Guide 10b authored; locks A/S2 pinned; **no** Implement; §9 still `[ ]`.  
- **Ready for Ready-check?** **Yes** — attach fresh fail-closed + honesty greps + S2 attestation.  
- **Not ready** for Implement until Ready Met (then standing authorize A).  
- **Freeze / LICENSE honesty:** unchanged — override ≠ lift; PolyForm-NC ≠ OSI.
