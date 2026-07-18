# Ready-check note — Mechanic Guide 10a PolyForm-NC (pass 155)

**Date:** 2026-07-18  
**Repo:** `mechanic_rag`  
**Stage:** Ready check before code  
**Guide:** `docs/dev_guides/2026-07-18_dev_guide_10a_polyform_nc_license_packaging.md`  
**Context:** `docs/2026-07-18_license_public_flip_path_context_summary.md`  
**Decision note:** `second_brain/docs/2026-07-18_license_polyform_nc_decision_note.md`  
**Handoff:** `second_brain/docs/2026-07-18_spoke_mechanic_ready_polyform_nc_pass155_handoff.md`  
**Locks:** PolyForm Noncommercial 1.0.0 (`PolyForm-Noncommercial-1.0.0`) · **P1** (LICENSE only; no §9 public flip)  
**Supersedes:** pass-153 MIT Ready (`docs/2026-07-18_guide10a_ready_check_pass153_note.md` — **STALE**)

## Call

**READY for Implement** after hub / human Stage authorize. **Do not Implement in this stage.**

Implement (when authorized) adds root **verbatim** PolyForm-NC `LICENSE` + gate 6 / honesty surfaces. Must label **source-available / non-commercial** (not OSI open source / not MIT). VISION §9 public-flip stays `[ ]`. Freeze-override honesty must not regress.

### Implement readiness

| Track | Score | Why not 10 |
|-------|-------|------------|
| Guide 10a PolyForm-NC LICENSE packaging (P1) | **9.2 / 10** | Implement must fetch/copy **verbatim** official PolyForm-NC text (fidelity / notice placement craft). Source-available vs “open source” honesty wording is craft across README / GETTING_STARTED / INTERVIEW. Multi-surface “LICENSE absent” cleanup + anti-MIT/OSI-mislabel `rg` residual. Optional commercial-contact sentence craft. |

**Vs stale MIT Ready (9.4):** Slightly lower — Noncommercial body fidelity + anti-mislabel bar are stricter than MIT peer-copy. Still READY; not blocking.

**Not inflated:** Soft Adjust pins locked; SPDX + official URL pinned; P1 / freeze / §9 constraints clear; blast/rollback clear.

### Alignment (context ↔ guide ↔ live truth)

| Check | Status |
|-------|--------|
| LICENSE = PolyForm-NC 1.0.0 (not MIT) | **Aligned** — Soft Adjust pass 154 |
| P1 LICENSE-only (no public flip) | **Aligned** |
| Source-available / non-commercial honesty | **Pinned** in guide |
| Freeze override / n=44 delta 0 | **Aligned** — must retain |
| Pre-Implement LICENSE absent | **Verified** — `test ! -f LICENSE` |
| VISION §9 freeze / public-flip | **Verified** — freeze `[x]` · public-flip `[ ]` |
| MIT Ready note | **STALE** — do not Implement from it |
| Guide 10b out of Met | **Aligned** |

### Evidence verified this Ready-check

| Item | Live |
|------|------|
| `LICENSE` | **Absent** (correct pre-Implement) |
| Guide path | `…_polyform_nc_license_packaging.md` present |
| VISION §9 freeze | `[x]` Guide 09 Tom override |
| VISION §9 public flip | `[ ]` |
| Pass-153 Ready | Bannered STALE |

### Blast radius / rollback

**Blast:** root `LICENSE` (verbatim PolyForm-NC), `PUBLIC_FLIP_CHECKLIST` gate 6, thin README / GETTING_STARTED / INTERVIEW / VISION prose — **not** ranking/eval/fixtures.

**Rollback:** Delete `LICENSE`; revert doc commits; restore “LICENSE absent.”

### Edge cases (guide covers)

- Unexpected existing LICENSE (e.g. accidental MIT) → stop / escalate  
- OSI “open source” / MIT mislabel → hard fail Review  
- §9 public-flip tick → hard fail  
- Paraphrased LICENSE body → hard fail  
- Guide 10b creep → out of Met  

### Refinements still required before Implement?

**None blocking.**

### Explicit non-claims (this stage)

- No Implement started  
- No LICENSE file created  
- No public flip / v1 Done  
- No MIT as current license claim  
- No freeze honesty change  

### Stop

Ready DoD Met. Wait for human Implement authorize.
