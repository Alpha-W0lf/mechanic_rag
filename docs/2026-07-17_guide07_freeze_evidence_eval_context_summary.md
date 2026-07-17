# Context: Guide 07 — Freeze-evidence eval path

**Date:** 2026-07-17  
**Repos:** `mechanic_rag`  
**Status:** **Closed** — Path A Implemented + Reviewed shippable; Align pass 116 refreshed live honesty to n=38 flat  
**Guide:** `docs/dev_guides/2026-07-17_dev_guide_07_freeze_evidence_discriminative_eval.md` (**Reviewed — shippable**)  
**Mode last used:** spoke  
**Handoff (Gather):** `second_brain/docs/2026-07-17_spoke_mechanic_guide07_gather_pass101_handoff.md`  
**Handoff (Review):** `second_brain/docs/2026-07-17_spoke_mechanic_guide07_review_pass114_handoff.md`  
**Handoff (Align):** `second_brain/docs/2026-07-17_spoke_mechanic_align_pass116_handoff.md`

**Prior closed:** Guide 05 keep-with-justification; Guide 06 freeze/public-flip **packaging** (Review shippable).  
**VISION §9:** Formal embed/CE freeze **unchecked**; public flip **unchecked**.

### Outcome (Path A — current truth)

| Field | Value |
|-------|-------|
| n_cases | **38** (g01–g30 + traps g31–g38) |
| ce_vs_rrf_ask_delta_hits | **0** |
| CE-helps / CE-hurts | **0 / 0** |
| Embed / CE status | **candidates** (no freeze invent) |
| Soft residual | Several traps near-paraphrase prior easy both-hit cases — weakly discriminative; future harder traps need separate authorize |

Below: Gather-era problem framing (n=30 baseline that motivated Path A). Retained for history.

---

## Problem (Gather baseline — superseded by Outcome above)

Formal freeze is still **parked**. Guide 06 only landed packaging checklists — checklist ≠ freeze. At Gather, paired-ask evidence on n=30 was **non-discriminative** for CE vs RRF:

| Arm outcome (citation∩gold) | Count | IDs / note |
|-----------------------------|-------|------------|
| Both hit | 26 | Same citations succeed with or without CE |
| Both miss | 4 | `g10`, `g23`, `g24`, `g25` — out-of-corpus hard misses |
| CE helps (CE hit, RRF miss) | **0** | No positive lift cases |
| CE hurts (RRF hit, CE miss) | **0** | No regression cases |

`ce_vs_rrf_ask_delta_hits=0` is therefore expected, not a measurement glitch. Portfolio freeze of embed/CE **cannot** be earned from this set without new discriminative evidence **or** an explicit Tom override that freezes without lift (high interview risk).

Human-only freeze checklist in `MODEL_FREEZE_STATUS.md` (paired metrics, citation∩gold predicate, CE id/mode, degrade rate, n≥30, forbid proxy) is largely **process-satisfied** already. What is missing is **evidence that justifies locking** — not missing checklist fields.

---

## Acceptance criteria (for later guides — not checked this Gather)

- [ ] Written freeze-evidence bar: what metrics / golden properties would unlock freeze vs keep-parked  
- [ ] Chosen path locked by Tom: (A) discriminative eval growth + paired re-baseline, (B) stay-parked docs-only, (C) embed-only freeze bar, or (D) wait for second-vehicle/wiring corpus  
- [ ] If (A): fixtures-only; citation∩gold predicate unchanged; no invent lift; freeze still human-only after run  
- [ ] Forbidden: freeze theater; proxy `+1`/`n=5`; public flip claim; LICENSE invent; ranking redesign as DoD  

---

## In scope (this Gather)

- Map current freeze SSOT vs evidence gap  
- Define honest freeze-evidence eval paths (discriminative goldens, metrics, keep rules)  
- Recommend Write-dev-guide shape  
- Surface open decisions with recommendation + tradeoffs  

## Out of scope

- Claiming freeze or flipping VISION §9  
- Public flip / v1 Done / inventing LICENSE  
- Implement / ranking code / model swaps / reindex  
- PrivateGold / Drive / Ford / OEM PDFs  
- Sibling repos (Vehicle, AI KB, AlphaGuard)  
- Full Write-dev-guide body (next stage)  

---

## Prior art (paths only)

- `mechanic_rag/evals/MODEL_FREEZE_STATUS.md` — freeze checklist; keep note; Guide 06 packaging; n=30 delta 0  
- `mechanic_rag/evals/last_run_summary.json` — paired ask fields; 0 asymmetric citation hits  
- `mechanic_rag/evals/golden_fixture_v1.json` — g01–g30; hard-miss / debt notes  
- `mechanic_rag/evals/PATH_TO_30.md` — deferred second vehicle / wiring / degrade-obs  
- `mechanic_rag/docs/VISION.md` §9  
- `mechanic_rag/docs/PUBLIC_FLIP_CHECKLIST.md` — flip ≠ freeze; freeze parked  
- `mechanic_rag/docs/2026-07-15_guide05_model_freeze_keep_context_summary.md`  
- `mechanic_rag/docs/dev_guides/2026-07-16_dev_guide_05_model_keep_honesty.md`  
- `mechanic_rag/docs/dev_guides/2026-07-17_dev_guide_06_formal_freeze_packaging.md`  
- `mechanic_rag/docs/dev_guides/2026-07-14_dev_guide_04_path_to_30_rebaseline.md`  
- `second_brain/docs/2026-07-16_human_locks_pass60_fan_in.md`  
- `second_brain/docs/2026-07-17_spoke_mechanic_guide07_gather_pass101_handoff.md`  

---

## Freeze-evidence bar (honest)

### Already true (do not re-litigate)

1. Paired ask under `gemma4:e2b` with `rrf_only_ask_hits` / `ce_ask_hits` / `ce_vs_rrf_ask_delta_hits`  
2. Hit predicate = cited `chunk_id` ∩ gold evidence (not answer-substring alone)  
3. CE id + `classification` mode recorded  
4. `degrade_rate` recorded (0.0 on last run)  
5. Golden set ≥30 on S2000 fixture  
6. Proxy `ce_vs_rrf_delta_hits=+1` / `n=5` **forbidden**  

### What would honestly unlock freeze

| Unlock path | Evidence required | Residual risk |
|-------------|-------------------|---------------|
| **Lift unlock** | New paired ask with `ce_vs_rrf_ask_delta_hits` **> 0** on citation∩gold, same generator/CE/mode, ≥30 (or justified larger n), no asymmetric-failure theater | Still need Tom human freeze authoring |
| **Stability unlock (embed-only)** | Explicit Tom lock: freeze **embedding** (`nomic-embed-text`@768) on smoke+ingest stability while CE stays candidate | Interviewers ask why CE unfrozen — must write honesty |
| **Override unlock** | Explicit Tom lock: freeze both despite flat delta, with “no lift” sentence retained | Strong one-liner; weak ablation story |
| **Stay parked** | No new claim; keep Guide 05/06 honesty; VISION §9 freeze stays unchecked | Freeze remains open on portfolio % |

### Discriminative golden design rules (if pursuing lift unlock)

Target cases where arms **can** diverge — not more both-hit easy positives and not more empty-gold hard misses:

1. **Near-duplicate sections** — two plausible sections; lexical RRF may cite wrong section; CE should prefer gold section (citation∩gold differs).  
2. **Lexical trap / semantic need** — query words overlap distractor chunk; gold is paraphrased / unit-converted.  
3. **Multi-chunk distractors** — RRF packs near-dup noise; CE N→K should promote gold chunk_id.  
4. **Fixtures only** — text must exist in current S2000 fixture (or a new **synthetic** fixture section added deliberately). Do not invent OEM/wiring text.  
5. **Hard misses stay honest** — empty `allowed_*` cases measure grounding/out-of-corpus; they **cannot** produce CE lift. Do not grow only hard misses for freeze.  
6. **Metric SSOT** — still `ce_vs_rrf_ask_delta_hits` on citation∩gold; never resurrect proxy field as lift.

**Observed gap:** Current set has **zero** CE-helps / CE-hurts citation asymmetries → freeze-evidence eval must create that opportunity, not re-run the same goldens expecting a different delta.

---

## Risks and blast radius

| Risk | Angle | Mitigation |
|------|-------|------------|
| Freeze theater from Guide 07 Gather/Write | Portfolio / VISION | Do not flip §9; candidates stay until Tom lock + evidence |
| Goldens engineered only to force CE “win” (eval gaming) | Eval honesty | Prefer natural near-dup traps; document intent; Review rejects answer-substring theater |
| Scope into second vehicle / wiring / PrivateGold | Corpus | Soft-pin S2000-first unless Tom locks larger path |
| Confusing packaging checklist with freeze | Interview | Keep three gates: keep / freeze / public flip |
| Re-baseline noise (generator drift) | Metrics | Pin `gemma4:e2b` + CE id/mode; record in `last_run_summary.json` |
| Public flip creep | Marketing | Out of scope; `PUBLIC_FLIP_CHECKLIST.md` remains separate |

### Blast radius if Write→Implement grows goldens

- `evals/golden_fixture_v1.json`, `evals/last_run_summary.json`, `evals/MODEL_FREEZE_STATUS.md`, PATH_TO_30 / debt notes  
- Honesty surfaces: INTERVIEW, GETTING_STARTED, README (maturity lines only)  
- **Not** ranking code unless harness bug blocked (unexpected)  

---

## Edge cases

| Case | Behavior |
|------|----------|
| New goldens still flat delta | Leave candidate; refresh keep note if needed; **do not** freeze |
| Delta positive but small / unstable | Human decides freeze bar (e.g. require ≥+2 or hold for larger n) — do not invent threshold in Gather |
| Delta negative | Document CE regression risk; freeze more forbidden |
| Tom wants freeze now without new evals | Override unlock only with written lock + no-lift sentence |
| Second vehicle preferred | Separate larger guide; not default Guide 07 |
| g10 / insufficient_evidence residual | Separate optional slice — not freeze evidence |

---

## Unknowns

| Unknown | How to resolve | Blocking Write? |
|---------|----------------|-----------------|
| Tom path: discriminative growth vs stay-parked vs embed-only | Open decision below | **Yes** for Write shape |
| Minimum positive delta / n for freeze after growth | Tom soft-pin at Refine or Ready-check | Soft — can Write with “human freeze bar after run” |
| Whether fixture text supports enough near-dup traps without new sections | Spot-read fixture + draft candidate questions in Write | Soft for Gather; may block Implement if corpus too thin |
| Wiring / second vehicle timeline | PATH_TO_30 + hub Prioritize | No for S2000-first path |

---

## Recommended approach (Gather — executed)

Path A was locked and delivered (Implement + Review). Outcome: n=38 flat; freeze stayed human-only / parked. Align pass 116 refreshed live SSOT honesty. No freeze invent; no public flip.


---

## Decisions (human) — closed

**Locked (Write pass 104):** Path **(A)**; **+5–10** traps (default +8); **no auto-freeze** even if delta > 0; no public-flip claim.

**Outcome (Implement + Review):** n=**38**, `ce_vs_rrf_ask_delta_hits=**0**`, CE-helps=**0**, CE-hurts=**0**; embed/CE remain **candidates**; VISION §9 freeze + public flip still unchecked. Soft residual: trap near-paraphrase weakness (documented in Review / MODEL_FREEZE).

Gather-era open-decision prose is superseded by this section + Outcome table above.

---

## Evidence opened this pass (Gather)

- Handoff `2026-07-17_spoke_mechanic_guide07_gather_pass101_handoff.md`  
- `VISION.md` §9 (freeze + public flip unchecked)  
- `MODEL_FREEZE_STATUS.md` (checklist, keep, Guide 06 packaging, delta 0)  
- Guide 05 context; Guide 06 refined/shippable guide  
- `PATH_TO_30.md`; `golden_fixture_v1.json` debt/path notes  
- `last_run_summary.json` analyzed (then n=30): both_hit=26, both_miss=4, ce_only=0, rrf_only=0  
- Guide 04 hard-miss table / non-goals  

---

## Honest readiness (Align pass 116)

- **Guide 07 Path A:** Closed (Reviewed shippable). Live honesty surfaces aligned to n=38 flat.  
- **Not ready for freeze claim / public flip** — flat after discriminative attempt; candidates stay candidates.  
- **Next freeze-evidence work:** Separate human authorize (harder traps / corpus growth) — not auto-started from Align.
