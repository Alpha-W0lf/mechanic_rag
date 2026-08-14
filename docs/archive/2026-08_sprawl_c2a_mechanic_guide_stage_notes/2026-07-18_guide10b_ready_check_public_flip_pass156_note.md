> **ARCHIVED** — moved under Workflow OS documentation sprawl reform.
> Do not treat this file as living SSOT.
> Living successor: `docs/dev_guides/2026-07-18_dev_guide_10b_public_flip_packaging.md` · `docs/VISION.md` · `docs/ARCHITECTURE.md`
> Batch: `2026-08_sprawl_c2a_mechanic_guide_stage_notes`
> Date: 2026-08-13

# Ready-check note — Mechanic Guide 10b public flip (pass 156)

**Date:** 2026-07-18  
**Repo:** `mechanic_rag`  
**Stage:** Ready check before code  
**Guide:** `docs/dev_guides/2026-07-18_dev_guide_10b_public_flip_packaging.md`  
**Context:** `docs/2026-07-18_public_flip_dry_run_context_summary.md`  
**Handoff:** `second_brain/docs/2026-07-18_spoke_mechanic_ready_public_flip_pass156_handoff.md`  
**Locks:** **A** (standing Implement after Ready evidence) · **S2** (fail-closed + GETTING_STARTED; health/ask when env up)

## Call

**READY for Implement** under lock **A** (this Ready note attaches fail-closed OK + honesty greps + S2 attestation). **Do not Implement in this stage.** Hub may authorize Implement on next fan-in without a fresh Tom chat.

Implement (when started) ticks VISION §9 public flip + banner Align for **fixtures-only** flip / “v1 Done” marketing, preserving freeze-override + PolyForm-NC honesty.

### Implement readiness

| Track | Score | Why not 10 |
|-------|-------|------------|
| Guide 10b public flip packaging | **9.2 / 10** | Multi-surface banner craft (“v1 Done” vs fixtures-only wording) across README / GETTING_STARTED / INTERVIEW / VISION / ARCHITECTURE / PUBLIC_FLIP gate 5. Anti-mislabel residual at Implement (no earned CE lift; no OSI/MIT). S2 health/ask **env gap** this Ready (Next `:3000` unreachable; Compose Postgres up) — attestation + fail-closed Met; runtime smoke deferred to Implement if env up, else re-note gap. |

**Not inflated:** Locks A/S2 pinned; dry-run green; §9 still unchecked; blast/rollback clear; docs-only scope.

### Alignment (context ↔ guide ↔ live truth)

| Check | Status |
|-------|--------|
| Locks A / S2 | **Aligned** |
| Fail-closed dry-run | **Green** this Ready |
| Freeze override / n=44 delta 0 | **Aligned** — must retain |
| PolyForm-NC / source-available | **Aligned** — LICENSE present; must retain |
| VISION §9 public flip pre-Implement | **Verified** — `[ ]` |
| Guide checklist unchecked | **Correct** for Ready |
| Fixtures-only / deferred themes non-blocking | **Pinned** |

### Evidence attached this Ready-check (Phase A)

| Item | Result |
|------|--------|
| **A1** fail-closed | `python3 scripts/checks/public_fail_closed.py fixtures` → `OK public fail-closed check (.../fixtures)` · **exit 0** |
| **A2** honesty | §9 public flip `[ ]`; freeze `[x]` Tom override; MODEL_FREEZE / README / GETTING_STARTED cite n=44 delta **0**; PolyForm-NC + source-available on README/GETTING_STARTED/`LICENSE` |
| **A3** S2 GETTING_STARTED | Steps 1–8 re-read; path still Compose → env → Ollama → ingest → fail-closed → web → health/ask → eval smoke; footguns unchanged |
| **A4** health/ask | **Env gap** — `localhost:3000/api/health` unreachable (HTTP 000). Compose `postgres` **Up (healthy)** on `5433`. Did **not** fake ask smoke. |
| **A5** secrets | `git ls-files .env web/.env.local` empty; both gitignored |

### Blast radius / rollback

**Blast:** VISION §9 + README / GETTING_STARTED / INTERVIEW / ARCHITECTURE banners + `PUBLIC_FLIP_CHECKLIST.md` gate 5 — **docs only**. Not ranking/eval/fixtures/`LICENSE` body.

**Rollback:** Revert flip banner/§9 commits; restore “Not public-flip ready”; leave LICENSE + freeze intact.

### Edge cases (guide covers)

- Fail-closed red → hard stop  
- Env gap → allowed under S2 with attestation (recorded)  
- CE lift / OSI open source at flip → hard fail  
- Secrets in git → fail closed  

### Refinements still required before Implement?

**None blocking.** Soft: prefer health/ask if Next is up at Implement; else re-record env gap.

### Explicit non-claims (this stage)

- No Implement started  
- No §9 public-flip tick  
- No earned CE lift · No OSI open source mislabel  
- No LICENSE / freeze honesty change  

### Stop

Ready DoD Met. Under lock **A**, Implement is authorized once hub/spoke starts Implement stage — still **wait** for that stage handoff; do not silent-flip from Ready alone.
