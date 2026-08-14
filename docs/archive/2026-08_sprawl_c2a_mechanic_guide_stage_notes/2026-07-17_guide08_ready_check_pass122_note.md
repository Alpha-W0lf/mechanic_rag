> **ARCHIVED** — moved under Workflow OS documentation sprawl reform.
> Do not treat this file as living SSOT.
> Living successor: `docs/dev_guides/2026-07-17_dev_guide_08_harder_discriminative_ce_traps.md` · `docs/VISION.md` · `docs/ARCHITECTURE.md`
> Batch: `2026-08_sprawl_c2a_mechanic_guide_stage_notes`
> Date: 2026-08-13

# Ready-check note — Mechanic Guide 08 (pass 122)

**Date:** 2026-07-17  
**Repo:** `mechanic_rag`  
**Guide:** `docs/dev_guides/2026-07-17_dev_guide_08_harder_discriminative_ce_traps.md`  
**Context:** `docs/2026-07-17_guide08_harder_discriminative_ce_traps_context_summary.md`  
**Handoff:** `second_brain/docs/2026-07-17_spoke_mechanic_guide08_ready_check_pass122_handoff.md`

## Call

**READY for Implement** after hub Stage authorize. **Do not Implement in this stage.**

### Implement readiness

| Track | Score | Why not 10 |
|-------|-------|------------|
| Guide 08 T1-primary harder CE traps | **9.0 / 10** | Soft invent: exact synthetic section text/numbers and trap wording; twin-process eval is runtime proof. T1 may still yield flat delta — planned edge case, not a blocker. |

### Alignment

- Context problem (Guide 07 paraphrase + thin corpus) ↔ guide T1 + anti-paraphrase: **aligned**  
- Locks W / T1 / no auto-freeze / no public flip: **aligned**  
- Baseline verified: n=38, delta 0, §9 unchecked, LICENSE absent, 10 `###` today  

### Blast radius / rollback

Fixture + ingest + goldens + last_run + MODEL_FREEZE Guide 08 table + thin honesty — **not** ranking code. Rollback = revert commits + re-ingest.

### Edge cases

Covered in guide (flat / + / − delta; trap budget; no CE_TOP_K gaming; paraphrase reject).

### Microfix applied this Ready-check

DoD verify: require `synthetic` in fixture (not only legacy `demo`); anti-dup uses case ids.

### Explicit non-claims

No freeze invent. No public flip. No Implement started.
