# Dev guide — Personal garage ask attestation (thin smoke)

**Date:** 2026-07-25  
**Repo:** `mechanic_rag`  
**Work item:** Prove one ingested personal-garage `cat:` vehicle is queryable via existing `POST /api/ask` (retrieval + answer plane)  
**Stage that authored this:** Write dev guide  
**Status:** **Implement Met + Review Pass** (2026-07-25) · Ready was Go 8.7/10  
**Depends on:** Garage emit **Review Pass** · garage private-gold ingest **Implement Met + Review Pass**  
**Context SSOT:** `docs/2026-07-25_mechanic_rag_orientation_vehicle_docs_wiring_context_summary.md`  
**Prior ask plane (synthetic):** Guide 15 Review Pass — `docs/dev_guides/2026-07-19_dev_guide_15_soft_adjust_private_gold_ask_eval.md`  
**Lens:** AI eng (RAG grounding / vehicle tenancy) + backend (HTTP contract) + portfolio honesty

### Declare (Write)

| Item | Value |
|------|-------|
| Mode | multi-repo awareness; implement later in `mechanic_rag` |
| Will write | This guide · living context pointer |
| Will **not** | Implement · Ready scores · UI packaging · multimodal · friend Drive · new ask CLI · CE/embed reopen · golden suite |

---

## 1. Objective

Close the **garage Gold → index → ask** consumer loop for **one** live personal-garage vehicle using the **existing** product ask path:

```text
indexed cat: vehicle in Compose Postgres
  → POST /api/ask { vehicle_id, question }
  → vehicleExists → embed question → vehicle-scoped hybrid retrieve
  → RRF → section dedup → CE (or degrade)
  → answered + DB citations  OR  insufficient_evidence
```

**Success signal (Implement Met):**

1. Stack up: Compose Postgres (garage already indexed) + Next (`pnpm dev`) + Ollama **embed** + Ollama **generator**.  
2. `POST /api/ask` for the locked Met vehicle returns **HTTP 200** with contract-valid body:  
   `outcome` ∈ {`answered`, `insufficient_evidence`}.  
3. If `answered`: `citations.length ≥ 1` and **every** `citations[].vehicle_id` equals the asked `vehicle_id` (no `fixture:` leak).  
4. If `insufficient_evidence`: citations empty (or non-claiming) and answer matches honest insufficient-evidence behavior — **counts as Met** (same contract as Guide 15).  
5. SQL precheck: Met vehicle has chunks ≫ 0 before ask.  
6. Regression: Guide 15 Soft Adjust ask unit tests stay green; **no** new ask orchestration module / CLI.  
7. Docs honesty: garage ask Met ≠ friend Drive Done ≠ multimodal Met ≠ dual-product Done.

**Out of Met:** UI vehicle selector for garage · fleet-wide ask matrix · golden eval suite · `mecharag ask` CLI · multimodal M1+ · CE/embed model changes · inventing parallel handleAsk wrappers.

---

## 2. DRY / architecture constraints (binding)

1. **Reuse owners — do not fork:**  
   - `web/src/app/api/ask/route.ts`  
   - `web/src/server/ask.ts` (`handleAsk`)  
   - `web/src/server/retrievers.ts` (already `WHERE vehicle_id = $1`)  
   - `web/src/server/citations.ts`  
   - `contracts/ask_request.schema.json` / `ask_response.schema.json`  
2. **No parallel path:** Do not add `mecharag ask`, a second `/api/garage-ask`, or a Python ask orchestrator. Operator entry remains **HTTP** (curl or existing thin UI).  
3. **Reuse Guide 15 regression tests** for vehicle-scoping / insufficient_evidence unit plane (`web/src/server/__tests__/ask_soft_adjust_private_gold.test.ts`). Add a **new** vitest file only if Ready locks require code-level garage-id attestation **and** HTTP env is chronically down — prefer live HTTP for this slice because the corpus is already live-indexed.  
4. **Ask does not re-check `private_oem` / `gold_status`:** Rights are ingest-time. Query-time tenancy is `vehicle_id` + `vehicles` row existence. Do not invent a second rights check in ask without a dedicated architecture decision.  
5. **UI stays fixture-default:** `web/src/app/page.tsx` hardcodes fixture vehicles today — **do not** expand UI packaging in this guide. Curl is the Met attestation surface.  
6. **Frozen models:** `nomic-embed-text` @ 768; generator per `.env.example` (`OLLAMA_MODEL`); CE frozen — do not reopen.  
7. **Leave `MECHANIC_FORCE_RRF_ONLY` unset** for Met (normal CE-on path).  
8. **M0 only:** text citations; no image rows.  
9. **Plain English in new docs** — do not use historical Soft Adjust nicknames as primary vocabulary (cite Guide 15 path once if needed).

---

## 3. References (paths only)

- Context: `docs/2026-07-25_mechanic_rag_orientation_vehicle_docs_wiring_context_summary.md`  
- Ingest Met/Review: `docs/dev_guides/2026-07-25_dev_guide_personal_garage_private_gold_ingest.md`, `docs/2026-07-25_review_personal_garage_private_gold_ingest.md`  
- Ask product: `docs/dev_guides/2026-07-12_dev_guide_01_hybrid_rrf_ce_ask_path.md`  
- Synthetic private ask plane: `docs/dev_guides/2026-07-19_dev_guide_15_soft_adjust_private_gold_ask_eval.md`  
- Code: `web/src/server/ask.ts`, `retrievers.ts`, `citations.ts`, `web/src/app/api/ask/route.ts`  
- Tests: `web/src/server/__tests__/ask_soft_adjust_private_gold.test.ts`, `tests/test_soft_adjust_ask_plane.py`  
- Operator: `GETTING_STARTED.md`, `.env.example`, `docs/ARCHITECTURE.md` §7–§8  
- Live index: Compose DB `vehicle_id LIKE 'cat:%'` (garage fleet already Met)

---

## 4. Evidence already on disk (Write-time — do not assume at Implement)

| Fact | Evidence (2026-07-25) |
|------|------------------------|
| Triumph indexed | `cat:2015-triumph-street-triple` → **1886** chunks |
| Grounded torque text present | Chunk page ~51: “Sump drain plug to sump **25** Fit a new washer” |
| Oil-change procedure text present | Chunks pages ~203–204: remove oil drain plug / oil filter steps |
| Ask surface | HTTP only; no `mecharag ask` |
| UI garage list | **Not** present — curl Met |

---

## 5. Operator preconditions

| Precondition | Check |
|--------------|-------|
| Garage ingest Met | 4 `cat:` vehicles / 13 docs present (`vehicle_id LIKE 'cat:%'`) |
| Compose | `docker compose up -d`; `DATABASE_URL` → host **5433** |
| Next env | `web/.env.local` from `.env.example` (no secrets committed) |
| Ollama embed | `nomic-embed-text` available (query embed) |
| Ollama generator | `OLLAMA_MODEL` pulled (e.g. `gemma4:e2b` or documented fallback) |
| Next server | `cd web && pnpm install && pnpm dev` → `:3000` |
| Health | `curl -s localhost:3000/api/health` OK |
| Ablation footgun | `MECHANIC_FORCE_RRF_ONLY` **unset** |

**Env gap honesty:** Unlike Guide 15 synthetic Met (unit-allowed when HTTP down), **this guide’s Met prefers live HTTP** because the claim is “personal garage corpus is queryable.” If Compose/Next/Ollama cannot run, Implement records an **env gap** and stops — do **not** claim garage-ask Met from unit tests alone unless Tom Ready-locks a hybrid fallback.

---

## 6. Ordered Implement checklist

### A. Preconditions / SQL

- [x] **A1.** Confirm Met vehicle chunk count ≫ 0 (SQL).  
- [x] **A2.** Confirm `vehicles` row exists for Met `vehicle_id`.  
- [x] **A3.** Confirm health endpoint OK with Next up.  
- [x] **A4.** State business rule before any new helper (none expected): ask reuse only.

### B. Code (only if needed)

- [x] **B1.** Default: **zero product code**. Curl + docs only.  
- [x] **B2.** If Ready locks a garage-specific vitest: mirror Guide 15 patterns with Met `vehicle_id` mocks — **do not** duplicate `handleAsk`. (**No** — Ready locked no new vitest.)  
- [x] **B3.** Do **not** edit UI vehicle list / packaging.  
- [x] **B4.** Do **not** change ranking / CE / embed defaults.

### C. Live ask smoke (required for Met under recommended locks)

- [x] **C1.** Run curl against locked Met vehicle + grounded question (see §8).  
- [x] **C2.** Record full JSON response (or redacted) in Implement evidence section of **this guide** or living context — outcome, citation vehicle_ids, citation count.  
- [x] **C3.** Assert outcome ∈ {`answered`, `insufficient_evidence`}.  
- [x] **C4.** If `answered`: assert no citation `vehicle_id` starts with `fixture:`; all equal asked id.  
- [ ] **C5.** Optional negative: unknown `vehicle_id` → **404** (reuse Guide 15 expectation). — deferred optional

### D. Regression tests

- [x] **D1.** `cd web && npx vitest run src/server/__tests__/ask_soft_adjust_private_gold.test.ts` green.  
- [x] **D2.** Optional thin: `uv run pytest tests/test_soft_adjust_ask_plane.py -q` green.  
- [x] **D3.** Do not copy OEM / garage Gold into repo or fixtures.

### E. Docs honesty

- [x] **E1.** Update living context: garage ask Met status.  
- [x] **E2.** Thin GETTING_STARTED note: one garage curl example (Triumph) — **update living doc**, no second runbook essay.  
- [x] **E3.** Do not claim friend Done / multimodal Met / fleet ask coverage.

---

## 7. Definition of Done / verification

| Gate | Pass criteria |
|------|----------------|
| Path reuse | Existing `/api/ask` only |
| SQL precheck | Met vehicle chunks ≫ 0 |
| HTTP Met | 200 + contract outcome as above |
| Scoping | No fixture citation leak when answered |
| Incomplete OK | `insufficient_evidence` still Met |
| Tests | Guide 15 ask unit green |
| Docs | Context + thin GETTING_STARTED update |
| Non-goals | No UI · no CLI · no goldens · no M1+ · no friend Done |

---

## 8. Suggested Met question (grounded — Write evidence)

**Recommended Met vehicle:** `cat:2015-triumph-street-triple`  
**Recommended question (torque, grounded in indexed text):**

```text
What is the sump drain plug torque for the Street Triple?
```

Corpus evidence (SQL Write-time): lubrication torque table includes “Sump drain plug to sump 25 Fit a new washer.”

**Alternate (procedure):**

```text
What are the steps to remove the oil drain plug and oil filter on the Street Triple?
```

Either is acceptable; prefer the torque question for a short, checkable answer. Prefer `answered` with citations, but **`insufficient_evidence` remains Met**.

```bash
# SQL precheck
psql "$DATABASE_URL" -c "SELECT COUNT(*) FROM chunks WHERE vehicle_id='cat:2015-triumph-street-triple';"

# Health
curl -s localhost:3000/api/health

# Ask smoke
curl -s -X POST localhost:3000/api/ask \
  -H 'content-type: application/json' \
  -d '{"vehicle_id":"cat:2015-triumph-street-triple","question":"What is the sump drain plug torque for the Street Triple?"}'
```

---

## 9. Blast radius / risks

| Risk | Mitigation |
|------|------------|
| Generator down / slow | Fail closed or env-gap note; do not fake answer |
| Embed down | Ask cannot retrieve; env gap |
| `MECHANIC_FORCE_RRF_ONLY=1` left on | Unset for Met; document footgun |
| Cross-vehicle citation leak | Assert citation `vehicle_id` == ask id |
| Claiming “answered” proves correctness | Met is **contract + scoping**, not gold-label eval |
| UI expectation creep | Explicit non-goal |
| OEM in git via evidence paste | Redact long OEM quotes in docs; keep short attestation |
| Thin OCR/PDF text → insufficient_evidence | Still Met; honesty over theater |
| Confusing Guide 15 synthetic Met with garage Met | Separate guide + separate evidence |

---

## 10. Edge cases

| Case | Behavior |
|------|----------|
| Unknown `vehicle_id` | 404 |
| Empty / missing question | 400 |
| Stub `{ query }` body | 400 (retired stub) |
| Vehicle exists, zero useful hits | 200 `insufficient_evidence` |
| Answered with empty citations | Fail Met — treat as bug / incomplete assembly |
| Fixture vehicle still works | Out of Met but must not break (no ask code change expected) |
| Other garage vehicles | Out of Met (one vehicle only) |

---

## 11. Non-goals

- Multimodal M1–M3  
- Garage UI packaging / vehicle picker  
- `mecharag ask` CLI  
- Full fleet ask matrix  
- Soft Adjust / Guide 15 reopen  
- Friend library Done  
- Embedding / CE model unfreeze  
- Golden-question suite for garage  

---

## 12. Ready-check decisions — **LOCKED 2026-07-25 (Go 8.7/10)**

| Decision | Locked |
|----------|--------|
| Met vehicle | **`cat:2015-triumph-street-triple`** |
| Attestation shape | **Live HTTP required** for Met |
| Question | **Sump drain plug torque** |
| New vitest | **No** (reuse Guide 15 Soft Adjust ask units) |
| GETTING_STARTED | **Yes** — thin Triumph curl on Implement |
| Ask path | Existing `POST /api/ask` only |

See `docs/2026-07-25_ready_check_personal_garage_ask_attestation.md`.

**Implement** only after Tom explicit authorize.

---

## 13. Next after this guide

1. ~~Ready / Implement~~ **Implement Met**  
2. **Review implementation**  
3. Later backlog: optional multi-vehicle smoke; UI garage list; ask goldens — each own guide  

### Implement evidence (2026-07-25)

| Item | Result |
|------|--------|
| Health | `{"status":"ready",… postgres:true, ollama:true}` |
| SQL | Triumph chunks = **1886** |
| Ask | `outcome=answered`; answer cites **25 Nm** sump drain plug |
| Citations | **3**; all `vehicle_id=cat:2015-triumph-street-triple`; **no** `fixture:` leak |
| Primary cite | service manual page **51** |
| Log | `/tmp/mechanic_garage_ask_triumph.json` (local; not committed) |
| Tests | Guide 15 vitest **4 passed**; `test_soft_adjust_ask_plane` **2 passed** |
| Product code | **None** (curl + docs only) |

---

## 14. Stop

**Implement Met.** Optional C5 404 smoke deferred. Review next.
