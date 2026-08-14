> **ARCHIVED** — moved under Workflow OS documentation sprawl reform.
> Do not treat this file as living SSOT.
> Living successor: `docs/VISION.md` · `docs/ARCHITECTURE.md` · living guides under `docs/dev_guides/`
> Batch: `2026-08_sprawl_c2c_mechanic_stage_notes`
> Date: 2026-08-13
# Build checklist — Mechanic M1 Review (MR-1)

**Date:** 2026-07-26  
**Mode:** waterfall · **Stage:** Review implementation (**executed**)  
**Guide:** `docs/dev_guides/2026-07-25_dev_guide_mechanic_m1_linked_visuals.md`  
**Review note:** `docs/2026-07-26_review_mechanic_m1_linked_visuals.md`  
**Verdict:** **Pass · MR-1 Met**

### Correctness / contract

- [x] `ask_response.schema.json` includes optional `visual_assets` with required fields  
- [x] Ask returns `visual_assets: []` on insufficient_evidence / no bronze  
- [x] Ask **never** rasterizes (no `ensure_page_png` / pdftoppm on ask path)  
- [x] Href emitted only when bronze+page resolvable  
- [x] Page cap: `page_start..min(page_end, page_start+2)`

### Security

- [x] Path traversal on vehicle_id / document_id / locator → reject / omit / 400  
- [x] Asset route scopes by `vehicle_id` + DB document row  
- [x] Bronze resolve stays under garage root

### Ops / assets

- [x] Cache hit skips render (unit evidence)  
- [x] GET miss: pdftoppm ≤8s or 404  
- [x] Triumph sample PNG size noted (**227308** bytes @150 DPI)  
- [x] No OEM PNG under git (`git status` clean of garage assets)

### Tests / UI

- [x] `tests/test_page_assets.py` green (8)  
- [x] `web` `page_assets.test.ts` green (5)  
- [x] Ask ablation / visual tests green (10 in `tests/`)  
- [x] UI renders images under citations when href present; empty list unchanged

### Docs

- [x] ARCHITECTURE §8 mentions M1 `visual_assets`  
- [x] GETTING_STARTED note or curl for asset GET  
- [x] Decision log present for TS pdftoppm judgment
