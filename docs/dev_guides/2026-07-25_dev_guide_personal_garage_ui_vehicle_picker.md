# Dev guide — Personal garage UI vehicle picker

**Date:** 2026-07-25  
**Repo:** `mechanic_rag`  
**Work item:** Thin UI vehicle select lists indexed `fixture:` **and** personal-garage `cat:` vehicles (not fixtures-only hardcode)  
**Stage that authored this:** Write dev guide  
**Status:** **Implement Met + Review Pass** (2026-07-25) · Ready was Go 8.5/10  
**Depends on:** Multi-vehicle ask smoke **Implement Met + Review Pass**  
**Context SSOT:** `docs/2026-07-25_mechanic_rag_orientation_vehicle_docs_wiring_context_summary.md`  
**Lens:** Frontend (thin operator UI) + backend (list API) + portfolio honesty

### Declare (Write)

| Item | Value |
|------|-------|
| Mode | multi-repo awareness; primary `mechanic_rag` |
| Will write | This guide |
| Will **not** | Golden suite · multimodal · friend Drive · redesign chrome · new ask path |

---

## 1. Objective

Today `web/src/app/page.tsx` **hardcodes** `fixture:honda-s2000-demo` and never loads garage ids. `listFixtureVehicles()` in `retrievers.ts` only returns `fixture:%`, and **no** `/api/vehicles` route exists.

**Success signal (Implement Met):**

1. `GET /api/vehicles` returns JSON `{ "vehicles": string[] }` with **both** `fixture:%` and `cat:%` ids present in Compose Postgres (ordered: fixtures first, then `cat:`).  
2. Home page `useEffect` fetches that endpoint and populates the `<select>` (no hardcode-only list).  
3. When garage is indexed, the four personal `cat:` ids appear in the dropdown.  
4. Default selection remains a **fixture** when any fixture is listed (clone-friendly); otherwise first listed id.  
5. Existing `POST /api/ask` unchanged.  
6. Targeted unit test(s) for the list SQL helper; thin route/UI regression if cheap.  
7. Copy honesty: stop claiming “fixtures only” on the home page when garage ids can appear.  
8. Docs: thin GETTING_STARTED / context note — UI picker Met ≠ goldens ≠ friend Drive Done.

**Out of Met:** Garage golden suite · multimodal · fancy vehicle labels/metadata · Drive listing · redesign beyond thin select + honesty line · `mecharag` CLI.

---

## 2. Locked decisions (Tom 2026-07-25 — agree + proceed)

| Decision | Locked |
|----------|--------|
| List surface | New thin **`GET /api/vehicles`** |
| Included prefixes | **`fixture:%` + `cat:%` only** (not every future prefix) |
| SQL owner | Extend/reuse `retrievers.ts` — replace/widen `listFixtureVehicles` → **`listAskableVehicles`** (or keep old name as thin wrapper calling shared query — prefer one function, update call sites) |
| UI load | `page.tsx` fetch `/api/vehicles` on mount; fallback to `[DEFAULT_VEHICLE]` if fetch fails |
| Default select | Prefer first `fixture:` in list; else first entry |
| Ask path | Unchanged `POST /api/ask` |
| Labels | Show raw `vehicle_id` strings (no marketing names required) |
| Public honesty | Home blurb must not say fixtures-only if `cat:` can appear |

---

## 3. DRY / architecture constraints (binding)

1. **Business rule (state before code):** Askable UI vehicles = rows in `vehicles` whose `vehicle_id` starts with `fixture:` or `cat:`, fixtures sorted before `cat:`, then alphabetical within group.  
2. **Do not** invent a second vehicles table or hardcode the four garage ids in the client.  
3. **Do not** put retrieval/ask logic in the browser beyond select + existing ask POST.  
4. Prefer ≤300 lines/file; `page.tsx` stays thin.  
5. Fail soft on list fetch: keep usable default fixture option; surface a small non-blocking error or empty-expand honesty if desired — do **not** break ask form.  
6. No CE/embed/model reopen.  
7. Plain English in new docs.

---

## 4. References (paths only)

- Context: `docs/2026-07-25_mechanic_rag_orientation_vehicle_docs_wiring_context_summary.md`  
- Prior ask Met: `docs/dev_guides/2026-07-25_dev_guide_personal_garage_multi_vehicle_ask_smoke.md`  
- Code: `web/src/app/page.tsx`, `web/src/server/retrievers.ts` (`listFixtureVehicles`), `web/src/app/api/ask/route.ts`, `web/src/app/api/health/route.ts`  
- Operator: `GETTING_STARTED.md`

---

## 5. Evidence (Write-time)

| Fact | Evidence |
|------|----------|
| UI hardcodes fixtures | `page.tsx` `useEffect` → `setVehicles([DEFAULT_VEHICLE])` |
| List helper fixtures-only | `listFixtureVehicles` SQL `LIKE 'fixture:%'` |
| No vehicles API | Only `api/ask`, `api/health` under `web/src/app/api/` |
| Garage indexed | Multi-vehicle ask Met — 4 `cat:` vehicles in DB when Compose up |

---

## 6. Ordered Implement checklist

### A. Server list helper

- [x] **A1.** State business rule in code comment (one short block) matching §3.1.  
- [x] **A2.** Implement `listAskableVehicles()` in `retrievers.ts` (fixtures then `cat:`).  
- [x] **A3.** Update any callers of `listFixtureVehicles` to the new helper **or** make `listFixtureVehicles` call the shared query with a fixture-only filter only if something still needs fixtures-only — search first; avoid dead dual paths. *(removed unused `listFixtureVehicles`; single helper)*  
- [x] **A4.** Unit test: mock/query helper returns ordered fixture + cat ids (follow existing test style).

### B. API route

- [x] **B1.** Add `web/src/app/api/vehicles/route.ts` → `GET` → `{ vehicles: string[] }` + 500 on DB failure with honest error.  
- [x] **B2.** Mirror thin patterns from `health/route.ts` / `ask/route.ts` (no secrets).

### C. UI

- [x] **C1.** `page.tsx`: fetch `/api/vehicles` on mount; set options; set default per §2.  
- [x] **C2.** Update subtitle/honesty line (not “fixtures only” as absolute).  
- [x] **C3.** On fetch failure: keep `DEFAULT_VEHICLE` selectable; do not crash.

### D. Verify + docs

- [x] **D1.** With Compose up: `curl -s localhost:3000/api/vehicles` includes all four garage `cat:` ids + fixtures.  
- [x] **D2.** Targeted tests green.  
- [x] **D3.** Thin GETTING_STARTED note (vehicles endpoint + UI).  
- [x] **D4.** Living context Rank-2 → Met after Review.  
- [x] **D5.** Do **not** claim golden suite / friend Drive Done.

### Implement evidence (2026-07-25)

| Item | Result |
|------|--------|
| `GET /api/vehicles` | 3 fixtures + 4 garage `cat:` (fixtures first) |
| Tests | `list_askable_vehicles` **1 passed**; Guide 15 **4 passed** |
| Product files | `retrievers.ts`, `api/vehicles/route.ts`, `page.tsx` |
| Ask path | Unchanged |

---

## 7. Definition of Done

| Gate | Pass |
|------|------|
| `GET /api/vehicles` | Returns fixtures + `cat:` when present |
| UI select | Populated from API (not hardcode-only) |
| Default | Fixture-preferring |
| Ask | Unchanged; still works |
| Tests | List helper covered |
| Docs | Honesty + GETTING_STARTED |
| Non-goals | Goldens / multimodal / redesign out |

---

## 8. Blast radius / risks

| Risk | Mitigation |
|------|------------|
| Public clone with empty `cat:` | List still returns fixtures — OK |
| Synthetic `cat:demo-*` appears | Expected if ingested; prefixes locked |
| Fetch fail breaks UI | Fallback default vehicle |
| Accidental ask rewrite | Out of scope — Review reject |
| Listing non-askable junk ids | Prefix filter only `fixture:`/`cat:` |

---

## 9. Edge cases

| Case | Handling |
|------|----------|
| Empty `vehicles` table | Fallback `[DEFAULT_VEHICLE]`; ask may 404 — honest |
| Only `cat:` (no fixtures) | Default first `cat:` |
| Duplicate ids | Impossible as PK; SQL DISTINCT not required |
| Slow DB | Health already gates; list should be fast SELECT |

---

## 10. Ready-check decisions — **LOCKED (Go 8.5/10)**

| Decision | Locked |
|----------|--------|
| Prefix filter | `fixture:` + `cat:` |
| API shape | `{ vehicles: string[] }` |
| Default | First fixture if any |
| Tests | Unit on list helper |
| UI redesign | No — thin select only |

See `docs/2026-07-25_ready_check_personal_garage_ui_vehicle_picker.md`.

---

## 11. Next

1. ~~Ready / Implement / Review~~ **Review Pass**  
2. Rank-3: garage golden-question set (separate Write)  

---

## 12. Stop

Implement Met + Review Pass. Do not expand into goldens without authorize.
