> **ARCHIVED** — moved under Workflow OS documentation sprawl reform.
> Do not treat this file as living SSOT.
> Living successor: `docs/VISION.md` · `docs/ARCHITECTURE.md` · living guides under `docs/dev_guides/`
> Batch: `2026-08_sprawl_c2c_mechanic_stage_notes`
> Date: 2026-08-13
# M1 pre-Review evidence (planning uplift — not Review Met)

**Date:** 2026-07-26 ~15:00  
**Mode:** waterfall · **Stage:** Ready deepen / Review prep  
**Checklist:** `docs/2026-07-26_build_checklist_mechanic_m1_review.md`  
**Stop:** Evidence mapping only — **Review Met** still requires Build Go execution of full checklist

### Tests (this machine)

| Command | Result |
|---------|--------|
| `pytest tests/test_page_assets.py` | **8 passed** |
| `vitest run page_assets` | **5 passed** |
| `pytest -k 'visual or page_asset or ask'` | **10 passed** |

### Code / contract mapping (read evidence)

| Checklist item | Evidence | Pre-Review |
|----------------|----------|------------|
| Schema `visual_assets` required fields | `contracts/ask_response.schema.json` required chunk_id, document_id, page_start, content_type, href | **Likely Pass** |
| Ask empty on insufficient_evidence | `web/src/server/ask.ts` returns `visual_assets: []` on early exits (~204, ~284) | **Likely Pass** |
| Ask never rasterizes | `ask.ts` calls `buildVisualAssets` only; `ensure_page_png` / pdftoppm only in `page_assets.ts` GET path | **Likely Pass** |
| Page cap +2 | `citationPages` in `page_assets.ts` `min(end, pageStart+2)` | **Likely Pass** |
| Traversal reject | `tests/test_page_assets.py` `test_reject_traversal`, `test_resolve_bronze_traversal` | **Likely Pass** |
| ARCHITECTURE mentions M1 | ARCHITECTURE §8 / multimodal notes cite `visual_assets` + ask never rasterizes | **Likely Pass** |
| GETTING_STARTED asset curl | **Missing** — Align MR-4 | Soft nit |
| Decision log | `docs/2026-07-26_m1_implement_build_decision_log.md` present | **Likely Pass** |

**MR-1 Implement readiness (planning):** **9.0 / 10** — full Review Pass still Build; GETTING_STARTED gap → MR-4.
