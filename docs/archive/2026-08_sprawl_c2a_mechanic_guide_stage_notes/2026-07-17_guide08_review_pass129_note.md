> **ARCHIVED** — moved under Workflow OS documentation sprawl reform.
> Do not treat this file as living SSOT.
> Living successor: `docs/dev_guides/2026-07-17_dev_guide_08_harder_discriminative_ce_traps.md` · `docs/VISION.md` · `docs/ARCHITECTURE.md`
> Batch: `2026-08_sprawl_c2a_mechanic_guide_stage_notes`
> Date: 2026-08-13

# Review note — Mechanic Guide 08 (pass 129)

**Date:** 2026-07-17  
**Repo:** `mechanic_rag`  
**Implement:** `9bca871`  
**Guide:** `docs/dev_guides/2026-07-17_dev_guide_08_harder_discriminative_ce_traps.md`  
**Handoff:** `second_brain/docs/2026-07-17_spoke_mechanic_guide08_review_pass129_handoff.md`

## Call

**Shippable as-is.** Flat paired-ask delta after T1 is a **valid** DoD outcome. Do **not** invent CE lift or formal freeze.

### Verified

- T1: +3 synthetic-labeled confusable `###` (fixture now 13 sections)  
- Anti-paraphrase traps `g39`–`g44` (n=44); substrings in fixture; no exact question dups  
- Paired ask: n=44, hits 39/39, `ce_vs_rrf_ask_delta_hits=0`, CE-helps=0 / CE-hurts=0, `gemma4:e2b`, CE `classification`  
- MODEL_FREEZE Guide 08 table + candidates; VISION §9 freeze + public-flip still `- [ ]`  
- Honesty surfaces (INTERVIEW / GETTING_STARTED / README / ARCHITECTURE) cite n=44 flat  

### Soft residuals (not blocking)

1. Moderate lexical overlap g39↔g01 tokens — gold is new filler-cap section; not a Guide 07 paraphrase clone.  
2. `g44` both-miss — not CE-hurts; set still weakly discriminative for asymmetry.  
3. Future freeze evidence needs harder design or Tom override — out of this Review.

### Explicit non-claims

No freeze invent. No public flip. No Align self-start. No ranking redesign.
