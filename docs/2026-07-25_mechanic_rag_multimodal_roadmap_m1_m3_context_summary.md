# Context: Mechanic RAG — multimodal roadmap (M1 → M3)

**Date:** 2026-07-25  
**Repos:** `mechanic_rag` (hub awareness: friend Drive library stays separate)  
**Status:** Refined  
**Mode last used:** multi-repo  
**Stage this pass:** Refine context  
**Lens:** Senior AI eng (RAG / multimodal / eval honesty) + backend (API contracts) + DE (asset lineage / disk)

### Declare

| Item | Value |
|------|-------|
| Will write | This living context in place (Refine) · brief hub/orientation lock pointers |
| Will **not** | Write executable guides this stage · Implement M1–M3 · restart/kill Ram (healthy) · friend live downloads |

**Tom locks (2026-07-25):** Prioritize decisions 1–3 · full M1–M3 roadmap **docs** · Implement parked · Refine→Write M1 then M2/M3 guides · friend title-only cleanup Gather next for vehicle-docs.

---

## Problem

Mechanic’s personal-garage path is **M0 text-first Met** (emit → private-gold ingest → multi-vehicle ask → UI picker → garage goldens). Shop work still needs **diagrams and page images** joined to answers. VISION §5 already names staged **M1 linked visuals → M2 multimodal retrieve → M3 vision answers**. Implementing that stack is **heavy** (assets, storage, retrieval channels, evals, UI, honesty). We need **durable written context and later executable guides for the full roadmap** so Implement does not invent architecture under pressure — while **not** expanding M0 DoD or shipping code until Tom opens each Implement gate.

---

## Acceptance criteria

### Gather (Met)

- [x] Problem, in/out of scope, prior art, risks, edge cases, unknowns, recommended approach explicit for **M1 and M2 and M3**
- [x] Honest weight: full multimodal is multi-guide, multi-Implement work — not one weekend slice
- [x] Stale docs marked non-binding vs VISION / ARCHITECTURE

### Refine (this pass)

- [x] Soft unknowns closed or parked with **locked defaults** (below)
- [x] Disk evidence recorded (bronze sizes, page counts, empty_extract)
- [x] Write-dev-guide readiness **0–10 per track** + why not 10
- [x] Open decisions reduced; remaining surfaced for chat
- [ ] Executable guides — **not** this stage (Write next)

---

## In scope (docs / design — this work item)

- Living roadmap context for **M1 + M2 + M3** (this file)
- Later (separate stages, still docs-only until Implement Go):
  - **One executable guide per stage** (M1, M2, M3) with its own Definition of Done and eval honesty
  - Optional thin **roadmap index** Align in VISION/ARCHITECTURE after guides exist
- Design rules already binding in VISION §5 / ARCHITECTURE §11

## Out of scope (until per-stage Implement Go)

- Any M1/M2/M3 **code**, schema migration apply, asset rasterization fleet runs, CLIP/VLM installs
- Redefining **M0 v1** finish line or reopening Rank 1–3 Met claims
- Friend Drive → Mechanic ingest; CE/embed freeze reopen; `mecharag ask` CLI
- Cloud Gemini multimodal ingest / Supabase asset hosting as the product path
- Concurrent friend LEMON live / heavy-truck batch-2 (separate program)

---

## Why full-roadmap docs now

**Locked (A):** Context + **separate** stage guides for M1→M3; Implement later per stage. Not a mega-guide. Not M1-only silence on M2/M3 design.

---

## Stage definitions (honest ship claims)

| Stage | Name | Honest ship claim | Depends on |
|-------|------|-------------------|------------|
| **M0** | Text RAG (current) | Hybrid → RRF → CE → citations over **text** | **Met** for garage thin v1 |
| **M1** | Linked visuals | Text retrieval unchanged; ask/UI can **show** page assets joined by stable locators | `document_id` + `page_*`; asset store outside git; missing asset → omit (no fake image) |
| **M2** | Multimodal retrieve | Also retrieve via image/caption channels; fuse ID lists; CE text-pairs unless later decided | M1 assets + image/caption index + new evals |
| **M3** | Vision answers | Optional local VLM for diagrams; **text remains torque/spec truth** | M1/M2 + VLM ops + non-regression evals |

---

## Current codebase evidence (M0 foundation)

| Fact | Evidence |
|------|----------|
| Garage emit is **text units only** | `mecharag/garage_emit/emit.py` |
| Locators on Contract 7.2 units | `page_start` / `page_end` / `section_path` / `heading` |
| Ask citations carry locators; **no** visuals | `contracts/ask_response.schema.json` |
| DB `modality` hardcoded `'text'` | `mecharag/db_upsert.py` · `db/migrations/001_init.sql` |
| TS splits content vs channel modality | `web/src/lib/retrieval/types.ts` |
| UI shows citations text-only | `web/src/app/page.tsx` |
| Stale `api_contracts.md` / Gemini plan | **non-binding** vs VISION |

### Disk / page evidence (Refine — measured 2026-07-25)

| Corpus fact | Value |
|-------------|-------|
| Bronze PDFs | **13** |
| Gold text units | **13286** `.txt` |
| Largest bronze | Transit `service_manual.pdf` **~668 MiB**, **6619** PDF pages |
| Triumph service PDF | **~68 MiB**, **697** PDF pages (emit receipt pages_total across manuals can be higher) |
| Empty extract pages (receipts) | Transit **75** · S2000 **38** · YXZ **14** · Triumph **2** |
| Free disk (host, same evening) | ~**25 GiB** class (also feeding LEMON Ram) |

**Implication:** Batch-rasterizing the full garage is a **multi-GB** risk and fights friend live downloads. M1 must be **on-demand + cache**, not “PNG every page at emit.”

---

## Locked design defaults (Refine)

These are **guide-ready defaults** unless Tom overrides. Implement still parked.

### M1 — linked visuals

| Topic | Locked default | Why |
|-------|----------------|-----|
| Asset root | `$HOME/var/mechanic_garage/assets/<vehicle_id>/<document_id>/page_NNNNN.png` (5-digit page, 1-based) | Mirrors Gold layout; gitignored with garage root |
| Production mode | **On-demand rasterize from bronze PDF** on first join miss; write cache file; reuse thereafter | Disk evidence; Transit 6619 pages |
| DPI | **150** for UI thumbnails/full-page view (Write may allow override flag) | Screen-first; lower than print DPI |
| Crop | **Full page** only in M1 (no figure detection) | Keeps M1 thin; figure crops = M2+ research |
| Gold contract | **No Contract 7.2 rewrite** — join via bronze path from provenance `redacted_locator` + page | Avoids re-emit/re-ingest of 13k units |
| Empty-text pages | **Do not pre-generate**; if a citation somehow targets an empty page, on-demand may still rasterize that page once | empty_extract is small vs total; diagrams usually have some text |
| Multi-page citation (`page_start` ≠ `page_end`) | Show assets for **`page_start`..`min(page_end, page_start+2)`** (max 3 pages) | Cap UI blast; garage units are usually single-page |
| Ask API | Add optional top-level `visual_assets[]`: `{ chunk_id, document_id, page_start, content_type:"image/png", href }` where `href` is app-relative (`/api/assets/...`) not raw filesystem | Matches mental model of stale docs; safer than exposing absolute paths |
| Asset HTTP | New **local-only** route: resolve under asset root allowlist; 404 if missing; **no** directory escape | Path traversal risk |
| Missing asset | Omit from `visual_assets`; text answer/citations unchanged; optional diagnostic when `MECHANIC_DIAGNOSTICS=1` | Fail soft |
| Fixtures / CI | Tiny synthetic PNG(s) under fixture tree or test temp — **never** require private OEM PNGs in CI | Portfolio honesty |
| First Implement slice (when Go) | One vehicle (recommend **Triumph**) + fixture path for CI — not full fleet batch | Smallest proof |
| Eval | ≥1 golden expecting visual when citation page cached/present; hard-miss unchanged | Honesty |

### M2 — multimodal retrieve (guide may be written; Implement later)

| Topic | Locked for docs | Still gated to Ready/Implement |
|-------|-----------------|--------------------------------|
| Fusion | Modality-agnostic **ID-list** fusion (extend RRF-style) | Exact k / weights |
| CE | Remains **text-pair** CE in M2 unless separate decision | — |
| Index | Nullable image embedding column **or** side table — prefer side table to avoid rewriting 768-d text HNSW assumptions blindly | Migration shape |
| Model | **TBD local** CLIP-family — name in M2 Ready after fixture spike | Model ID |
| Evals | New diagram-first goldens; lift vs M1-only | Thresholds |

### M3 — vision answers (guide may be written; Implement later)

| Topic | Locked for docs | Still gated |
|-------|-----------------|-------------|
| Truth rule | **Text citations own torque/spec numbers**; VLM assists diagram interpretation only | Prompt/eval harness |
| Degrade | VLM down → M1/M0 text path still works | — |
| Model | **TBD local** VLM via Ollama or equivalent | Model ID |
| Portfolio | Optional path; never claim “vision RAG” as default without eval | — |

---

## Recommended docs → code sequence

1. Gather — **Met**  
2. Refine — **Met (this pass)**  
3. **Write dev guide — M1** (next)  
4. Write dev guide — M2  
5. Write dev guide — M3  
6. Implement only on Tom Go **per stage**, and not while friend live disk jobs need the machine  

---

## Risks and blast radius

| Risk | Blast | Mitigation |
|------|-------|------------|
| Full-fleet PNG batch | Multi-GB; fights Ram/batch-2 | On-demand + Triumph-first slice |
| Absolute filesystem paths in API | Leaks host layout; breaks UI | `href` via `/api/assets/...` only |
| Path traversal on asset route | Read arbitrary files | Allowlist resolve under asset root |
| Scope collapse to mega-Implement | Dishonest DoD | Separate guides |
| Stale Gemini/Supabase docs | Wrong stack | Non-binding banners |
| DB `modality` vs TS `content_modality` | Type bugs | M1 Align: content kind ≠ retrieval channel |
| M3 invents specs | Safety | Text-citation gate |

---

## Edge cases (refined)

- `page_start` null → no asset  
- Bronze PDF missing → omit visual; log diagnostic  
- Cached PNG sha mismatch vs bronze (optional check in M1.1) → delete cache + re-rasterize or omit  
- Concurrent rasterize + LEMON Ram → **ops gate**: no M1 Implement fleet while Ram/batch-2 live  
- Public fixture ask must work with synthetic assets or empty `visual_assets`  
- Hard-miss goldens must not require visuals  
- M2 image-only hit: must define citation text fallback (guide: require paired text chunk or show asset with explicit “diagram hit” label — **park detail to M2 Write**)  
- M3 timeout → text path  

---

## Unknowns after Refine

| Unknown | Status | Blocks Write M1? | Blocks Write M2/M3? |
|---------|--------|------------------|---------------------|
| Exact PNG byte size @150 DPI for Triumph sample | **Measured** 2026-07-26 — Triumph owners handbook p1 ≈ **227 308** bytes | No | No |
| Image embed model ID | **Park** to M2 Ready | No | Blocks M2 **Ready/Implement**, not Write guide |
| Local VLM ID | **Park** to M3 Ready | No | Blocks M3 Ready/Implement |
| Side table vs nullable column for M2 | **Recommend side table** in M2 guide; confirm at Ready | No | Soft |
| Whether to watermark/private banner on served PNGs | **Park** — optional M1.1 | No | No |

---

## Open decisions (human) — Refine residual

### 1) Accept Refine locked defaults for M1 (on-demand, asset root, top-level `visual_assets`, Triumph-first Implement later)?

- **Recommendation:** Yes — lock defaults; proceed to **Write M1 guide**.  
- **Reasoning:** Disk math forbids batch-all-pages; locators already exist; smallest vertical slice is clearest DoD.  
- **Tradeoffs:** First citation on a cold page adds rasterize latency; cache makes repeats cheap.

### 2) Author M2 and M3 guides in the same docs sprint after M1 guide (still no code)?

- **Recommendation:** Yes — Write M1, then M2, then M3 guides before any Implement.  
- **Reasoning:** Matches locked full-roadmap docs intent; shared locator/asset assumptions stay aligned.  
- **Tradeoffs:** M2/M3 guides may need small edits after M1 Implement lessons.

### 3) Next vehicle-docs stage still title-only cleanup Gather?

- **Recommendation:** Yes, after or interleaved once Mechanic Write M1 is drafted — Ram is healthy; cleanup Gather is still safe (no live delete until later).  
- **Reasoning:** Prioritize lock unchanged.  
- **Tradeoffs:** Attention split across programs.

---

## Prior art (paths only)

- `docs/VISION.md` §5 · `docs/ARCHITECTURE.md` §8/§11/§14  
- `contracts/ask_response.schema.json` · Contract 7.2 schemas  
- `mecharag/garage_emit/emit.py` · receipts under `$HOME/var/mechanic_garage/receipts/`  
- `web/src/app/page.tsx` · `web/src/lib/retrieval/types.ts`  
- Orientation + hub prioritize notes  
- Stale: `docs/api_contracts.md`, `docs/multimodal_gemini_approach_plan.md`

---

## Evidence opened this Refine pass

- Re-read Gather context; ask UI citations; garage layout  
- Bronze sizes; Triumph/Transit page counts via pypdf; emit receipts empty_extract  
- Ram health (separate ops): **no fix needed** — see below  

### Friend Ram ops (snapshot — not SSOT; see hub briefing)

Critical review + ops (2026-07-25 late): earlier “healthy downloading 2016:3500” snapshot went **stale** — process died after Drive DNS during publish; local ZIP kept. Recovery = promote kept ZIP + Terminal continue. Durability code: `vehicle_docs_ingest/docs/2026-07-25_lemon_phase_a_durability_notes.md`.

### Critical review (2026-07-25)

**Pass with nits** — `docs/2026-07-25_critical_review_multimodal_roadmap_m1_m3.md`.

**P1s that Write M1 must lock (Tom agreed direction):**

1. Bronze PDF resolve via `documents.provenance` / Gold manifest — not filename guess from `document_id` alone.  
2. Ask joins **cache-only** visuals; rasterize on `/api/assets` or background — do not block ask on cold PDF render.  
3. Asset route vehicle-scoped (path traversal + cross-vehicle).

---

## Honest readiness — Write-dev-guide scores

| Track | Score | Ready to Write guide? | Why not 10 |
|-------|------:|-----------------------|------------|
| **M1** | **8.4 / 10** | **Yes** | Exact PNG size@150 DPI unmeasured; cold-page latency budget not spiked; optional sha-verify policy parked |
| **M2** | **6.8 / 10** | **Yes (design guide)** | Embed model + index migration shape + diagram-hit citation rule need Ready gates — guide must mark TBD |
| **M3** | **6.2 / 10** | **Yes (design guide)** | VLM ID + torque-grounding eval harness TBD — guide must mark TBD |
| **Mega “full multimodal” guide** | **0 / 10** | **No** | Forbidden — dishonest DoD |

**Ready for Write dev guide (M1)?** **Yes** (score 8.4) — next stage.  
**Implement?** **No** — parked until Tom Go and friend live disk clear enough.

**Status (2026-07-26 afternoon):** Write M1/M2/M3 Met · M1 **code landed** (Review Not Met) · M2/M3 Ready Not Met. **No M4** in VISION. Dual-program work is under **Waterfall** finish-line plan (not slice-by-slice Implement auth).

**SSOT stages:** M0 + M1 + M2 + M3 only (`docs/VISION.md` §5).

**Next (planning):** Waterfall package Ready deepening (M2/M3 TBD) → Program Ready → single Build Go. **Do not ask Implement** until then.
