# Dev guide — Personal garage multi-vehicle ask smoke

**Date:** 2026-07-25  
**Repo:** `mechanic_rag`  
**Work item:** Prove the other three ingested personal-garage `cat:` vehicles are queryable via existing `POST /api/ask` (fleet ask smoke after Triumph Met)  
**Stage that authored this:** Write dev guide  
**Status:** **Implement Met + Review Pass** (2026-07-25) · Ready was Go 8.6/10  
**Depends on:** Garage emit **Review Pass** · private-gold ingest **Review Pass** · Triumph ask attestation **Review Pass**  
**Context SSOT:** `docs/2026-07-25_mechanic_rag_orientation_vehicle_docs_wiring_context_summary.md`  
**Prior thin ask guide:** `docs/dev_guides/2026-07-25_dev_guide_personal_garage_ask_attestation.md`  
**Lens:** AI eng (RAG grounding / vehicle tenancy) + backend (HTTP contract) + portfolio honesty

### Declare (Implement)

| Item | Value |
|------|-------|
| Mode | multi-repo awareness; primary `mechanic_rag` |
| Will write | Guide checkoffs · GETTING_STARTED · living context · Review |
| Will **not** | UI packaging · golden suite · multimodal · friend Drive · new ask CLI |

---

## 1. Objective

Close the **fleet** consumer claim for personal garage: not only Triumph, but the other three indexed `cat:` vehicles answer (or honestly refuse) through the **same** product ask path.

```text
indexed cat: vehicles in Compose Postgres
  → for each Met vehicle_id:
      POST /api/ask { vehicle_id, question }
        → vehicleExists → embed → vehicle-scoped hybrid retrieve
        → RRF → section dedup → CE (or degrade)
        → answered + DB citations  OR  insufficient_evidence
```

**Success signal (Implement Met):**

1. Stack up: Compose Postgres (garage already indexed) + Next (`pnpm dev`) + Ollama **embed** + Ollama **generator**.  
2. For **each** of the three Met vehicles below, `POST /api/ask` returns **HTTP 200** with contract-valid body:  
   `outcome` ∈ {`answered`, `insufficient_evidence`}.  
3. If `answered`: `citations.length ≥ 1` and **every** `citations[].vehicle_id` equals the asked `vehicle_id` (no `fixture:` leak; no cross-garage leak).  
4. If `insufficient_evidence`: counts as Met for that vehicle (same honesty as Triumph / Guide 15).  
5. SQL precheck: each Met vehicle has chunks ≫ 0 before ask.  
6. Regression: Guide 15 Soft Adjust ask unit tests stay green; **no** new ask orchestration module / CLI.  
7. Docs honesty: fleet ask smoke Met ≠ UI picker Met ≠ golden-suite Met ≠ friend Drive Done ≠ multimodal Met.

**Out of Met:** UI vehicle selector · golden eval pack · Triumph re-smoke required · `mecharag ask` CLI · multimodal M1+ · CE/embed model changes · inventing parallel handleAsk wrappers · friend Drive share.

---

## 2. Locked Met vehicles + grounded questions

| `#` | `vehicle_id` | Recommended question | Write-time Gold evidence (path under `$HOME/var/mechanic_garage/gold/`) |
|-----|--------------|----------------------|------------------------------------------------------------------------|
| 1 | `cat:2003-honda-s2000` | What is the engine oil drain bolt torque on the S2000? | `cat_2003-honda-s2000/…/owners_manual_p00163.txt` — “Tighten it to: **33 lbf.ft (45 N.m**, 4.6 kgf.m)” |
| 2 | `cat:2021-yamaha-yxz1000r-ss-se` | What is the engine oil drain bolt tightening torque on the YXZ1000R? | `cat_2021-yamaha-yxz1000r-ss-se/…/owners_manual_p00149.txt` — “Engine oil drain bolt: **10 N·m** (1.0 kgf·m, 7.4 lb·ft)” |
| 3 | `cat:2016-ford-transit-350` | What is the oil pan drain plug torque on the Transit? | `cat_2016-ford-transit-350/…/service_manual_p01322.txt` — “Torque: **20 lb.ft (27 Nm)**” |

**Triumph** (`cat:2015-triumph-street-triple`) already Met (25 Nm sump drain) — **optional** regression curl only; not required for this guide’s Met.

**Fallback questions** (if primary yields chronic `insufficient_evidence` and Tom Ready-locks a swap):

| Vehicle | Fallback |
|---------|----------|
| S2000 | Steps to remove the engine oil drain bolt and oil filter (owners oil-change procedure) |
| YXZ | Steps in “To change the engine oil” (owners maintenance) |
| Transit | Confirm oil pan drain plug removal appears in engine oil service procedure (procedure-shape; torque still preferred) |

Prefer torque questions for short, checkable answers. Prefer `answered` with citations, but **`insufficient_evidence` remains Met**.

---

## 3. DRY / architecture constraints (binding)

1. **Reuse owners — do not fork:**  
   - `web/src/app/api/ask/route.ts`  
   - `web/src/server/ask.ts` (`handleAsk`)  
   - `web/src/server/retrievers.ts` (`WHERE vehicle_id = $1`)  
   - `web/src/server/citations.ts`  
   - `contracts/ask_request.schema.json` / `ask_response.schema.json`  
2. **No parallel path:** Do not add `mecharag ask`, `/api/garage-ask`, or a Python ask orchestrator. Curl (or existing thin UI typed IDs) only.  
3. **Reuse Guide 15 regression tests** — do not invent a second ask unit plane unless Ready explicitly locks hybrid fallback when HTTP cannot run. **Prefer live HTTP** (same reason as Triumph guide).  
4. **Ask does not re-check `gold_status`:** Rights are ingest-time. Query-time tenancy is `vehicle_id` + `vehicles` row.  
5. **UI stays fixture-default this slice:** `web/src/app/page.tsx` still hardcodes fixtures; `listVehicles` still filters `fixture:%`. Rank-2 backlog owns picker.  
6. **Frozen models:** `nomic-embed-text` @ 768; generator per `.env.example`; CE frozen.  
7. **Leave `MECHANIC_FORCE_RRF_ONLY` unset** for Met.  
8. **M0 only:** text citations.  
9. **Plain English** in new docs (no Soft Adjust nicknames as primary vocabulary).

---

## 4. References (paths only)

- Context (Prioritize locks): `docs/2026-07-25_mechanic_rag_orientation_vehicle_docs_wiring_context_summary.md`  
- Triumph ask Met: `docs/dev_guides/2026-07-25_dev_guide_personal_garage_ask_attestation.md`, `docs/2026-07-25_review_personal_garage_ask_attestation.md`  
- Ingest Met: `docs/2026-07-25_review_personal_garage_private_gold_ingest.md`  
- Ask product: `docs/dev_guides/2026-07-12_dev_guide_01_hybrid_rrf_ce_ask_path.md`  
- Synthetic ask plane: `docs/dev_guides/2026-07-19_dev_guide_15_soft_adjust_private_gold_ask_eval.md`  
- Code: `web/src/server/ask.ts`, `retrievers.ts`, `citations.ts`, `web/src/app/api/ask/route.ts`, `web/src/app/page.tsx`  
- Tests: `web/src/server/__tests__/ask_soft_adjust_private_gold.test.ts`, `tests/test_soft_adjust_ask_plane.py`  
- Operator: `GETTING_STARTED.md`, `.env.example`  
- Live Gold root: `$HOME/var/mechanic_garage/gold` (4 `cat_*` dirs)

---

## 5. Evidence already on disk (Write-time — re-verify at Implement)

| Fact | Evidence (2026-07-25) |
|------|------------------------|
| Fleet Gold on disk | `cat_2003-honda-s2000`, `cat_2015-triumph-street-triple`, `cat_2016-ford-transit-350`, `cat_2021-yamaha-yxz1000r-ss-se` |
| Prior ingest SQL | 4 `cat:` vehicles · 13 documents · **18243** chunks |
| Triumph ask Met | `answered`, 25 Nm, 3 scoped citations |
| Grounded torque text (S2000 / YXZ / Transit) | §2 table — owners/service page units present in Gold |
| UI garage list | **Not** present — curl Met |
| Compose at Write | May be **down** — Implement must `docker compose up -d` |

Do **not** claim current SQL chunk counts at Implement without re-querying.

---

## 6. Operator preconditions

| Precondition | Check |
|--------------|-------|
| Garage ingest Met | 4 `cat:` vehicles present |
| Compose | `docker compose up -d`; `DATABASE_URL` → host **5433** |
| Next env | `web/.env.local` from `.env.example` |
| Ollama embed | `nomic-embed-text` |
| Ollama generator | `OLLAMA_MODEL` pulled |
| Next | `cd web && pnpm install && pnpm dev` → `:3000` |
| Health | `curl -s localhost:3000/api/health` OK |
| Ablation | `MECHANIC_FORCE_RRF_ONLY` **unset** |

**Env gap honesty:** If Compose/Next/Ollama cannot run, Implement records an **env gap** and stops — do **not** claim fleet ask Met from unit tests alone unless Tom Ready-locks a hybrid fallback.

---

## 7. Ordered Implement checklist

### A. Preconditions / SQL

- [x] **A1.** Confirm each Met vehicle chunk count ≫ 0:

```bash
psql "$DATABASE_URL" -c "SELECT vehicle_id, count(*) FROM chunks WHERE vehicle_id LIKE 'cat:%' GROUP BY 1 ORDER BY 1;"
```

- [x] **A2.** Confirm `vehicles` row exists for each Met `vehicle_id`.  
- [x] **A3.** Health endpoint OK.  
- [x] **A4.** Business rule (no new helper expected): reuse `handleAsk` only; Met = three live HTTP asks + citation tenancy.

### B. Code

- [x] **B1.** Default: **zero product-code changes**.  
- [x] **B2.** Only if a contract bug blocks Met: smallest fix + test — do not expand UI. *(N/A — no code change)*

### C. Live HTTP matrix

- [x] **C1.** S2000 curl → save `/tmp/mechanic_garage_ask_s2000.json`.  
- [x] **C2.** YXZ curl → save `/tmp/mechanic_garage_ask_yxz.json`.  
- [x] **C3.** Transit curl → save `/tmp/mechanic_garage_ask_transit.json`.  
- [x] **C4.** For each response: assert `outcome` ∈ {`answered`,`insufficient_evidence`}; if answered, all citation `vehicle_id`s match request.  
- [ ] **C5.** Optional: one unknown `vehicle_id` → 404 (Guide 15 already covers; non-blocking).

### D. Regression + docs

- [x] **D1.** Guide 15 vitest + `tests/test_soft_adjust_ask_plane.py` green.  
- [x] **D2.** Thin GETTING_STARTED note: three additional garage curls (or pointer to this guide’s matrix).  
- [x] **D3.** Update living context + this guide Implement evidence table.  
- [x] **D4.** Do **not** claim UI Met or friend Drive Done.

### Implement evidence (2026-07-25)

| Item | Result |
|------|--------|
| Health | `{"status":"ready",… postgres:true, ollama:true}` |
| SQL chunks | S2000 **3760** · YXZ **2282** · Transit **10315** · Triumph 1886 |
| S2000 | `answered`; cites **3**; all `cat:2003-honda-s2000`; answer includes **33 lbf.ft (45 N.m)** |
| YXZ | `answered`; cites **4**; all `cat:2021-yamaha-yxz1000r-ss-se`; crankcase drain **10 N·m** (+ tank 16 N·m called out) |
| Transit | `answered`; cites **7**; all `cat:2016-ford-transit-350`; **20 lb.ft (27 Nm)** |
| Fixture / cross leak | **None** |
| Tests | Guide 15 vitest **4 passed**; `test_soft_adjust_ask_plane` **2 passed** |
| Product code | **None** |
| Logs | `/tmp/mechanic_garage_ask_{s2000,yxz,transit}.json` (local; not committed) |

---

## 8. Definition of Done / verification

| Gate | Pass criteria |
|------|----------------|
| HTTP | Three Met vehicles each return 200 + contract-valid body |
| Tenancy | Answered → citations scoped to asked `vehicle_id` only |
| SQL | Chunks ≫ 0 per Met vehicle before ask |
| Tests | Guide 15 ask units green |
| Product code | None required (or documented minimal bugfix only) |
| Docs | GETTING_STARTED / context honesty updated |
| Non-goals | UI / goldens / multimodal / CLI / friend Done **not** claimed |

---

## 9. Blast radius and risks

| Risk | Angle | Mitigation |
|------|-------|------------|
| Compose / Next / Ollama down | Ops | Env-gap stop; no fake Met |
| Cross-vehicle citation leak | RAG safety / portfolio | Fail Met; investigate retriever `WHERE` |
| Transit latency / large context | Operator time | One question only; do not expand to matrix of 10 |
| `insufficient_evidence` on grounded torque | Retrieval quality | Still Met; record honesty; optional fallback question if Ready locks |
| Accidental UI edit | Product surface | Reject in Review — out of Met |
| Disk / Ram LEMON continue competing for CPU | Multi-program | Prefer light ask smoke; do not start batch-2 download |
| Stale index after Gold change | DE | Re-check SQL; re-ingest only if docs missing |

---

## 10. Edge cases

| Case | Handling |
|------|----------|
| Unknown `vehicle_id` | 404 — optional C5 |
| Empty question | Existing 400 behavior |
| Vehicle in Gold but not indexed | Chunks=0 → stop; re-ingest before asking |
| Fixture ids in UI | Irrelevant — curl Met |
| Generator timeout | Record env/runtime gap; do not invent answer |
| Diagnostics flag on | OK for operator; do not commit OEM dumps |

---

## 11. Operator curls (Implement)

```bash
# S2000
curl -s -X POST localhost:3000/api/ask \
  -H 'content-type: application/json' \
  -d '{"vehicle_id":"cat:2003-honda-s2000","question":"What is the engine oil drain bolt torque on the S2000?"}' \
  | tee /tmp/mechanic_garage_ask_s2000.json

# YXZ
curl -s -X POST localhost:3000/api/ask \
  -H 'content-type: application/json' \
  -d '{"vehicle_id":"cat:2021-yamaha-yxz1000r-ss-se","question":"What is the engine oil drain bolt tightening torque on the YXZ1000R?"}' \
  | tee /tmp/mechanic_garage_ask_yxz.json

# Transit
curl -s -X POST localhost:3000/api/ask \
  -H 'content-type: application/json' \
  -d '{"vehicle_id":"cat:2016-ford-transit-350","question":"What is the oil pan drain plug torque on the Transit?"}' \
  | tee /tmp/mechanic_garage_ask_transit.json
```

---

## 12. Ready-check decisions — **LOCKED 2026-07-25 (Go 8.6/10)**

| Decision | Locked |
|----------|--------|
| Met vehicles | All three remaining garage `cat:` ids (§2) |
| Attestation | Live HTTP required |
| Questions | Torque questions in §2 |
| New vitest | No (reuse Guide 15) |
| GETTING_STARTED | Yes — thin additional curls on Implement |
| Ask path | Existing `POST /api/ask` only |
| Triumph re-smoke | Optional, not Met-required |

See `docs/2026-07-25_ready_check_personal_garage_multi_vehicle_ask_smoke.md`.

---

## 13. Next after this guide

1. ~~Ready / Implement~~ **Implement Met**  
2. **Review implementation**  
3. Later Rank-2: UI garage picker · Rank-3: garage goldens — each own guide  

---

## 14. Stop

Implement Met. Review next (or complete in same delivery if authorized).
