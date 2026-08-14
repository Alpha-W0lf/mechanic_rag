> **ARCHIVED** — moved under Workflow OS documentation sprawl reform.
> Do not treat this file as living SSOT.
> Living successor: `docs/VISION.md` · `docs/ARCHITECTURE.md` · living guides under `docs/dev_guides/`
> Batch: `2026-08_sprawl_c2c_mechanic_stage_notes`
> Date: 2026-08-13
# Review — Mechanic M1 linked visuals (MR-1)

**Date:** 2026-07-26 ~15:10 local  
**Mode:** waterfall · **Stage:** Review implementation  
**Guide:** `docs/dev_guides/2026-07-25_dev_guide_mechanic_m1_linked_visuals.md`  
**Checklist:** `docs/2026-07-26_build_checklist_mechanic_m1_review.md`  
**Build Go:** issued Tom 2026-07-26

### Verdict: **Pass**

Correctness, security, and tests Met. Docs Align soft (GETTING_STARTED asset curl) remediated in this Review.

### Checklist evidence

| Item | Evidence | Result |
|------|----------|--------|
| Schema visual_assets | `contracts/ask_response.schema.json` required fields | Pass |
| Ask empty on insufficient | `ask.ts` ~204, ~284 `visual_assets: []` | Pass |
| Ask never rasterizes | no `ensure_page_png` in `ask.ts`; only `buildVisualAssets` | Pass |
| Href when bronze resolvable | `buildVisualAssets` + vitest | Pass |
| Page cap +2 | `citationPages` vitest `[5,6,7]` | Pass |
| Traversal | pytest + vitest reject `../` | Pass |
| Asset route scoped | `web/src/app/api/assets/[vehicle_id]/[document_id]/[page]/route.ts` | Pass |
| Cache hit skips render | `test_ensure_cache_hit_skips_render` | Pass |
| pdftoppm on PATH | 25.08.0 | Pass |
| Triumph PNG | `~/var/mechanic_garage/assets/.../page_00001.png` **227308 bytes** (~222 KiB; prior note ~227 KiB class) | Pass |
| No OEM PNG in git | status has no garage asset paths | Pass |
| pytest page_assets | **8 passed** | Pass |
| vitest page_assets | **5 passed** | Pass |
| ask/visual tests | **10 passed** (`tests/`) | Pass |
| UI images | `page.tsx` renders `<img src={v.href}>` | Pass |
| ARCHITECTURE M1 | §8 visual_assets note | Pass |
| GETTING_STARTED | asset curl comment added 2026-07-26 | Pass |
| Decision log | `docs/2026-07-26_m1_implement_build_decision_log.md` | Pass |

**Nits:** none blocking. Root-level legacy `test_chunking.py` / `test_parser.py` collection errors are pre-existing OUT of M1 scope.

**MR-1 Met.** Next: VD-1 Audi live (Terminal.app).
