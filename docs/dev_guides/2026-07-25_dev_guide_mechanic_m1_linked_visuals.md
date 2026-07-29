# Dev guide — Mechanic M1 linked visuals (thin)

**Date:** 2026-07-25  
**Repo:** `mechanic_rag`  
**Work item:** M1 — text ask/UI can **show** page PNGs joined by stable locators (not M2 retrieve, not M3 vision)  
**Stage that authored this:** Write dev guide  
**Status:** **Review Pass · MR-1 Met** (2026-07-26 Build Go) — see `docs/2026-07-26_review_mechanic_m1_linked_visuals.md`  
**Depends on:** Multimodal context **Refine Met** + context Critical review + **guide** Critical review `docs/2026-07-26_critical_review_mechanic_m1_linked_visuals_guide.md` + Ready Met  
**Context SSOT:** `docs/2026-07-25_mechanic_rag_multimodal_roadmap_m1_m3_context_summary.md`  
**Critical reviews:** context `docs/2026-07-25_critical_review_multimodal_roadmap_m1_m3.md` · guide `docs/2026-07-26_critical_review_mechanic_m1_linked_visuals_guide.md`  
**Lens:** Senior AI eng (RAG grounding) + backend (API/security) + DE (asset lineage/disk)

### Declare (Implement)

| Item | Value |
|------|-------|
| Mode | multi-repo awareness; primary `mechanic_rag` |
| Will write | M1 code + tests + Align ARCHITECTURE |
| Will **not** | M2/M3 · friend Drive · fleet batch PNG |

---

## 1. Objective

M0 garage path is Met (text ask + citations). Mechanics still need to **see the page** that grounded the answer.

**Honest ship claim (M1):** Text retrieval unchanged; when a citation has a resolvable cached page asset, ask/UI can show it. Missing asset → omit visual; text path still works.

**Success signal (Implement Met — when authorized):**

1. Asset root exists under `$HOME/var/mechanic_garage/assets/...` (gitignored); garage root default **`$HOME/var/mechanic_garage`** (env override e.g. `MECHANIC_GARAGE_ROOT` allowed).  
2. `resolve_bronze_pdf(vehicle_id, document_id) → Path` via **documents.provenance**: join `garage_root / redacted_locator` (emit shape `bronze/<dirname>/<filename>`); reject `..`; **not** filename guess from `document_id` alone.  
3. Rasterize page on demand into `page_NNNNN.png` (150 DPI, full page); cache reuse; prefer library under `mecharag/` with thin Next wrappers.  
4. `POST /api/ask` may include optional `visual_assets[]` with **`href` whenever bronze+page are resolvable** — ask **never** calls `ensure_page_png` / never blocks on rasterize. Missing bronze/page → omit that visual.  
5. `GET /api/assets/...` serves PNG under allowlisted asset root; vehicle-scoped; path-traversal fail closed; URL-encode path segments. **On cache miss:** `ensure_page_png` with hard timeout **8s**, else 404.  
6. UI shows images for returned `visual_assets` (Triumph garage ask smoke) — first hit may wait on GET render, not on ask.  
7. Fixture/CI path uses tiny synthetic PNG — never requires private OEM in CI.  
8. ≥1 golden or smoke asserting visual present when href returned and GET succeeds; hard-miss goldens unchanged.  
9. Docs Align: ARCHITECTURE/ask schema note M1 fields; stale `api_contracts.md` banner remains non-SSOT.

**Out of Met:** M2 image retrieval · M3 VLM · figure crops · full-fleet batch PNG · friend Drive · watermarking.

---

## 2. Locked decisions (Tom 2026-07-25)

| Decision | Locked |
|----------|--------|
| Scope | **M1 linked visuals only** |
| Asset root | `$HOME/var/mechanic_garage/assets/<vehicle_id>/<document_id>/page_NNNNN.png` |
| Production | **On-demand + cache** (no full-fleet batch) |
| DPI / crop | **150** DPI · **full page** |
| Gold contract | **No Contract 7.2 rewrite** |
| Garage root | Default **`$HOME/var/mechanic_garage`**; optional env override `MECHANIC_GARAGE_ROOT` |
| Bronze resolve | `garage_root / provenance.redacted_locator` (+ `source_doc_ids` honesty); reject `..` |
| Ask join | Emit `href` when resolvable; **never rasterize inside ask** |
| Asset HTTP | `/api/assets/...` allowlist; vehicle_id in path; encode segments; **miss → render ≤8s or 404** |
| API shape | Optional top-level `visual_assets[]`: `{ chunk_id, document_id, page_start, content_type, href }` (`href` includes vehicle_id) |
| Multi-page cite | Emit hrefs for `page_start..min(page_end, page_start+2)` (max 3) when resolvable |
| First Implement slice | **Triumph** + fixture synthetic CI |
| Missing asset | Omit when not resolvable · text unchanged · GET 404 if render fails |
| Module split | Resolve/render in **`mecharag/`**; thin routes in `web/` |

---

## 3. DRY / architecture constraints (binding)

1. **Business rule:** Visual join key = `(vehicle_id, document_id, page_number)` → asset path; source pixels from bronze PDF page.  
2. Do **not** invent a second chunk identity; reuse citation locators.  
3. Do **not** put absolute filesystem paths in API responses — `href` only.  
4. Do **not** overload retrieval channel `modality` with content kind (`content_modality`).  
5. Prefer ≤300 lines/file; hard max 400.  
6. Fail soft on visuals; fail closed on path traversal.  
7. Serialize with friend LEMON/batch-2: no M1 fleet rasterize while those live jobs need disk.

---

## 4. References (paths only)

- Context: `docs/2026-07-25_mechanic_rag_multimodal_roadmap_m1_m3_context_summary.md`  
- Review: `docs/2026-07-25_critical_review_multimodal_roadmap_m1_m3.md`  
- VISION §5 · ARCHITECTURE §8/§11  
- `contracts/ask_response.schema.json` · `mecharag/db_upsert.py` · `mecharag/garage_emit/emit.py`  
- `web/src/app/page.tsx` · `web/src/server/citations.ts` · `web/src/lib/retrieval/types.ts`  
- Stale (non-binding): `docs/api_contracts.md`, `docs/multimodal_gemini_approach_plan.md`

---

## 5. Evidence (Write-time)

| Fact | Evidence |
|------|----------|
| Citations have page locators | `ask_response.schema.json` |
| No visual_assets in live schema | same |
| Provenance stored on documents | `db_upsert.py` |
| Garage emit text-only | `garage_emit/emit.py` |
| Transit ~6619 pages / ~668 MiB | pypdf + bronze stat (Refine) |
| Disk ~25 GiB class + Ram live | host checks |

---

## 6. Ordered Implement checklist (when Tom Go)

### A. Resolve + rasterize (library under `mecharag/`)

- [x] **A1.** State bronze-resolve business rule in module docstring.  
- [x] **A2.** `resolve_bronze_pdf(...)` via provenance / `redacted_locator`; reject traversal.  
- [x] **A3.** `asset_path(vehicle_id, document_id, page) → Path` under asset root.  
- [x] **A4.** `ensure_page_png(...)` — cache hit return; else render @150 DPI; atomic write. Renderer: `pdf2image`+Poppler (Python) / `pdftoppm` (Next GET).  
- [x] **A5.** Unit tests: missing provenance → None; path traversal rejected; cache hit skips render.

### B. Ask contract (href when resolvable; never render in ask)

- [x] **B1.** Extend `ask_response.schema.json` with optional `visual_assets`.  
- [x] **B2.** After citations built: append `visual_assets` with href when resolvable; never `ensure_page_png` in ask.  
- [x] **B3.** Tests: ask ablation still green; page_assets unit tests for href omit/include.

### C. Asset route

- [x] **C1.** `GET /api/assets/[vehicle_id]/[document_id]/[page]` — allowlist resolve; encode-aware.  
- [x] **C2.** On miss: `ensure_page_png` with **8s** hard timeout; else 404.  
- [x] **C3.** Traversal → 400; missing bronze → 404; timeout/fail → 404.

### D. UI

- [x] **D1.** Render `visual_assets` images under citations.  
- [x] **D2.** Empty list → unchanged UI.

### E. Fixtures / eval / docs

- [x] **E1.** Cache-hit + resolve unit tests; Triumph page-1 PNG measured in Implement (~on-demand).  
- [x] **E2.** Align ARCHITECTURE §8 M1 optional fields.  
- [ ] **E3.** Banner on stale `api_contracts.md` if touched — not touched this pass.

### F. Verification commands (Implement)

```bash
# Primed-cache Triumph ask (exact curls in GETTING_STARTED after Implement)
# Unit: pytest / vitest for resolve + asset route
# Confirm no OEM PNGs under repo git status
```

---

## 7. Definition of Done

- [x] Checklist A–E Met for Triumph + fixture CI path (unit/vitest; live UI smoke = operator)  
- [x] Ask never waits on cold rasterize (href-only join)  
- [x] First-hit UI can obtain PNG via GET (render-on-miss ≤8s or honest 404)  
- [x] Path traversal tests green  
- [x] No private OEM images committed  
- [ ] Review implementation Pass (or Pass-with-nits) — **next stage**  
- [x] M2/M3 explicitly still Not Met

---

## 8. Blast radius / risks

| Risk | Mitigation |
|------|------------|
| Ask latency / timeout | Cache-only join (locked) |
| Disk blow-up | On-demand; Triumph-first; no fleet batch |
| Path traversal | Allowlist under asset root |
| Cross-vehicle leak | vehicle_id in route + DB scope |
| Stale Gemini docs | Non-binding |

## 9. Edge cases

- `page_start` null → no visual  
- Bronze missing → omit  
- Meta/cache corrupt → delete + optional re-render on asset route only  
- Hard-miss goldens must not require visuals  
- Public clone: empty `visual_assets` OK

---

## 10. Next after this guide

1. **Ready check Met** — `docs/2026-07-26_ready_check_mechanic_m1_linked_visuals.md` (**8.1/10**).  
2. **Implement** only after Tom explicit Go (prefer after Ram wave quieter; on-demand GET only — no fleet warm).  
3. M2/M3 remain design docs until their own Ready + Go.

**Implement?** Not until explicit Tom Go + Ram/batch-2 disk honesty.
