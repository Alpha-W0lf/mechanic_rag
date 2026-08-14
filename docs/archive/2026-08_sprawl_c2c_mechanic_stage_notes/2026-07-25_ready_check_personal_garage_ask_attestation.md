> **ARCHIVED** — moved under Workflow OS documentation sprawl reform.
> Do not treat this file as living SSOT.
> Living successor: `docs/VISION.md` · `docs/ARCHITECTURE.md` · living guides under `docs/dev_guides/`
> Batch: `2026-08_sprawl_c2c_mechanic_stage_notes`
> Date: 2026-08-13
# Ready check — Personal garage ask attestation

**Date:** 2026-07-25  
**Repo:** `mechanic_rag`  
**Mode:** multi-repo awareness; primary `mechanic_rag`  
**Stage:** Ready check before code  
**Guide:** `docs/dev_guides/2026-07-25_dev_guide_personal_garage_ask_attestation.md`  
**Verdict:** **Go 8.7 / 10** — Implement authorized only after Tom says **Implement** (Ready stage stops here)

### Declare

| Item | Value |
|------|-------|
| Will write | This Ready note · guide §12 locks · living context |
| Will **not** | Implement · live ask · UI · multimodal · reopen model freeze |

---

## Locked decisions (Tom 2026-07-25)

| Decision | Locked |
|----------|--------|
| Met vehicle | **`cat:2015-triumph-street-triple`** |
| Attestation shape | **Live HTTP required** for Met (not unit-only) |
| Question | **Sump drain plug torque** (grounded) |
| New vitest | **No** (reuse Guide 15 Soft Adjust ask units) |
| GETTING_STARTED | **Yes** — thin Triumph curl on Implement |
| Ask path | Existing `POST /api/ask` only — no CLI / no parallel route |

---

## Readiness scores (0–10)

| Track | Score | Why not 10 |
|-------|-------|------------|
| **Guide / DoD clarity** | **9.2** | Executable; grounded question evidenced. Soft: Implement must record JSON outcome carefully without dumping OEM into git. |
| **Product ask stack (already built)** | **9.0** | Hybrid → RRF → section dedup → CE → Ollama is live for fixtures + Guide 15 synthetic. Soft: **garage live ask not yet run**. |
| **Garage corpus / index** | **9.0** | Emit + ingest Met; Triumph **1886** chunks verified this Ready. Soft: disk headroom thin; PDF extract quality varies. |
| **Operator env for Implement** | **7.5** | Ollama models present (`nomic-embed-text`, `gemma4:e2b`); `web/.env.local` present; Postgres answers SQL. **Next `:3000` was down** at Ready — Implement must start `pnpm dev` (+ Compose if needed). |
| **Blast radius / rollback** | **9.0** | Curl + docs only expected; zero product-code default. Rollback = revert docs. Soft: accidental UI packaging temptation. |
| **Edge cases / honesty** | **8.8** | `insufficient_evidence` OK; 404 unknown; no fixture leak assert. Soft: answered≠correct; no garage goldens. |
| **Overall Implement readiness** | **8.7** | Go — blocked only by Next bring-up + Tom Implement authorize. |

**Not Go would require:** guide rewrite, Met vehicle ambiguity, or requiring model/CE reopen in this slice.

---

## Context ↔ guide alignment

| Check | Status |
|-------|--------|
| Ingest Met + Review Pass | Yes |
| Guide reuses `/api/ask` (no fork) | Yes |
| Non-goals match portfolio M0 | Yes |
| Model freeze left alone | Yes (`evals/MODEL_FREEZE_STATUS.md`) |
| Ask ≠ dual-product Done | Explicit |

---

## Blast radius / rollback

| Change surface | Risk | Rollback |
|----------------|------|----------|
| Live curl | None to code | N/A |
| GETTING_STARTED one curl | Doc only | Revert line |
| Accidental UI edit | Product surface | Reject in Review — **out of Met** |
| Accidental model env change | Ranking honesty | Unset; do not commit |

---

## Edge cases planned (from guide)

Unknown vehicle → 404 · empty hits → `insufficient_evidence` Met · answered requires scoped citations · FORCE_RRF_ONLY unset · env gap → stop without fake Met.

---

## Refinements before Implement?

**None required for Go.** Optional later (not this slice): multi-vehicle smoke, UI garage picker, garage goldens, chunk-overlap experiment, CE lift revisit.

---

## Implement preflight (for next stage — do not run in Ready)

```bash
# Confirm index
psql "$DATABASE_URL" -c "SELECT COUNT(*) FROM chunks WHERE vehicle_id='cat:2015-triumph-street-triple';"
# Compose if needed; Next
cd web && pnpm dev
curl -s localhost:3000/api/health
curl -s -X POST localhost:3000/api/ask \
  -H 'content-type: application/json' \
  -d '{"vehicle_id":"cat:2015-triumph-street-triple","question":"What is the sump drain plug torque for the Street Triple?"}'
```

---

## Stop

**Ready Go 8.7/10.** No implementation in this stage. Wait for Tom: **Implement**.
