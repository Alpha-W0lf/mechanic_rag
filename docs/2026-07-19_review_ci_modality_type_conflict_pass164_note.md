# Review note — Mechanic CI/Vercel RetrieverHit modality fix (pass 164)

**Date:** 2026-07-19  
**Repo:** `mechanic_rag`  
**Implement:** `43ffc4f`  
**Ready:** Go 9.2/10 — `docs/2026-07-19_ready_check_ci_modality_type_conflict_pass164_note.md` (`b148a11`)  
**Handoff:** `second_brain/docs/2026-07-19_spoke_mechanic_review_ci_modality_fix_pass164_handoff.md`  
**CI:** https://github.com/Alpha-W0lf/mechanic_rag/actions/runs/29707431878 — **success** on `43ffc4f`  

## Call

**PASS — shippable as-is** for the RetrieverHit modality type conflict fix. Matches Ready proposed rename. Thin Align this Review (ARCHITECTURE multimodal hook wording → `content_modality` vs channel `modality`). No Soft/Hard Adjust code. No Guide 16 / friend Gold / Vehicle / LEMON.

### Verified against Ready

| Check | Result |
|-------|--------|
| Rename `RetrievedChunk.modality` → `content_modality` | **Pass** — `web/src/lib/retrieval/types.ts` |
| Hit/result `modality` stays `vector\|lexical\|fusion` | **Pass** — `RetrieverHit` / `RrfResult` / `CeResult` / `ScoredResult` |
| Smallest change | **Pass** — 1 file, +2/−1 lines; no producer/test logic edits |
| Local / CI `pnpm run build` | **Pass** — GHA run **success**; Implement attested local build |
| Scope creep | **Pass** — no Guide 16, ranking reopen, PrivateGold, friend |
| Invent ban | **Pass** |

### Vercel (observable)

| Check | Result |
|-------|--------|
| Production deploy for `43ffc4f` | **Created** — deployment `5515060529` / `dpl_BNixY5m5m1WGnfDZJuABrEvfK7zW` |
| Build step | **Succeeded** — Next compile + typecheck + routes completed (`Build Completed in /vercel/output`) — modality fix effective on Vercel build |
| Deploy final state | **failure** — post-build gate: *“Vulnerable version of Next.js detected, please update immediately.”* |

**Honesty:** Modality type conflict is **fixed** for CI and for Vercel’s `next build`. Production **promote/deploy** remains blocked by a **separate** Next.js vulnerability policy — **out of Met** for this modality Soft Adjust; do not reopen as modality Soft Adjust Fail. Optional follow-on: bump Next (separate Soft Adjust / Prioritize) — not this Review’s code Soft Adjust.

### Soft residuals (non-blocking)

1. ARCHITECTURE §6.3 DB column still named `modality` for chunk content kind — OK (schema vocabulary); TypeScript split is the build fix.  
2. Vercel Production deploy failure on Next vulnerability — separate residual.  
3. Project URL slug still shows historical `mechainic` typo in Vercel host — cosmetic / ops, out of this slice.

### Status Align this Review

- ARCHITECTURE §11 multimodal hook: document `content_modality` vs retriever channel `modality`.

### Explicit non-claims

- Not Guide 16 · Not dual-product Done · Not friend Gold  
- Not Next.js major bump Met · Not Vehicle/LEMON  

### QUALITY_STANDARD §5

Findings tied to Ready; spoke stayed in Review slice; blast considered; invent ban held; honest Pass (thin Align only); Vercel residual documented without conflating Met.

### Stop

Review DoD Met (**Pass**). Align residual for Next bump is optional hub Prioritize — not required to close modality fix.
