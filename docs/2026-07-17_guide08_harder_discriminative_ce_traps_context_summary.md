# Context: Guide 08 candidate — harder discriminative CE traps

**Date:** 2026-07-17  
**Repos:** `mechanic_rag`  
**Status:** **Aligned** (pass 130) + **Reviewed — shippable** (pass 129); Guide 08 T1 closed; freeze/public-flip unchecked  
**Handoff (Align):** `second_brain/docs/2026-07-17_spoke_mechanic_guide08_align_pass130_handoff.md`  
**Handoff (Review):** `second_brain/docs/2026-07-17_spoke_mechanic_guide08_review_pass129_handoff.md`  
**Review note:** `mechanic_rag/docs/2026-07-17_guide08_review_pass129_note.md`  
**Handoff (Implement):** `second_brain/docs/2026-07-17_spoke_mechanic_guide08_implement_pass124_handoff.md`  
**Guide:** `docs/dev_guides/2026-07-17_dev_guide_08_harder_discriminative_ce_traps.md`

### Outcome (Guide 08 T1 — current truth)

| Field | Value |
|-------|-------|
| n_cases | **44** |
| T1 sections | +3 synthetic confusable `###` |
| ce_vs_rrf_ask_delta_hits | **0** |
| CE-helps / CE-hurts | **0 / 0** |
| Embed / CE | **candidates** |
| Soft residual | Weakly discriminative for asymmetry; g44 both-miss; Review shippable |

**Mode last used:** spoke  
**Handoff (Gather):** `second_brain/docs/2026-07-17_spoke_mechanic_guide08_gather_pass121_handoff.md`  
**Handoff (Write):** `second_brain/docs/2026-07-17_spoke_mechanic_guide08_write_pass122_handoff.md`

**Prior closed:** Guide 05 keep; Guide 06 packaging; Guide 07 Path A; Guide 08 T1 (Review + Align).  
**VISION §9:** Formal embed/CE freeze **unchecked**; public flip **unchecked**.  
**Honesty:** Guide 08 `ce_vs_rrf_ask_delta_hits=0` (n=44; CE-helps=0 / CE-hurts=0). **Do not invent CE lift or freeze/public flip.**

---

## Problem

Mechanic’s freeze checklist is largely **process-satisfied**, but **evidence for locking** is still missing. Guide 07 Path A tried to create CE vs RRF asymmetry with +8 “discriminative” traps and failed:

| Evidence (Guide 07 — then-baseline; superseded by Guide 08) | Value |
|------------------------------------|-------|
| n_cases | 38 |
| `ce_vs_rrf_ask_delta_hits` | **0** |
| CE-helps / CE-hurts | **0 / 0** |
| Trap band g31–g38 | **8/8 both-hit** |
| Review residual | Several traps **near-paraphrase** prior easy both-hit goldens (e.g. g33≈g14, g34≈g21, g35≈g12) |

**Root cause (evidence-based, not vibe):** On a tiny synthetic corpus (~10 `###` sections / ~17 chunks), paraphrase traps do not create ranking disagreement. Both arms already place gold in the cited set. Path A grew *n* and documented an evidence attempt; it did **not** produce freeze-grade asymmetry.

Without either (a) **harder, non-paraphrase traps** (likely needing **synthetic confusable sections**), or (b) an explicit Tom **override freeze**, formal freeze stays parked — correctly.

---

## Acceptance criteria (for a later Guide 08 — not checked this Gather)

- [ ] Tom locks: **Write Guide 08** vs **park agent work** (freeze stays parked on Guide 05–07 honesty alone)  
- [ ] If Write: guide pins **anti-paraphrase** rules + trap classes that can create CE-helps (not empty-gold hard misses)  
- [ ] If Write: decide whether **synthetic confusable fixture sections** are allowed (fixtures-only; no OEM invent)  
- [ ] Metric SSOT unchanged: `ce_vs_rrf_ask_delta_hits` + CE-helps/hurts on citation∩gold; twin-process paired ask  
- [ ] **No auto-freeze** even if delta > 0; no public-flip claim; candidates stay candidates until separate Tom lock  
- [ ] Honesty surfaces updated only after a real re-baseline (if Implement ever runs)

---

## In scope (this Gather)

- Context summary for optional **Guide 08**: harder discriminative CE trap candidates  
- Document Guide 07 flat metrics + Review residual  
- Trap design options, risks, non-goals  
- Recommend Write vs park  
- Fill handoff Results  

## Out of scope

- Write / Refine / Implement Guide 08  
- Formal freeze claim; public flip; LICENSE invent  
- Ranking redesign / model swap / CE default flip  
- PrivateGold / Drive / Ford / second-vehicle catalog as DoD  
- Inventing CE lift language  
- Replacing Guide 05 keep-with-justification with freeze theater  

---

## Prior art (paths only)

- `mechanic_rag/docs/VISION.md` (§9 freeze + public flip unchecked)  
- `mechanic_rag/docs/ARCHITECTURE.md` (honesty line; n=44 flat)
- `mechanic_rag/evals/MODEL_FREEZE_STATUS.md` (Guide 08 current table; candidates; freeze parked)
- `mechanic_rag/evals/last_run_summary.json` (n=44; delta 0; helps/hurts 0)
- `mechanic_rag/evals/golden_fixture_v1.json` (g01–g38)  
- `mechanic_rag/evals/PATH_TO_30.md`  
- `mechanic_rag/fixtures/honda_s2000_demo/service_manual.txt` (~10 sections)  
- `mechanic_rag/docs/dev_guides/2026-07-17_dev_guide_07_freeze_evidence_discriminative_eval.md` (Reviewed — shippable)  
- `mechanic_rag/docs/2026-07-17_guide07_freeze_evidence_eval_context_summary.md` (Closed + Outcome)  
- `mechanic_rag/docs/dev_guides/2026-07-17_dev_guide_06_formal_freeze_packaging.md`  
- `mechanic_rag/docs/PUBLIC_FLIP_CHECKLIST.md`  
- `mechanic_rag/docs/dev_guides/2026-07-16_dev_guide_05_model_keep_honesty.md`  
- `second_brain/docs/2026-07-17_prioritize_hub_pass121.md`  
- `second_brain/docs/2026-07-17_hub_fanin_mechanic_align_pass119.md`  

---

## Why Guide 07 stayed flat (mechanics)

1. **Shared retrieve pool** — CE-on and RRF-only start from the same hybrid→RRF candidates; CE only reorders N→K. Asymmetry needs gold **in** the pool but **out** of RRF citation set, then **promoted** by CE (CE-helps), or the reverse (CE-hurts).  
2. **Paraphrase traps** — Questions nearly identical to existing both-hit cases do not stress that boundary.  
3. **Thin corpus** — Few sections → low competition; correct chunk often already cited on both arms.  
4. **Empty-gold hard misses** (`g10`, `g23`–`g25`) create both-miss only — they **cannot** create CE-helps.

---

## Trap design options (candidates for a future Guide 08)

| Option | Idea | Can create CE-helps? | Risk |
|--------|------|----------------------|------|
| **T1 — Synthetic confusable sections** | Add 1–3 fixture sections with overlapping lexical tokens but **different** gold facts (e.g. two torque specs; begin-open vs full-open already exists but is too easy). Author questions that share distractor keywords. | **Best chance** on this corpus | Eval gaming if golds are CE-probed; must remain fixture-grounded |
| **T2 — Adversarial wording only** | No new fixture text; craft questions that strongly match distractor headings while gold is elsewhere | Possible but **weak** on 10-section corpus (Guide 07 proved this) | Likely another flat run |
| **T3 — Lower effective citation depth / diagnose ranks** | Instrument or temporarily analyze RRF vs CE rank of gold (ops/eval diagnostics) before new goldens | Diagnostic only | Scope creep into harness if made DoD |
| **T4 — Second vehicle / wiring corpus** | Deferred PATH_TO_30 themes | Higher realism later | Large blast; out of Guide 08 default |
| **T5 — Park** | No Guide 08; keep Guide 05–07 honesty; freeze parked | N/A | Freeze remains open without override |

**Gather lean:** If Write happens, prefer **T1-primary** (minimal synthetic confusable sections + anti-paraphrase) over another T2-only band.

### Anti-paraphrase rules (soft pins for a future Write)

- New case must **not** be a near-rephrase of any existing `question` (Review residual list is the floor).  
- Prefer **single-primary** gold section; no g29/g30 multi-allow clones.  
- Notes must name: trap class, distractor section, why CE *could* diverge.  
- Forbid empty `allowed_*` as “lift path.”  
- Forbid CE-probe-as-gold without fixture substrings.

---

## Risks and blast radius

| Risk | Angle | Mitigation |
|------|-------|------------|
| Repeat Guide 07 theater | Portfolio / interview | Anti-paraphrase + optional T1; accept flat as valid outcome |
| Eval gaming | Metrics trust | Fixture-grounded substrings; Review rejects CE-tuned golds |
| Freeze invent after +delta | Portfolio | Soft pin no auto-freeze; §9 stays unchecked |
| Public-flip creep | Marketing | Out of scope |
| Synthetic section invent looking like OEM | Legal / honesty | Label synthetic; fixtures only |
| Ranking redesign temptation | Scope | Forbidden — evals only |
| Doc blast | Maintainers | Goldens, last_run, MODEL_FREEZE, PATH, honesty surfaces if Implement |
| Twin Next ops cost | Operator | Same Guide 07 twin pattern; not CI-mandatory |

**Blast radius if Implement later:** `golden_fixture_v1.json`, optional `fixtures/honda_s2000_demo/service_manual.txt`, ingest rehash, `last_run_summary.json`, `MODEL_FREEZE_STATUS.md`, thin honesty Align — **not** ranking code.

---

## Edge cases

| Case | Behavior |
|------|----------|
| Guide 08 still flat after hard traps | Success for *evidence attempt*; freeze stays parked; refresh keep note |
| Delta > 0 | Report helps/hurts; **stop**; Tom freeze lock is separate Stage |
| Delta < 0 | Document CE-hurts; freeze more forbidden |
| Cannot author ≥5 non-paraphrase traps without synthetic text | STOP for human — allow T1 or park |
| Temptation to freeze embed-only mid-guide | Out of default DoD — Tom lock only |
| Re-use g31–g38 themes | Reject unless question+gold+distractor materially harder |

---

## Unknowns (must resolve or escalate)

| Unknown | How to resolve | Blocking for Write? |
|---------|----------------|---------------------|
| Does Tom want another freeze-evidence attempt at all? | Decision 1 (Write vs park) | **Yes** |
| Are synthetic confusable sections allowed in fixtures? | Decision 2 | Soft for Write shape; hard if T2-only already failed |
| Minimum band size (+5 vs +8 vs diagnostic-first)? | Soft-pin at Refine | Soft |
| Is “any delta>0 + Tom lock” still the freeze bar? | Confirm (Guide 07 bar) | Soft — default keep |

---

## Recommended approach

1. **Do not claim freeze, lift, or public flip from this Gather.**  
2. **Honest call:** Guide 07 already spent a Path A attempt; repeating paraphrase traps is low expected value.  
3. **If Tom wants continued freeze-evidence work:** Write Guide 08 as **T1-primary** (minimal synthetic confusable sections + anti-paraphrase traps + paired re-baseline; no auto-freeze).  
4. **If Tom prefers portfolio focus elsewhere (Vehicle S9, other repos):** **Park** Mechanic agent work — freeze remains parked on Guide 05–07 honesty; no Guide 08 until a later Prioritize.  
5. **Default Gather recommendation:** see Open decisions — lean **park Write unless Tom locks T1-style Guide 08**.

---

## Open decisions (human)

**Closed (hub locks W + T1; Implement + Review + Align):** Path A/T1 delivered; n=44 flat; freeze remains parked; no auto-freeze. Soft residuals documented in Review note. No Guide 09 without new hub Prioritize.

Gather-era open-decision prose below is **superseded** by Outcome + this closed section.

---

## Evidence opened this pass (Gather — historical)

- Handoff `2026-07-17_spoke_mechanic_guide08_gather_pass121_handoff.md`  
- Prioritize hub pass 121; Align fan-in pass 119  
- Then-baseline: n=38, delta 0 (superseded by Guide 08 n=44)  

---

## Honest readiness (Align pass 130)

- **Guide 08:** Closed (Reviewed shippable + Align). Live SSOT cites n=44 flat.  
- **Not ready for freeze claim / public flip / Guide 09 invent.**  
- **Next:** hub Prioritize or idle; freeze stays parked until stronger evidence or Tom override.
