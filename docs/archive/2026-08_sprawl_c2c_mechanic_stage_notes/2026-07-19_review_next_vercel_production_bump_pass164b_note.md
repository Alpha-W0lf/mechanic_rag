> **ARCHIVED** — moved under Workflow OS documentation sprawl reform.
> Do not treat this file as living SSOT.
> Living successor: `docs/VISION.md` · `docs/ARCHITECTURE.md` · living guides under `docs/dev_guides/`
> Batch: `2026-08_sprawl_c2c_mechanic_stage_notes`
> Date: 2026-08-13
# Review note — Soft Adjust Next/Vercel Production bump (pass 164b)

**Date:** 2026-07-19  
**Repo:** `mechanic_rag`  
**Implement:** `95ca4d7` (attestation docs `a8d5b3d`)  
**Guide:** `docs/dev_guides/2026-07-19_dev_guide_soft_adjust_next_vercel_production_bump_pass164.md`  
**Ready:** Go 9.0/10 — `docs/2026-07-19_ready_check_next_vercel_production_bump_pass164b_note.md` (`244f22b`)  
**Handoff:** `second_brain/docs/2026-07-19_spoke_mechanic_review_next_vercel_bump_pass164b_handoff.md`  
**Locks:** A / N1 / G1  

## Call

**PASS — shippable as-is** for Soft Adjust Next/Vercel Production bump. Matches Ready A/N1/G1. Thin Status Align this Review (guide → **Review Pass**). No Soft/Hard Adjust code. No Guide 16 / Next 16 / PrivateGold reopen.

### Verified against Ready A/N1/G1

| Check | Result |
|-------|--------|
| Shape **(A)** Next + Vercel Production Soft Adjust | **Pass** |
| Line **(N1)** 15.x ≥15.5.16 (prefer latest 15.5.x) | **Pass** — `next@15.5.20` · `eslint-config-next@15.5.20` |
| `next` stays dependency (not `-D`) | **Pass** — `next_in_dev=false` |
| Local build + vitest | **Pass** — Implement note (build green; 19 tests) |
| GHA CI | **Pass** — https://github.com/Alpha-W0lf/mechanic_rag/actions/runs/29708023598 **success** on `95ca4d7` |
| Vercel Production | **Pass** — deployment `5515177537` · SHA `95ca4d7` · **state=success** |
| Escalation N2 (Next 16) | **Not needed** |
| Scope / invent ban | **Pass** — no Guide 16, PrivateGold, Done claim |

### Align?

| Surface | Needed? |
|---------|---------|
| GETTING_STARTED / ARCHITECTURE / VISION pinned Next version strings | **No** — no stale `15.4.6` claims found |
| Guide Status → Review Pass | **Yes (thin)** — this Review |

**Align further?** **No** beyond Status Align.

### idle_ok? (deploy slice)

**Yes — idle_ok for Mechanic deploy Soft Adjust** after this Pass:

| Slice | Status |
|-------|--------|
| CI modality type conflict | Review Pass (`8ee6fbc` / Implement `43ffc4f`) |
| Next/Vercel Production bump | **Review Pass** (this note) |
| Tom bar: functional + deployed | **Met** for this deploy Soft Adjust |

Product Soft Adjust Guides 11–15 remain Met / parked (Vehicle `zero_gap` / Ford / Done still out). Do **not** invent Guide 16 to fill idle.

### Soft residuals (non-blocking)

1. Historical Vercel host slug `mechainic` — cosmetic.  
2. Attestation commit `a8d5b3d` is docs-only after Implement Met — fine.

### Explicit non-claims

- Not Guide 16 · Not dual-product Done · Not friend Gold  
- Not Next 16 Met · Not Vehicle/LEMON  

### QUALITY_STANDARD §5

Findings tied to Ready; spoke stayed in Review slice; invent ban held; honest Pass; deploy idle_ok justified.

### Stop

Review DoD Met (**Pass**). Deploy Soft Adjust **idle_ok**. Hub may Prioritize product Soft Adjust only if new unlock appears.
