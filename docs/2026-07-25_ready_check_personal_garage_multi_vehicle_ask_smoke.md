# Ready check — Personal garage multi-vehicle ask smoke

**Date:** 2026-07-25  
**Repo:** `mechanic_rag`  
**Mode:** multi-repo awareness; primary `mechanic_rag`  
**Stage:** Ready check before code  
**Guide:** `docs/dev_guides/2026-07-25_dev_guide_personal_garage_multi_vehicle_ask_smoke.md`  
**Verdict:** **Go 8.6 / 10** — Implement only after Tom says **Implement** (Ready stops here)

### Declare

| Item | Value |
|------|-------|
| Will write | This Ready note · guide §12 locks · living context |
| Will **not** | Implement · live ask · UI · goldens · multimodal · model freeze reopen |

---

## Locked decisions (Tom 2026-07-25 Prioritize + Ready)

| Decision | Locked |
|----------|--------|
| Met vehicles | `cat:2003-honda-s2000` · `cat:2021-yamaha-yxz1000r-ss-se` · `cat:2016-ford-transit-350` |
| Triumph | Already Met — optional re-smoke only |
| Attestation | **Live HTTP required** (not unit-only) |
| Questions | Torque questions in guide §2 (S2000 33 lbf·ft / 45 N·m; YXZ 10 N·m; Transit 20 lb·ft / 27 Nm) |
| New vitest | **No** — reuse Guide 15 ask units |
| GETTING_STARTED | **Yes** — thin additional garage curls on Implement |
| Ask path | Existing `POST /api/ask` only |
| UI / goldens | **Out of Met** |

---

## Readiness scores (0–10)

| Track | Score | Why not 10 |
|-------|-------|------------|
| **Guide / DoD clarity** | **9.1** | Executable matrix + grounded Gold evidence. Soft: Implement must re-verify SQL chunk counts (Compose was down at Write). |
| **Product ask stack** | **9.0** | Same path as Triumph Met. Soft: three live asks not yet run; Transit may be slower. |
| **Garage corpus / index** | **8.8** | Fleet ingest Met historically (18243 chunks). Soft: **Compose down at Prioritize/Write** — index presence not re-attested this Ready; must confirm before curls. |
| **Operator env for Implement** | **7.3** | Models + `.env.local` historically present; **Compose down** at Ready evidence; Next may be down — Implement bring-up required. Parallel LEMON Ram continue uses CPU/disk lightly OK for ask. |
| **Blast radius / rollback** | **9.2** | Curl + docs default; zero product code. Soft: UI temptation / accidental env ablation flag. |
| **Edge cases / honesty** | **8.7** | `insufficient_evidence` Met; tenancy asserts; fallbacks listed. Soft: answered ≠ correctness; no goldens yet. |
| **Overall Implement readiness** | **8.6** | Go — blocked by stack bring-up + Tom Implement authorize. |

**Not Go would require:** Met vehicle ambiguity, requiring UI in Met, or forcing model/CE reopen.

---

## Context ↔ guide alignment

| Check | Status |
|-------|--------|
| Prioritize Rank-1 = this guide | Yes (living context locked) |
| Reuses `/api/ask` (no fork) | Yes |
| Non-goals match Rank-2/3 park | Yes |
| Grounded questions evidenced in Gold text | Yes (Write-time paths) |
| Friend Drive / multimodal left alone | Yes |

---

## Blast radius / rollback

| Change surface | Risk | Rollback |
|----------------|------|----------|
| Three live curls | None to code | N/A |
| GETTING_STARTED curls | Doc only | Revert |
| Accidental UI / `listVehicles` change | Product surface | Reject — out of Met |
| Accidental `MECHANIC_FORCE_RRF_ONLY=1` | Ranking honesty | Unset; do not commit |

---

## Edge cases planned

Unknown vehicle → 404 · empty hits → `insufficient_evidence` Met · answered requires scoped citations · FORCE_RRF unset · env gap → stop · no cross-`cat:` citation leak · do not start batch-2 download during Ram.

---

## Refinements before Implement?

**None required for Go.** Optional later: UI picker (Rank-2), garage goldens (Rank-3).

---

## Implement preflight (next stage — do not run in Ready)

```bash
docker compose up -d
# confirm DATABASE_URL → 5433
psql "$DATABASE_URL" -c "SELECT vehicle_id, count(*) FROM chunks WHERE vehicle_id LIKE 'cat:%' GROUP BY 1 ORDER BY 1;"
cd web && pnpm dev
curl -s localhost:3000/api/health
# then three curls from guide §11
```

---

## Stop

**Ready Go 8.6/10.** No implementation in this stage. Wait for Tom: **Implement**.
