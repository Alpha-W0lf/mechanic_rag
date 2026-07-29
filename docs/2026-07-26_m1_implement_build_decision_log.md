# M1 Implement — build decision log (Waterfall autonomy)

**Date:** 2026-07-26  
**Work item:** Mechanic M1 linked visuals  
**Guide:** `docs/dev_guides/2026-07-25_dev_guide_mechanic_m1_linked_visuals.md`

| Decision | Choice | Why | Blast radius |
|----------|--------|-----|--------------|
| GET render runtime | `pdftoppm` from Next (Poppler) | Same renderer family as locked `pdf2image`; avoids Python spawn path issues in Next | Local only; timeout 8s → 404 |
| Ask join | TS `buildVisualAssets` + DB provenance | Ask must not rasterize; mirror Python resolve rules | Soft-fail omit visuals |
| `MECHANIC_GARAGE_ROOT` | Wired in Python layout + TS `garageRoot()` | Guide lock | Env override |
| pdf2image | Added to main `pyproject` deps | Ready lock | Install needs Poppler on PATH |
| Audi live | Deferred until Ram process exits | Serialize LEMON live gates | Ops |

**Hard blockers encountered:** none for M1 code path.
