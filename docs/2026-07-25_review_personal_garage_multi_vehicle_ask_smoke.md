# Review — Personal garage multi-vehicle ask smoke

**Date:** 2026-07-25  
**Repo:** `mechanic_rag`  
**Mode:** multi-repo awareness; primary `mechanic_rag`  
**Stage:** Review implementation — **Pass**  
**Guide:** `docs/dev_guides/2026-07-25_dev_guide_personal_garage_multi_vehicle_ask_smoke.md`  
**Implement:** Met (S2000 + YXZ + Transit live HTTP)

### Declare

| Item | Value |
|------|-------|
| Will write | This review · living context · guide status |
| Will **not** | UI packaging · golden suite · multimodal · model reopen |

---

## Verdict

**Shippable as-is (Review Pass)** for fleet personal-garage ask smoke (remaining three vehicles).

All three Met vehicles returned `outcome=answered` with citations scoped only to the asked `cat:` id. Zero product code. Guide 15 regressions green. GETTING_STARTED curls added. Triumph prior Met unchanged.

---

## DoD vs evidence

| Gate | Result |
|------|--------|
| Existing `/api/ask` only | **Pass** |
| SQL precheck | **Pass** (3760 / 2282 / 10315 chunks) |
| HTTP matrix (3 vehicles) | **Pass** (`answered` ×3) |
| Citation tenancy | **Pass** (no fixture / cross-`cat:` leak) |
| Tests | **Pass** (vitest 4 · pytest 2) |
| Docs honesty | **Pass** |
| Non-goals (UI / goldens / friend Done) | **Honored** |

---

## Findings

| ID | Severity | Finding |
|----|----------|---------|
| R1 | Soft | S2000 answer mentioned a second torque figure (39 N·m) from another procedure context — still grounded; Met does not require single-number purity |
| R2 | Soft | YXZ correctly distinguished crankcase **10 N·m** vs oil-tank **16 N·m** — good for operator honesty |
| R3 | Soft | Optional unknown-vehicle 404 (C5) not run — Guide 15 covers; non-blocking |
| R4 | Info | Ask Met ≠ UI picker ≠ garage goldens ≠ friend Drive Done |

**None required** for Review Pass.

---

## Next

1. Rank-2: UI garage vehicle picker (separate Write/Ready/Implement).  
2. Rank-3: garage golden-question set (separate authorize).  
3. Friend vehicle-docs: leave Terminal Ram continue alone; batch-2 after Ram clear.
