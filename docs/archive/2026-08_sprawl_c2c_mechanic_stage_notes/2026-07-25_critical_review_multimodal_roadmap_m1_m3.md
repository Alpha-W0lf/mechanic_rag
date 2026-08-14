> **ARCHIVED** — moved under Workflow OS documentation sprawl reform.
> Do not treat this file as living SSOT.
> Living successor: `docs/VISION.md` · `docs/ARCHITECTURE.md` · living guides under `docs/dev_guides/`
> Batch: `2026-08_sprawl_c2c_mechanic_stage_notes`
> Date: 2026-08-13
# Critical review — Mechanic multimodal roadmap context (Gather + Refine)

**Date:** 2026-07-25 (~23:50 local)  
**Mode:** multi-repo  
**Stage:** Critical review  
**Slice:** Mechanic RAG multimodal roadmap M1→M3 (docs only)  
**Artifacts in scope:**  
- `mechanic_rag/docs/2026-07-25_mechanic_rag_multimodal_roadmap_m1_m3_context_summary.md` (primary)  
- Pointers: orientation living context · hub dual-program prioritize · VISION §5 / ARCHITECTURE §11  

**Stop:** Findings only — no Write guide · no Implement · no silent remediations beyond optional tiny pointer updates after Pass.

### Declare

| Item | Value |
|------|-------|
| Will write | This review note · optional tiny status pointers if Pass |
| Will **not** | Rewrite architecture · Implement assets · start M1 guide in this stage file |

---

## Verdict

**Pass with nits (P1 must land in Write M1 guide).** The Refine context is staff-credible: staged claims, disk evidence, on-demand default, and anti-mega-guide discipline are right. It is **not** rubber-stamp ready as an Implement blueprint — bronze→page resolution and ask-path latency/timeout are underspecified and would fail a design review if coded from the context alone.

---

## Ranked findings

### P1 — Bronze PDF resolution at ask time is underspecified

**Evidence:** Refine locks “join via bronze path from provenance `redacted_locator` + page.” Ask citations expose `document_id` / `page_*` (`contracts/ask_response.schema.json`). Provenance is on the **documents** row (`mecharag/db_upsert.py` stores `provenance` JSON), not on each citation. Context never names the **lookup sequence**: citation → document row → `redacted_locator` / `source_doc_ids` → `$HOME/var/mechanic_garage/bronze/...` → rasterize page N.

**Risk:** Write/Implement invents a second mapping (filename heuristics) and drifts from Contract 7.2.

**Remediation (smallest):** M1 guide must lock: `resolve_bronze_pdf(vehicle_id, document_id) → Path` via DB provenance (or Gold manifest sidecar), fail soft if missing. Do not parse `document_id` alone as a filesystem path.

### P1 — On-demand rasterize on the ask hot path vs HTTP timeout

**Evidence:** Transit service PDF alone is **6619** pages / ~668 MiB; cold rasterize of one page from a large PDF can be multi-second. Refine notes latency as a tradeoff but does not set a **timeout / degrade policy** for `/api/ask` or `/api/assets`.

**Risk:** First-hit ask hangs or 504s; looks like product breakage though text answer was ready.

**Remediation (smallest):** M1 guide DoD: (a) text answer returns without waiting on rasterize when over budget, **or** (b) asset route does rasterize while ask only joins **cached** paths; pick one. Recommend **(b)** for thin M1: ask joins cache-only; missing → omit visual; optional background warm later (out of M1).

### P1 — Stale Ram health block inside Refine context

**Evidence:** Context § “Friend Ram ops … healthy” still claims orchestrator + `2016:3500` growing. Critical-review ops check found process **dead**, publish failed on DNS, local ZIP kept. (Ops recovery is separate; doc honesty is in scope.)

**Remediation:** Mark that snapshot **stale**; hub/orientation own live ops. Do not treat multimodal context as Ram SSOT.

### P2 — `visual_assets` schema sketch missing `vehicle_id`

**Evidence:** Sketch `{ chunk_id, document_id, page_start, content_type, href }`. Multi-vehicle UI already scopes by vehicle; asset URL must not be cross-vehicle guessable without check.

**Remediation:** Guide requires vehicle_id in resolve path and authz check (`href` includes vehicle_id or server derives from ask session).

### P2 — M2/M3 Write readiness scores optimistic relative to undefined citation rule

**Evidence:** M2 “diagram-only hit” still parked to Write; scores 6.8 / 6.2 say “Yes (design guide).” Acceptable if guides loudly TBD — but scores should not be read as Ready-for-Implement.

**Remediation:** Keep scores; Write guides must open with **TBD gates** table. Do not inflate.

### P2 — DPI 150 unmeasured

**Evidence:** Parked PNG size unknown. Fine for Write; Ready/Implement needs one Triumph page sample.

**Remediation:** Ready check measure before fleet claims.

### P2 — Doc duplication across hub / orientation / prioritize

**Evidence:** Same locks copied in three places. Preferable to single SSOT pointer — not blocking Write.

**Remediation:** Optional Align later; not this stage.

---

## Decision flags

| Flag | Status | Action |
|------|--------|--------|
| Full M1–M3 docs, Implement later | **Locked** (Tom) | Keep |
| M1 on-demand + no Gold rewrite + Triumph-first | **Locked** pending Tom confirm on residual | Confirm in chat; Write may proceed |
| Ask joins **cache-only** vs rasterize-in-ask | **Not locked** — recommend cache-only | Lock in Write M1 |
| Bronze resolve via documents.provenance | **Not locked** — recommend | Lock in Write M1 |
| Author M2/M3 guides after M1 guide | **Locked** direction | Keep |
| Title-only cleanup Gather (friend-docs) | **Locked** next for that track | After/ beside Write M1 |

---

## What is actually strong

- Honest staging (M0 Met ≠ M1–M3) and ban on mega-guide  
- Disk math (Transit / 13k units) driving on-demand — not fashion  
- Locators already paid for on Gold/chunks — anti-rework is real  
- Fail-soft missing assets; CI must not need OEM PNGs  
- Stale Gemini/Supabase plans correctly demoted  

---

## Smallest remediation set (before/during Write M1)

1. **Write M1 guide** must include: bronze resolve via provenance; cache-only join on ask (recommended); vehicle-scoped asset route; timeout/omit policy.  
2. **Update** multimodal context: mark Ram ops snapshot stale; add “Critical review P1s must appear in M1 guide” pointer.  
3. Do **not** re-Gather; do **not** Implement.

**Ready for Write M1 after this review?** **Yes**, if Tom locks residual decisions (cache-only ask join + provenance resolve). Scores unchanged: M1 Write **8.4** still fair; Critical review did not lower below Write threshold once P1s are guide-bound.

---

## QUALITY_STANDARD §5

- [x] Evidence over vibe (schemas, upsert, disk counts, ops log)  
- [x] No silent Implement  
- [x] Findings persisted  
- [x] Smallest remediations named  
- [x] Blast: wrong resolve path / ask hangs / cross-vehicle asset leak  

---

## Ops companion (Ram — not multimodal)

See chat + hub refresh: process died after Drive DNS during publish of `ram:2016:3500`; local ZIP valid; recovery = promote kept ZIP + Terminal `continue` (in flight this session).
