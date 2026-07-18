# Ready-check note — Mechanic Guide 09 Path B freeze-override (pass 152)

**Date:** 2026-07-18  
**Repo:** `mechanic_rag`  
**Stage:** Ready check before code  
**Guide:** `docs/dev_guides/2026-07-18_dev_guide_09_tom_freeze_override_packaging.md`  
**Context:** `docs/2026-07-18_path_to_formal_freeze_public_flip_context_summary.md`  
**Handoff:** `second_brain/docs/2026-07-18_spoke_mechanic_ready_freeze_override_pass152_handoff.md`  
**Lock:** Path **B** (Tom freeze-override packaging; not discriminative goldens redux)

## Call

**READY for Implement** after hub / human Stage authorize. **Do not Implement in this stage.**

Implement (when authorized) will flip embed/CE status → **frozen (Tom override)** with mandatory n=44 `ce_vs_rrf_ask_delta_hits=0` honesty — **not** an earned-lift claim. Public flip + LICENSE remain **out of Met**.

### Implement readiness

| Track | Score | Why not 10 |
|-------|-------|------------|
| Guide 09 Path B freeze-override packaging (docs-only) | **9.2 / 10** | Exact FAQ / banner voice is craft at Implement (required honesty sentences are pinned, wording still authored). Multi-surface Align (MODEL_FREEZE + VISION §9 + INTERVIEW / GETTING_STARTED / README / ARCHITECTURE / PUBLIC_FLIP gate 4) has residual contradiction risk if a “candidate” / “parked” line is missed — mitigated by Phase C + verification `rg`, not zero. No Refine-dev-guide pass (acceptable for thin docs guide; residual polish only). |

**Not inflated:** Docs-only + Path B locked + placements pinned + evidence verified → high 9s. Not 10 because Implement still authors multi-file prose and must not accidentally invent lift or flip public.

### Alignment (context ↔ guide ↔ live truth)

| Check | Status |
|-------|--------|
| Path B override (not Guide-08-redux goldens) | **Aligned** — Tom lock pass 152; guide soft pins |
| n=44 delta 0 honesty mandatory | **Aligned** — guide pins; live `last_run_summary.json` verified this Ready-check |
| Status→frozen only with override label | **Aligned** — never “frozen because CE lift” |
| §9 freeze may check; public-flip stays open | **Aligned** |
| LICENSE invent | **Forbidden / out of Met** — `LICENSE` still absent |
| Freeze Met at Ready-check | **No** — Ready only; freeze Met is Implement DoD |

### Evidence verified this Ready-check

| Field | Live value |
|-------|------------|
| n_cases | 44 |
| rrf_only_ask_hits / ce_ask_hits | 39 / 39 |
| ce_vs_rrf_ask_delta_hits | **0** |
| CE model / mode | `Xenova/ms-marco-MiniLM-L-6-v2` / `classification` |
| generator | `gemma4:e2b` |
| degrade_rate / avg_ce_latency_ms | 0.0 / ≈129.8 |
| MODEL_FREEZE status tables | Still **candidate** (correct pre-Implement) |
| VISION §9 freeze / public-flip | Both still `[ ]` (correct pre-Implement) |
| LICENSE | **Absent** |

### Blast radius / rollback

**Blast:** `evals/MODEL_FREEZE_STATUS.md`, `docs/VISION.md` §9, INTERVIEW / GETTING_STARTED / README / ARCHITECTURE honesty, thin `PUBLIC_FLIP_CHECKLIST` gate 4 — **not** ranking/eval/fixture code.

**Rollback:** Revert doc commits; restore candidate tables + §9 freeze unchecked.

### Edge cases (guide covers)

- Claiming CE lift while freezing → hard fail Review  
- Checking public flip / inventing LICENSE in same delivery → hard fail  
- Embed-only freeze → stop for new lock (default = both)  
- Stale “parked / candidate” lines → Phase B4 / C fix  
- Discriminative golden growth → out of scope  

### Refinements still required before Implement?

**None blocking.** Optional (not required): short Refine for FAQ sentence voice only — do not reopen Path A / public flip.

### Explicit non-claims (this stage)

- No Implement started  
- No freeze Met  
- No earned lift  
- No public flip / LICENSE invent  
- No ranking code  

### Stop

Ready DoD Met. Wait for human Implement authorize.
