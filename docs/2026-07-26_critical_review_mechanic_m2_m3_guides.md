# Critical review — Mechanic M2 + M3 design guides

**Date:** 2026-07-26 (~00:30 local)  
**Mode:** multi-repo  
**Stage:** Critical review  
**Slice:** Multimodal roadmap docs — M2 retrieve + M3 vision guides  
**Artifacts:**  
- `docs/dev_guides/2026-07-26_dev_guide_mechanic_m2_multimodal_retrieve.md`  
- `docs/dev_guides/2026-07-26_dev_guide_mechanic_m3_vision_answers.md`  
- Cross-check: patched M1 guide (already reviewed)

**Stop:** Findings + tiny doc nits. No Implement.

### Declare

| Item | Value |
|------|-------|
| Will write | This review · optional one-line guide nits |
| Will **not** | Implement M2/M3 · freeze model IDs |

### Ops (not in scope)

Ram: **5/22** Met; downloading `ram:2017:3500`. Left alone.

---

## Verdict

**Pass with nits.** Both guides are appropriately **design-stage** (loud TBD gates, no fake Ready-for-Implement). They respect VISION staging and M1 asset reuse. Nits are stale “Next” pointers and one M3 dependency ambiguity — not blockers for M1 Ready or friend-docs Gather.

---

## Ranked findings

### P2 — M2 §9 “Next” still says Write M3 (already done)

**Evidence:** M2 guide §9 item 1.  
**Remediation:** Point to M3 path as written; next = Refine/Ready when Implement nears.

### P2 — M3 dependency “preferably M2” vs “after M1 only with reduced claim”

**Evidence:** Status line allows M3 after M1 only; Inputs say “retrieved via M1/M2.”  
**Risk:** Implement could assume M2 is required.  
**Remediation:** Lock: **M3 may ship after M1** if retrieval is text-only + M1 visuals; M2 is preferred for diagram-first questions but not a hard gate. Say so in one sentence.

### P2 — Query embed path for image channel underspecified (acceptable for design)

**Evidence:** M2 §4.B.2 “text→image tower or caption proxy — TBD.”  
**Remediation:** Keep TBD for Ready; do not pretend locked.

### P2 — No shared “channel tag” enum name

**Evidence:** Fusion talks about channel field; no single name (`retrieve_channel` vs extend modality).  
**Remediation:** Prefer new field `retrieve_channel: text_vector|lexical|image|fusion` at Ready — note only.

### What is strong

- TBD tables prevent silent model invention  
- Side-table preference protects text HNSW  
- Diagram-hit option A recommended (text owns specs)  
- M3 text-citation gate for torque is the right safety default  
- Degrade paths explicit  

---

## Decision flags (locked this pass with Tom’s proceed)

| Flag | Lock |
|------|------|
| M2/M3 remain docs-only until per-stage Ready + Go | **Yes** |
| M3 may follow M1 without M2 Met (reduced diagram-retrieve claim) | **Yes** |
| Proceed: title-only Gather + M1 Ready | **Yes** |

## Smallest remediation

1. Patch M2/M3 “Next” / M3 dependency one-liners. **Done 2026-07-26.**  
2. No code.
