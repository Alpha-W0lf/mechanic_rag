> **ARCHIVED** — moved under Workflow OS documentation sprawl reform.
> Do not treat this file as living SSOT.
> Living successor: `docs/VISION.md` · `docs/ARCHITECTURE.md` · living guides under `docs/dev_guides/`
> Batch: `2026-08_sprawl_c2c_mechanic_stage_notes`
> Date: 2026-08-13
# Ready check — Personal garage UI vehicle picker

**Date:** 2026-07-25  
**Repo:** `mechanic_rag`  
**Mode:** multi-repo awareness; primary `mechanic_rag`  
**Stage:** Ready check before code  
**Guide:** `docs/dev_guides/2026-07-25_dev_guide_personal_garage_ui_vehicle_picker.md`  
**Verdict:** **Go 8.5 / 10** — Implement authorized by Tom in-session (Write UI picker + lock + proceed)

### Declare

| Item | Value |
|------|-------|
| Will write | This Ready note · guide locks |
| Will **not** | Skip to goldens · redesign · multimodal |

---

## Locked decisions

| Decision | Locked |
|----------|--------|
| API | `GET /api/vehicles` → `{ vehicles: string[] }` |
| Prefixes | `fixture:%` + `cat:%` |
| Helper | `listAskableVehicles` in `retrievers.ts` (replace unused `listFixtureVehicles`) |
| UI | Fetch on mount; fixture-preferring default; honesty copy |
| Ask | Unchanged |
| Tests | Unit test list helper (mock `query`) |

---

## Readiness scores (0–10)

| Track | Score | Why not 10 |
|-------|-------|------------|
| **Guide / DoD** | **9.0** | Thin, executable. Soft: exact vitest mock style TBD in Implement. |
| **Architecture / DRY** | **8.8** | Clear owner; `listFixtureVehicles` unused — safe replace. Soft: future prefixes need another guide. |
| **Blast radius** | **8.5** | Touches public home copy + new route. Soft: clone reviewers see `cat:` only if present locally. |
| **Edge cases** | **8.3** | Fetch fail / empty table planned. Soft: no E2E browser automation in Met. |
| **Operator env** | **8.2** | Next+Compose already proven for ask Met. Soft: must re-verify vehicles curl live. |
| **Overall** | **8.5** | Go — Implement next. |

---

## Refinements before Implement?

**None required.**

---

## Stop

**Ready Go 8.5/10.** Proceed to Implement (Tom authorized).
