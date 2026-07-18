# Context: Path to formal freeze + public flip (honest)

**Date:** 2026-07-18  
**Repos:** `mechanic_rag`  
**Status:** **Closed** — Guide 09 Path B Implement+Review+Align (pass 152); freeze Met by Tom override; public flip still open  
**Mode last used:** spoke  
**Handoff (Align):** `second_brain/docs/2026-07-18_spoke_mechanic_align_freeze_override_pass152_handoff.md`  
**Handoff (Gather):** `second_brain/docs/2026-07-18_spoke_mechanic_gather_freeze_flip_pass151_handoff.md`  
**Hub:** `second_brain/docs/2026-07-18_prioritize_hub_pass151.md`  
**Lens:** AI engineer (RAG eval honesty) + portfolio packaging  
**Guide:** `docs/dev_guides/2026-07-18_dev_guide_09_tom_freeze_override_packaging.md`

**VISION §9 (live after Guide 09 + 10a):** Formal embed/CE freeze **checked** (Tom override; n=44 delta 0); public flip / “v1 Done” **unchecked**; LICENSE **Met** Guide 10a PolyForm-NC (source-available / non-commercial — LICENSE Met ≠ flip).  
**Honesty banner:** Checklist ≠ freeze ≠ LICENSE ≠ public flip. Flat paired-ask delta ≠ earned freeze. Guide 05 keep ≠ freeze. Guide 09 override freeze ≠ public flip.

### Outcome (Guide 09 Path B — freeze; Guide 10a P1 — LICENSE)

| Field | Value |
|-------|-------|
| Freeze path | **B** — Tom override packaging |
| Embed / CE status | **Frozen (Tom override — flat delta; no lift claim)** |
| Evidence | n=44, `ce_vs_rrf_ask_delta_hits=0`, helps=0/hurts=0 |
| VISION §9 freeze | `[x]` |
| VISION §9 public flip | `[ ]` |
| LICENSE | **Met** — PolyForm-NC 1.0.0 Guide 10a (`a36303f`; Review `989828f`) |
| Guide 09 Implement / Review | `531668d` / shippable `f699f75` |

Below: Gather-era framing retained for history.

---

**Date:** 2026-07-18  
**Repos:** `mechanic_rag`  
**Status (Gather-era):** Draft (Gather — pass 151 spoke) — superseded by Outcome above  
**Mode last used:** spoke  
**Handoff:** `second_brain/docs/2026-07-18_spoke_mechanic_gather_freeze_flip_pass151_handoff.md`  
**Hub:** `second_brain/docs/2026-07-18_prioritize_hub_pass151.md`  
**Lens:** AI engineer (RAG eval honesty) + portfolio packaging

**VISION §9 (Gather-era):** Formal embed/CE freeze **unchecked**; public flip / “v1 Done” **unchecked**.  
**Honesty banner:** Checklist ≠ freeze ≠ public flip. Flat paired-ask delta ≠ freeze. Guide 05 keep ≠ freeze.

---

## Problem

Portfolio build toward 100% still has two open VISION §9 boxes on Mechanic:

1. **Formal freeze** — declare embedding + cross-encoder (CE) model IDs **locked** for portfolio ranking claims.  
2. **Public flip** — marketing / “v1 Done” claim after packaging gates.

Current evidence does **not** earn a freeze from lift:

| Evidence era | n | `ce_vs_rrf_ask_delta_hits` | CE-helps / CE-hurts | Status |
|--------------|---|---------------------------|---------------------|--------|
| Guide 04 | 30 | **0** | 0 / 0 | candidate |
| Guide 07 Path A | 38 | **0** | 0 / 0 | candidate |
| Guide 08 T1 (current) | **44** | **0** | **0 / 0** | **candidate** |

Verified this Gather from `evals/last_run_summary.json`: both_hit=39, both_miss=5 (`g10`, `g23`–`g25`, `g44`), CE-helps=0, CE-hurts=0. Generator `gemma4:e2b`; CE `Xenova/ms-marco-MiniLM-L-6-v2` / `classification`; `degrade_rate=0.0`.

Two freeze-evidence attempts already shipped (Guide 07 paraphrase-ish traps; Guide 08 synthetic confusable sections + anti-paraphrase traps). Both stayed flat. Formal freeze remains **parked** until **stronger asymmetry** or an **explicit Tom override**. Public flip remains a **separate** Tom lock; `LICENSE` is still **absent**.

---

## Acceptance criteria

- [ ] Written honest path: freeze unlock options + public-flip prerequisites (no fake lift)  
- [ ] Recommendation locked by Tom: **(A) new discriminative goldens** vs **(B) Tom freeze-override packaging** (this Gather recommends; Tom decides)  
- [ ] If (A): next guide must be **qualitatively harder** than Guide 07–08 (not redux)  
- [ ] If (B): docs-only override packaging with mandatory no-lift honesty; status→frozen only after Tom authors freeze  
- [ ] Public flip treated as **gate 3** after freeze decision + LICENSE + checklist re-verify — never auto-flipped  
- [ ] Forbidden: invent CE lift; freeze on proxy `+1`/`n=5`; claim Guide 06–08 closed §9; invent LICENSE without Tom choice  

---

## In scope (this Gather)

- Map freeze SSOT + public-flip checklist + VISION §9 + Guide 05–08 honesty  
- Recommend discriminative goldens vs Tom freeze-override  
- Context under `mechanic_rag/docs/`  
- Fill handoff Results  

## Out of scope

- Implement / ranking code / model swaps / reindex  
- Claiming freeze Met or flipping VISION §9  
- Inventing LICENSE or CE lift language  
- PrivateGold / Drive / Ford / OEM PDFs  
- Full Write-dev-guide body (next stage after Tom locks path)  

---

## Prior art (paths only)

- `evals/MODEL_FREEZE_STATUS.md` — candidates; freeze checklist; keep note; Guide 08 n=44 flat; override language  
- `evals/last_run_summary.json` — n=44; delta 0; helps/hurts 0 (verified)  
- `evals/golden_fixture_v1.json` — g01–g44  
- `evals/PATH_TO_30.md` — ≥30 met; deferred second vehicle / wiring  
- `docs/PUBLIC_FLIP_CHECKLIST.md` — six gates; LICENSE unmet; flip ≠ checklist  
- `docs/VISION.md` §9 — freeze + public flip unchecked  
- `INTERVIEW.md` §5–§8 — candidates; flat after Guide 08; packaging ≠ flip  
- `docs/dev_guides/2026-07-16_dev_guide_05_model_keep_honesty.md` — keep ≠ freeze  
- `docs/dev_guides/2026-07-17_dev_guide_06_formal_freeze_packaging.md` — three gates; park freeze  
- `docs/dev_guides/2026-07-17_dev_guide_07_freeze_evidence_discriminative_eval.md` — Path A closed flat  
- `docs/dev_guides/2026-07-17_dev_guide_08_harder_discriminative_ce_traps.md` — T1 closed flat  
- `docs/2026-07-17_guide07_freeze_evidence_eval_context_summary.md`  
- `docs/2026-07-17_guide08_harder_discriminative_ce_traps_context_summary.md`  
- `docs/2026-07-17_guide08_review_pass129_note.md` — soft residual: weakly discriminative  
- `fixtures/honda_s2000_demo/service_manual.txt` — 13 `###` sections after T1  
- `scripts/checks/public_fail_closed.py` — flip gate 1 reference  
- Hub pass 151: 100% may require override **or** new discriminative goldens if evidence stays flat  

---

## Three gates (do not collapse)

| Gate | Meaning | Current |
|------|---------|---------|
| **1 Keep-in-stack** | CE present; candidates; Guide 05 honesty | **Done** |
| **2 Formal freeze** | Human locks embed/CE IDs for portfolio claims | **Open / parked** — flat n=44 |
| **3 Public flip** | VISION §9 “v1 Done” marketing | **Open** — LICENSE absent; separate Tom lock |

Freeze checklist process fields (paired ask, citation∩gold, CE id/mode, degrade, n≥30, forbid proxy) are largely **satisfied**. Missing piece is **evidence that justifies locking** — or an explicit override that freezes **without** claiming lift.

---

## Unlock paths (honest)

| Path | What it is | Earns freeze? | Earns public flip? |
|------|------------|---------------|--------------------|
| **A — New discriminative goldens** | Qualitatively harder eval/corpus so CE-helps or CE-hurts can appear; re-baseline; still human freeze after | Only if asymmetry + Tom freeze authoring | No — flip still separate |
| **B — Tom freeze-override packaging** | Docs-only: Tom locks freeze despite flat delta; keep “no lift” sentences | Yes — by explicit override | No — flip still separate |
| **C — Stay parked** | Leave §9 freeze unchecked; keep candidates | No | No |
| **D — Public flip with candidates** | Flip marketing while models stay candidates (explicit banner) | N/A | Only with Tom lock + LICENSE + checklist — high interview risk |

### Why Guide 07–08 did not unlock freeze

1. Shared retrieve pool → CE only reorders N→K; asymmetry needs gold **in pool, out of RRF citation set** (or reverse).  
2. Guide 07 traps near-paraphrased easy both-hits → both arms still both-hit.  
3. Guide 08 T1 added confusable sections + anti-paraphrase traps → still helps=0/hurts=0 (Review: weakly discriminative).  
4. Thin corpus (13 `###` / ~80 lines) → low competition; correct chunk often already cited on both arms.  
5. Empty-gold hard misses (`g10`, `g23`–`g25`) create both-miss only — cannot create CE-helps. `g44` is also both-miss.

**Implication:** Another Guide-08-shaped “+N traps on same thin fixture” has **low expected value** and raises eval-gaming / fake-lift temptation risk.

### If Path A is chosen — must be qualitatively harder

Do **not** authorize Guide 09 that only adds more paraphrase or near-T1 traps. Minimum bar for a credible next discriminative attempt:

1. **Rank diagnostics first** (ops/eval note): measure gold rank under RRF vs CE on current n=44 — prove whether disagreement is even possible at current N/K before writing more goldens.  
2. **Material confusable corpus growth** (many more competing sections/facts), **or** deferred PATH_TO_30 themes (second synthetic vehicle / wiring) — not +3 sections again.  
3. Same metric SSOT: citation∩gold; twin-process paired ask; **no auto-freeze** even if delta > 0.  
4. Accept flat as valid outcome again.

### If Path B is chosen — override packaging shape

Docs-only delivery (similar blast radius to Guide 05/06):

1. Tom writes explicit override lock: freeze embed + CE **despite** `ce_vs_rrf_ask_delta_hits=0` on n=44.  
2. Required honesty: no lift claim; cite Guide 04/07/08 flat; keep “candidates→frozen by override” narrative clear.  
3. Update `MODEL_FREEZE_STATUS.md` status tables → frozen **only** after Tom-authored freeze language.  
4. Align VISION §9 freeze row, INTERVIEW / GETTING_STARTED / README maturity lines.  
5. **Do not** auto-check public flip; LICENSE still required for flip.

---

## Public flip path (after freeze decision)

From `PUBLIC_FLIP_CHECKLIST.md` (status verified this Gather where possible):

| # | Gate | Status 2026-07-18 |
|---|------|-------------------|
| 1 | Fixtures-only + `public_fail_closed.py` | Path exists — re-run before flip |
| 2 | Stranger-clone `GETTING_STARTED` | Documented — operator re-verify |
| 3 | Honesty surfaces (no lift theater) | Honest today — candidates; delta 0 n=44 |
| 4 | Formal freeze gate | Still parked / open |
| 5 | VISION §9 / banners | Flip only after Tom lock |
| 6 | Secrets + **LICENSE** | Secrets fail-closed path exists; **LICENSE file absent** |

**Public-flip packaging sequence (honest):**

1. Resolve freeze (Path A earn + Tom freeze, **or** Path B override).  
2. Tom chooses and adds `LICENSE` (do not invent in Gather).  
3. Re-run fail-closed + stranger-clone smoke.  
4. Tom locks public flip → check VISION §9 public-flip row + banners.

Fixtures-only flip may leave second vehicle / wiring / PrivateGold / g10 residual deferred if Tom explicitly accepts that scope (already documented).

---

## Risks and blast radius

| Risk | Angle | Mitigation |
|------|-------|------------|
| Fake lift / freeze theater | Interview / portfolio | Cite n=44 flat; forbid proxy `+1`/`n=5` |
| Guide 09 redux of 07/08 | Eval trust + wasted cycles | Require qualitative harder bar or choose override |
| Override without no-lift sentence | Honesty regression | Soft-pin required honesty sentences |
| Collapsing freeze into public flip | Marketing | Keep three gates |
| LICENSE invent without Tom choice | Legal | Document unmet; Tom picks license later |
| Ranking redesign temptation | Scope | Forbidden in freeze/flip packaging path |
| Claiming 100% while §9 open | Hub % | Hub pass 151: override **or** new discriminative required |

**Blast radius if Write→Implement (docs Path B):** `MODEL_FREEZE_STATUS.md`, VISION §9, INTERVIEW / GETTING_STARTED / README / ARCHITECTURE honesty — **not** ranking code.  

**Blast radius if Path A Implement:** goldens, optional fixture growth, re-ingest, `last_run_summary.json`, freeze status tables — still no auto-freeze / no §9 flip.

---

## Edge cases

| Case | Behavior |
|------|----------|
| Path A still flat | Leave candidate; refresh keep note; do **not** freeze |
| Path A delta > 0 | Report helps/hurts; **stop** for Tom freeze authorize — no auto-freeze |
| Path A delta < 0 | Document CE-hurts; freeze more forbidden unless override with regression honesty |
| Tom wants freeze now | Path B override only with written lock + no-lift sentences |
| Tom wants public flip while candidates | Explicit “candidates at public flip” banner + LICENSE — high risk; recommend against |
| Embed-only freeze | Allowed variant of B; CE stays candidate with written why |
| g10 / insufficient_evidence residual | Out of freeze evidence; optional later slice |

---

## Unknowns

| Unknown | How to resolve | Blocking Write? |
|---------|----------------|-----------------|
| Tom chooses Path A vs B vs stay parked | Open decision below | **Yes** |
| If A: diagnostics-first vs corpus-growth vs second vehicle | Soft-pin at Write/Refine | Soft for Write shape |
| If B: freeze both vs embed-only | Soft-pin at Write | Soft |
| LICENSE choice (MIT / Apache-2.0 / other) | Tom before public-flip Implement | Blocks flip only |
| Minimum positive delta for earn-freeze after A | Tom after metrics | Soft — default “any >0 + Tom lock” |

---

## Recommended approach (Gather)

1. **Do not claim freeze, CE lift, or public flip from this Gather.** Evidence is flat on n=44.  
2. **Prefer Path B — Tom freeze-override packaging** as the next Write target if the goal is closing formal freeze toward portfolio 100% on the fixtures-only stack we already have.  
3. **Do not** open a Guide-08-redux discriminative guide by default — two attempts already spent; soft residual says the set stays weakly discriminative for asymmetry.  
4. **Choose Path A only if** Tom wants interview-grade *measured lift* before freeze — and then require the qualitatively harder bar (diagnostics and/or material corpus growth / second vehicle), not another thin trap band.  
5. Treat **public flip** as a **follow-on** thin delivery after freeze resolution: LICENSE + checklist re-verify + Tom flip lock.  
6. **Honest readiness:** Ready for **Write dev guide** after Tom locks A vs B (or park). Not ready for Implement freeze/flip theater.

---

## Open decisions (human)

### Decision 1: Freeze unlock path

- **Plain title:** Close formal freeze via new discriminative evals, or via explicit Tom override packaging?
- **In plain terms:** We ran harder tests twice. The reranker still does not change citation∩gold hits vs fusion-only (delta 0 on 44 questions). “Freeze” means locking model IDs for portfolio claims. We can try again with a *much harder* eval design, or you can override-freeze with a written “no lift” honesty note.
- **Options:**
  - **(A) New discriminative goldens** — qualitatively harder than Guide 07–08; then Tom freeze only if evidence supports (or still override later).
  - **(B) Tom freeze-override packaging** — docs-only freeze despite flat delta; keep no-lift sentences.
  - **(C) Stay parked** — leave §9 freeze unchecked; work elsewhere.
- **Recommendation:** **(B)** for portfolio freeze closure on current fixtures; keep Path A as optional later if you want a lift story.
- **Reasoning:** Guide 07 and Guide 08 already attempted discriminative growth and stayed flat (helps=0/hurts=0). The freeze checklist’s process fields are largely met; what is missing is justifying evidence. Repeating thin traps has low expected value. Override freeze is an honest portfolio lock when paired with mandatory “delta was 0” language — interviewers get architecture completeness without invented lift.
- **Tradeoffs:** (B) gives a weaker ablation story (“why freeze if no lift?” — must answer in INTERVIEW). (A) can earn a stronger freeze narrative but costs another eval cycle and may still flat. (C) leaves Mechanic §9 open vs hub 100% definition.
- **Needs from you:** Lock **A**, **B**, or **C** (and if A, say diagnostics-first vs corpus-growth / second vehicle).

### Decision 2: Public flip timing (after Decision 1)

- **Plain title:** When should Mechanic claim public flip / portfolio “v1 Done”?
- **In plain terms:** Public flip is separate from freeze. LICENSE is still missing. Checklist packaging already exists but is not a flip.
- **Options:**
  - **(P1)** After freeze resolved (A-earn or B-override) + LICENSE + checklist re-verify + Tom flip lock.
  - **(P2)** Public flip while models remain candidates (explicit banner) + LICENSE — not recommended.
  - **(P3)** Park public flip indefinitely; leave §9 unchecked.
- **Recommendation:** **(P1)** — freeze first (Decision 1), then LICENSE + flip as a thin follow-on.
- **Reasoning:** Collapsing freeze and flip confuses interviewers and hub %. LICENSE is an unmet hard prerequisite already documented; inventing it here is out of Gather.
- **Tradeoffs:** (P1) is two small deliveries. (P2) is faster but weakens honesty. (P3) blocks hub 100% on Mechanic.
- **Needs from you:** Confirm **P1** (recommended) or choose P2/P3.

---

## Evidence opened this pass

- Handoff `2026-07-18_spoke_mechanic_gather_freeze_flip_pass151_handoff.md`  
- Hub `2026-07-18_prioritize_hub_pass151.md`  
- `evals/MODEL_FREEZE_STATUS.md` (full)  
- `docs/PUBLIC_FLIP_CHECKLIST.md` (full)  
- `docs/VISION.md` §9  
- Guide 05 keep guide + context; Guide 06 packaging guide; Guide 07–08 guides + contexts + Review note  
- `INTERVIEW.md` §5–§8  
- `evals/PATH_TO_30.md`  
- `evals/last_run_summary.json` — recomputed both_hit/both_miss/helps/hurts  
- Fixture `###` count = 13; `LICENSE` absent (`test ! -f LICENSE`)  
- Golden case count = 44 (`"id":` count)  

---

## Honest readiness

- **Gather DoD:** Met — context written; decisions surfaced with recommendation + tradeoffs.  
- **Ready for Write dev guide?** **Yes, after Tom locks Decision 1 (A/B/C)** — guide shape differs sharply (eval growth vs docs-only override).  
- **Not ready** for Implement freeze claim, public flip, or LICENSE invent.  
- **No fake lift:** current evidence remains delta **0** / helps **0** / hurts **0** on n=44.
