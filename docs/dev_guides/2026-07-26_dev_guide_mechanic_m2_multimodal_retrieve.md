# Dev guide — Mechanic M2 multimodal retrieve (design)

**Date:** 2026-07-26  
**Repo:** `mechanic_rag`  
**Work item:** M2 — also retrieve via image/caption channels; fuse ID lists with text path  
**Stage that authored this:** Write dev guide  
**Status:** Design guide Met · Ready prep Met · **Embed data Met** (full `cat:*`, 2026-07-26T23:34Z) · ask/RRF channel landed · **C1 ablation Met** · **Review Met** (Pass-with-nits, 2026-07-27) · D1 Align optional  
**Depends on:** M1 Review Met · VISION §5 · ARCHITECTURE §11  
**Review:** `docs/2026-07-27_review_mechanic_m2_multimodal_retrieve.md`  
**C1 evidence:** `docs/2026-07-26_m2_paired_image_ablation_evidence.json`  
**Ready freeze:** `docs/2026-07-26_ready_prep_mechanic_m2_multimodal_retrieve.md` · spike `docs/2026-07-26_spike_evidence_m2_fixture_embed.json`  
**Context SSOT:** `docs/2026-07-25_mechanic_rag_multimodal_roadmap_m1_m3_context_summary.md`  
**M1 guide:** `docs/dev_guides/2026-07-25_dev_guide_mechanic_m1_linked_visuals.md`  
**Lens:** Senior AI eng (hybrid retrieval / fusion / eval honesty) + ML (embedding index) + backend  
**Embed scope (Build lock):** full personal garage `cat:*` (not fixture-only)
### Declare (Write)

| Item | Value |
|------|-------|
| Will write | This guide |
| Will **not** | Implement M2 · M3 VLM · reopen M0 CE freeze |

### Ready gates (frozen 2026-07-26)

| Gate | Status | Closes at |
|------|--------|-----------|
| Local image embed model ID + dim | **Frozen** `openai/clip-vit-base-patch32` · **512-d** | Ready spike Met |
| Side table vs nullable column | **Side table** `chunk_image_embeddings` | Ready |
| Fusion weights / k | Soft equal RRF until Build ablation | Build C1 |
| Diagram-only hit citation rule | **Option A locked** | Ready |
| Multimodal CE | **Out** — text-pair CE only unless separate decision | — |
| Query tower | CLIP text tower (same model) | Ready |

---

## 1. Objective

M1 shows page images joined to **text** hits. M2 adds a second retrieval channel so diagram-heavy questions can surface the right pages even when text OCR/captions are weak.

**Honest ship claim (M2):** Hybrid text retrieve remains; an image (or caption) channel can contribute chunk/page IDs; fusion merges ID lists; CE still scores **text** pairs; evals show lift vs M1-only on diagram-first goldens — or Tom records a justified keep without fake lift.

**Out of Met:** M3 vision answers · cloud CLIP APIs as required path · claiming “vision RAG” as default without evals · rewriting M0 text index dims blindly.

---

## 2. Locked design defaults (docs)

| Topic | Locked for docs |
|-------|-----------------|
| Depends on | **M1** assets + locators (`document_id`, `page_*`, asset store) |
| Fusion | Modality-agnostic **ID-list** fusion (extend RRF-style; channel field ≠ content_modality) |
| CE | Remains **text-pair** CE |
| Index | Prefer **side table** / separate collection for image embeddings (avoid mutating 768-d text HNSW assumptions) |
| Embed input | Page PNG from M1 asset cache (or caption text as weaker interim — prefer image) |
| Public CI | Synthetic tiny images only; no OEM |
| Portfolio | Fixtures prove channel wiring; private garage optional smoke |

---

## 3. DRY / architecture constraints

1. **Business rule:** A retrieval hit is an ID (+ channel tag). Fusion ranks IDs; it does not embed pixels into the text vector column.  
2. Reuse M1 `asset_path` / ensure-cache; do not invent a second asset tree.  
3. Do not overload `RetrieverHit.modality` (vector|lexical|fusion) with `content_modality` (text|image|table).  
4. Prefer ≤300 lines/file; hard max 400.  
5. Eval honesty: paired M1-only vs M1+M2 on the same goldens.

---

## 4. Recommended approach (Implement later)

### A. Image index build

- Offline/batch job: for pages with assets (or Triumph-first), embed PNG → store `(vehicle_id, document_id, page, chunk_id?, embedding, model, dim)`.  
- Link to text chunks that share locators when possible (page-scoped garage units make this natural).

### B. Query path

1. Text vector + lexical as today → ID lists.  
2. Embed query with **same** image-space model (text→image tower or caption proxy — TBD at Ready).  
3. Image ANN top-k → ID list.  
4. Fuse ID lists (RRF-style).  
5. CE on text pairs for fused candidates that have text.  
6. Ask/citations unchanged shape; M1 `visual_assets` href join still applies.

### C. Diagram-only hit rule (**locked at Ready prep 2026-07-26**)

| Option | Behavior | Tradeoff |
|--------|----------|----------|
| **A (LOCKED)** | Require a paired text chunk for citation/answer; image channel only reorders/boosts | Safer torque grounding |
| B | Allow image-only cite with explicit “diagram hit” label + force visual href | Riskier for numeric specs — **out** this finish line |

### D. Evals

- New diagram-first goldens (fixture-first).  
- Metrics: citation∩gold / Recall@k; paired lift vs M1-only.  
- Do not invent numeric pass thresholds without baseline.

---

## 5. Ordered Implement checklist (when Tom Go + M2 Ready)

- [x] **A1.** Freeze image embed model ID/dim after fixture spike; record in ARCHITECTURE.  
- [x] **A2.** Migration: side table + index (HNSW or equiv). (`db/migrations/002_chunk_image_embeddings.sql` applied)  
- [x] **A3.** Batch embed CLI for full garage `cat:*` pages (idempotent). (`mecharag embed-images`; Terminal starter)  
- [x] **B1.** Query image channel + fusion into existing ask pipeline. (`reciprocalRankFusionMany` + `retrieveImageChannel`)  
- [x] **B2.** Lock diagram-hit rule (**A** — Ready prep 2026-07-26).  
- [x] **C1.** Diagram-first goldens + paired ablation harness (`evals/golden_m2_diagram_stubs_v1.json` executable Triumph cases + `scripts/m2_paired_image_ablation.py`). Run evidence after index covers gold pages.  
- [ ] **D1.** Align docs; VISION ship claim honesty (optional post-Review).

---

## 6. Definition of Done

- [x] Image channel + fusion wired; text path still works if image index empty/degraded  
- [x] Degrade: image embed down → M1/M0 behavior + diagnostic  
- [x] Fixture evals honest (lift or recorded keep)  
- [x] No OEM in git  
- [x] M3 still Not Met  
- [x] Review implementation Pass / Pass-with-nits (`docs/2026-07-27_review_mechanic_m2_multimodal_retrieve.md`)

---

## 7. Blast radius / risks

| Risk | Mitigation |
|------|------------|
| Dim/model mismatch vs text 768 | Side table; fail closed on dim |
| Disk/CPU for full-fleet embed | Full `cat:*` garage authorized (Settings Available + ops note); Terminal embed; skip pages without chunks/PNG |
| Fake multimodal claims | Eval gate |
| Citation from image-only | Prefer option A |
| Multi-vehicle HNSW post-filter empty hits | `imageSearch` raises `hnsw.ef_search` (default 200) |

## 8. Edge cases

- No PNG for page → skip image index row  
- Empty image index → fusion = text-only  
- Query embed timeout → degrade  
- Cross-vehicle filter must apply to image hits  
- HNSW + vehicle filter at low `ef_search` → empty image list (mitigated)

---

## 9. Next

1. **M3 Implement** unlocked: `docs/dev_guides/2026-07-26_dev_guide_mechanic_m3_vision_answers.md`.  
2. Optional D1 Align (VISION ship-claim honesty).  
3. Prefer field name: `retrieve_channel: text_vector|lexical|image|fusion`.

**Implement M2?** **Met** (Pass-with-nits Review 2026-07-27).
