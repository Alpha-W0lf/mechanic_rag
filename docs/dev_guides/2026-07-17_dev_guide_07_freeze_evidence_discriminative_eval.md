# Dev Guide 07 — Freeze-evidence discriminative eval (Path A)

**Date:** 2026-07-17  
**Repo:** `mechanic_rag`  
**Work item:** Guide 07 — +5–10 discriminative trap goldens + paired-ask re-baseline (freeze-evidence path)  
**Stage that authored this:** Write-dev-guide (pass 104)  
**Status:** **Draft** — Write complete; not Refine / Ready-check / Implement  

**Context SSOT:** `mechanic_rag/docs/2026-07-17_guide07_freeze_evidence_eval_context_summary.md`  
**Handoff:** `second_brain/docs/2026-07-17_spoke_mechanic_guide07_write_pass104_handoff.md`  
**Freeze SSOT:** `mechanic_rag/evals/MODEL_FREEZE_STATUS.md`  
**Prerequisite:** Guide 04 n=30 + flat paired ask; Guide 05 keep-with-justification; Guide 06 packaging shippable.

**Tom locks (pass 104):** Path **A**; **+5–10** trap cases; **no auto-freeze**; **no public-flip claim**; candidates stay candidates until Tom freeze lock **after** metrics.

---

## Objective

Grow a **small band of discriminative fixture goldens** so paired-ask citation∩gold **can** diverge across CE-on vs RRF-only arms, then re-baseline and refresh honesty docs — **without** claiming formal freeze or public flip.

**Success signal:**

1. `golden_fixture_v1.json` adds **5–10** new trap cases (n → **35–40**), all `fixture:honda-s2000-demo`, gold from existing fixture text.  
2. Fresh paired ask under pinned `gemma4:e2b` + CE `Xenova/ms-marco-MiniLM-L-6-v2` / `classification` writes `evals/last_run_summary.json`.  
3. `MODEL_FREEZE_STATUS.md` evidence tables updated; status tables still **candidate**.  
4. VISION §9 freeze + public-flip rows remain **unchecked**.  
5. Metrics reported honestly (delta may still be 0; CE-helps / CE-hurts counts documented).

**This guide is not a freeze-flip guide.** Even if `ce_vs_rrf_ask_delta_hits > 0`, Implement must **not** flip §9 or status→frozen.

---

## Learning notes (interview-portable)

1. **Discriminative eval** — Tests that can separate systems; if both arms always agree, lift is unmeasurable.  
2. **Ablation asymmetry** — CE-helps (CE hit, RRF miss) vs CE-hurts; Path A exists to create that opportunity.  
3. **No auto-freeze** — Positive delta is evidence for a human gate, not an automatic portfolio lock.  
4. **Eval gaming** — Designing goldens only so CE “must win” is forbidden; prefer natural near-dup / lexical traps in real fixture text.

---

## References (paths only)

- `mechanic_rag/docs/2026-07-17_guide07_freeze_evidence_eval_context_summary.md`
- `mechanic_rag/evals/golden_fixture_v1.json`
- `mechanic_rag/evals/last_run_summary.json`
- `mechanic_rag/evals/MODEL_FREEZE_STATUS.md`
- `mechanic_rag/evals/PATH_TO_30.md`
- `mechanic_rag/fixtures/honda_s2000_demo/service_manual.txt`
- `mechanic_rag/docs/VISION.md` (§9)
- `mechanic_rag/docs/PUBLIC_FLIP_CHECKLIST.md` (out of flip scope — link only if maturity lines touch)
- `mechanic_rag/docs/dev_guides/2026-07-14_dev_guide_04_path_to_30_rebaseline.md`
- `mechanic_rag/docs/dev_guides/2026-07-16_dev_guide_05_model_keep_honesty.md`
- `mechanic_rag/docs/dev_guides/2026-07-17_dev_guide_06_formal_freeze_packaging.md`
- `mechanic_rag/GETTING_STARTED.md` / `INTERVIEW.md` / `README.md` (maturity honesty only)
- `mechanic_rag/mecharag/eval_cmd.py` (paired ask fields — read-only unless harness bug)
- `second_brain/docs/2026-07-17_spoke_mechanic_guide07_write_pass104_handoff.md`
- `second_brain/docs/workflow_os/rails/QUALITY_STANDARD.md`

**Forbidden as lift/freeze evidence:** proxy `ce_vs_rrf_delta_hits=+1` / `n=5`; inventing OEM/wiring text; empty-gold hard-miss growth as “lift path.”

---

## Architecture constraints (binding)

1. **Fixture eval growth + paired re-baseline only.** No ranking redesign, model swaps, reindex-as-DoD, PrivateGold, Drive, Ford, second vehicle catalog, wiring invent.  
2. **Vehicle:** `fixture:honda-s2000-demo` only. Gold substrings / section paths must exist in `fixtures/honda_s2000_demo/service_manual.txt` (or a deliberately added **synthetic** fixture section if corpus too thin — prefer existing text first).  
3. **Hit predicate unchanged:** citation∩gold (`chunk_id` ∩ allowed evidence) — not answer-substring alone for lift.  
4. **Metric SSOT:** `ce_vs_rrf_ask_delta_hits` (and arm hit counts). Proxy field forbidden as proof.  
5. **No auto-freeze / no §9 freeze flip / no public-flip claim** — even if delta > 0.  
6. **Candidates stay candidates** unless Tom later locks freeze in a **separate** authorize (out of Guide 07 default DoD).  
7. **Do not grow only hard misses** (empty `allowed_*`) for this guide — they cannot create CE-helps.  
8. **Twin-process paired ask** is DoD for re-baseline (operator path); not required to invent CI twin.  
9. **Keep Guide 05 honesty sentences** true unless numbers change (then update prose to match).

---

## Soft pins (binding for Implement)

| Pin | Locked default |
|-----|----------------|
| Path | **A** — discriminative trap growth + re-baseline |
| New case count | **+5 to +10** (inclusive); prefer **+8** if fixture supports |
| Resulting n | **35–40** |
| IDs | Continue `g31`… (no reuse of g01–g30) |
| Case schema | Same as Guide 04: `id`, `question`, `vehicle_id`, `allowed_content_substrings`, `allowed_section_paths`, `notes` |
| Trap mix (soft target) | ≥3 near-dup / multi-section; ≥2 lexical-trap / semantic-need; ≥1 multi-chunk distractor intent; **0 required** new empty-gold hard misses |
| Generator | `gemma4:e2b` |
| CE | `Xenova/ms-marco-MiniLM-L-6-v2` via `transformers_js` / `classification` |
| Embed | `nomic-embed-text` @ 768 — **candidate** (unchanged) |
| Re-baseline | Twin Next (:3000 CE-on, :3001 `MECHANIC_FORCE_RRF_ONLY=1`) + `mecharag eval --golden evals/ --ask-url … --ask-url-rrf-only …` (see MODEL_FREEZE_STATUS) |
| Freeze after run | **Human-only; no auto-freeze** — Tom reviews metrics later |
| Public flip | **Out of scope** — do not claim ready / flip §9 |
| Illustrative trap themes (rename OK) | See inventory below — Implement may substitute if counts + trap rules hold |

### Soft-default trap inventory (illustrative — Implement may rename)

Use **existing** fixture near-dups (cooling 4-1 vs 4-2; spark 3-1 vs 3-2; oil 1-1 vs 1-2; clutch 2-1 vs 2-2; valve intake vs exhaust; MTF vs clutch fluid wording). Prefer questions where lexical overlap with a **distractor** section is high but gold section is specific.

| Soft id | Trap class | Intent (plain) |
|---------|------------|----------------|
| `g31-trap-coolant-vs-thermo-open` | Near-dup | Ask open-temp in a way that pulls coolant capacity distractors |
| `g32-trap-spark-torque-vs-gap` | Near-dup / lexical | Torque wording that overlaps gap/type chunks |
| `g33-trap-oil-grade-vs-drain-torque` | Lexical | Grade/spec query that may cite torque chunk |
| `g34-trap-clutch-play-vs-fluid` | Near-dup | Free-play vs hydraulic fluid family |
| `g35-trap-exhaust-vs-intake-clearance` | Near-dup | Exhaust clearance with intake distractor |
| `g36-trap-mtf-fill-vs-capacity` | Near-dup | Fill procedure vs capacity/spec wording |
| `g37-trap-spark-interval-vs-type` | Lexical | Interval query vs type/spec distractor |
| `g38-trap-radiator-cap-vs-coolant` | Multi-chunk | Cap pressure vs coolant mix/capacity noise |

If fixture cannot support 8 honest traps, stop at **≥5** and document why in notes / PATH debt — do **not** invent OEM facts.

---

## Acceptance criteria (Implement — unchecked until then)

- [ ] +5–10 new trap cases in `golden_fixture_v1.json`; schema valid; golds from fixture text  
- [ ] Paired ask re-baseline completed; `last_run_summary.json` refreshed (n, hits, delta, CE id/mode, generator, degrade_rate)  
- [ ] Report CE-helps / CE-hurts counts (asymmetric citation∩gold) in MODEL_FREEZE_STATUS or summary note  
- [ ] Status tables remain **candidate**; VISION §9 freeze + public-flip remain `- [ ]`  
- [ ] Honesty surfaces updated for new n + delta (no lift/freeze/public-flip theater)  
- [ ] No ranking code changes unless harness bug blocked (unexpected — stop for human)  
- [ ] No LICENSE invent; no public-flip claim  

---

## Ordered step checklist

All boxes start unchecked. **Do not check in Write / Refine / Ready-check.** Only Implement checks them.

### Phase A — Corpus + baseline re-anchor

- [ ] **A1.** Confirm current n=30; last_run delta 0; CE-helps=0 / CE-hurts=0 (or recompute from `last_run_summary.json`).  
- [ ] **A2.** Read `fixtures/honda_s2000_demo/service_manual.txt`; list near-dup section pairs usable for traps.  
- [ ] **A3.** If fewer than 5 honest traps possible without inventing text → **STOP** for human (corpus too thin) or propose minimal synthetic fixture section (explicit Tom OK).  
- [ ] **A4.** Do **not** flip VISION §9; do not change candidate→frozen.

### Phase B — Author trap goldens

- [ ] **B1.** Add **5–10** cases (`g31`…) with non-empty `allowed_content_substrings` + `allowed_section_paths` from fixture.  
- [ ] **B2.** Each `notes` field states trap class (near-dup / lexical / multi-chunk) and intended distractor.  
- [ ] **B3.** Update `golden_fixture_v1.json` debt / `n_cases` metadata if present; update `PATH_TO_30.md` debt line for discriminative band (still deferred: second vehicle / wiring).  
- [ ] **B4.** Reject eval gaming: do not set gold to whatever CE already returns from a one-off probe without fixture-grounded substrings.

### Phase C — Paired-ask re-baseline

- [ ] **C1.** Run twin-process paired ask (CE-on + RRF-only) per MODEL_FREEZE_STATUS command pattern.  
- [ ] **C2.** Write/overwrite `evals/last_run_summary.json` with full n (35–40).  
- [ ] **C3.** Compute and record: `rrf_only_ask_hits`, `ce_ask_hits`, `ce_vs_rrf_ask_delta_hits`, degrade_rate, CE/model/mode/generator; count CE-helps / CE-hurts.  
- [ ] **C4.** Update `MODEL_FREEZE_STATUS.md` Guide 07 evidence table; keep status **candidate**; keep freeze packaging **parked** language; **no freeze flip**.

### Phase D — Honesty Align (thin)

- [ ] **D1.** Update INTERVIEW / GETTING_STARTED / README eval maturity lines for new n + delta (and “still not frozen”).  
- [ ] **D2.** Optional: VISION §9 ≥30 row footnote that discriminative band landed — **without** checking freeze/public-flip.  
- [ ] **D3.** If delta still 0: refresh keep-with-justification note that set remains non-/weakly-discriminative — **do not** invent lift.  
- [ ] **D4.** If delta > 0: report number; still **no auto-freeze**; leave §9 unchecked pending Tom lock.

### Phase E — Stop

- [ ] **E1.** No public-flip claim; no LICENSE invent; no ranking redesign.  
- [ ] **E2.** Stop for Review. Freeze decision is a **separate** human Stage after metrics.

---

## Verification / Definition of Done

```bash
# From mechanic_rag/
python3 - <<'PY'
import json
g=json.load(open('evals/golden_fixture_v1.json'))
n=len(g['cases'])
assert 35 <= n <= 40, n
ids=[c['id'] for c in g['cases']]
assert len(ids)==len(set(ids))
new=[c for c in g['cases'] if c['id']>='g31' or c['id'].startswith('g3')]
# softer: count ids beyond g30
beyond=[c for c in g['cases'] if c['id'] not in {f'g{i:02d}' for i in range(1,31)} and not c['id'].startswith('g0')]
# prefer: any id matching g31+
import re
trap=[c for c in g['cases'] if re.match(r'g(3[1-9]|[4-9][0-9])', c['id'])]
assert 5 <= len(trap) <= 10, [c['id'] for c in trap]
for c in trap:
    assert c.get('allowed_content_substrings'), c['id']
    assert c.get('allowed_section_paths'), c['id']
print('golden OK', n, 'traps', len(trap))
d=json.load(open('evals/last_run_summary.json'))
assert d['n_cases']==n
assert 'ce_vs_rrf_ask_delta_hits' in d
print('summary OK', d['n_cases'], d['ce_vs_rrf_ask_delta_hits'])
PY

rg -n 'Formal embed/CE|Public flip' docs/VISION.md
# Expect both still "- [ ]"

rg -n 'candidate|ce_vs_rrf_ask_delta_hits|Guide 07|frozen' evals/MODEL_FREEZE_STATUS.md
# Must find candidate; must NOT find status flipped to frozen for embed/CE

test ! -f LICENSE || true  # Guide 07 must not create LICENSE
```

**DoD (Implement):** Trap band landed; paired re-baseline written; candidates + §9 freeze/public-flip unchanged; honesty matches numbers; no auto-freeze; no public-flip claim; no ranking redesign.

**DoD (this Write):** This guide executable with pins, steps, DoD, blast, edges — **no** golden edits, **no** eval run.

---

## Blast radius and risks

| Risk | Angle | Mitigation |
|------|-------|------------|
| Eval gaming | Metrics trust | Trap rules; Review rejects CE-probed golds without fixture substrings |
| Freeze theater after +delta | Portfolio | Soft pin no auto-freeze; §9 grep in DoD |
| Public-flip creep | Marketing | Out of scope; checklist ≠ flip |
| Corpus too thin | Implement block | A3 stop / synthetic section only with Tom OK |
| Twin ablation ops pain | Operator | Document ports; not CI-mandatory |
| Doc blast | Goldens, last_run, MODEL_FREEZE, PATH, INTERVIEW, GETTING_STARTED, README, optional VISION | Phases B–D |

### Rollback

Revert golden + summary + doc commits; restore prior `last_run_summary.json` if needed.

---

## Edge-case handling

| Case | Behavior |
|------|----------|
| Delta still 0 after traps | Success for *evidence attempt*; freeze stays parked; update honesty |
| Delta > 0 | Report; **stop**; Tom freeze lock is separate Stage — not Guide 07 DoD |
| Delta < 0 | Document CE-hurts; freeze more forbidden; candidates |
| Cannot author ≥5 honest traps | STOP for human — do not pad with hard misses |
| Harness lacks paired fields | STOP — fix harness only if trivial + in-scope; else escalate |
| Temptation to freeze embed-only mid-guide | Out of Path A DoD — needs Tom lock (path C), not silent |

---

## Stop conditions

- **Write-dev-guide:** Stop when this file is authored. Do **not** Implement / Refine / Ready-check unless Tom authorizes.  
- **Later Implement:** Stop when Phases A–E DoD met; never auto-freeze; never public-flip.  
- **Stop for human if:** asked to invent freeze/lift/public flip; corpus invent; ranking redesign; LICENSE invent.

---

## Locked decisions (do not reopen)

| Decision | Lock |
|----------|------|
| Path | **A** discriminative growth |
| Size | **+5–10** traps |
| Auto-freeze | **Forbidden** |
| Public flip in Guide 07 | **Forbidden** |
| Model status default | **Candidates** |

---

## Open residuals (Refine / Ready-check — not Write blockers)

- Exact trap question wording (craft).  
- Whether +5 vs +8 vs +10 after fixture inventory (within band).  
- Post-run freeze bar if delta > 0 (Tom human — not auto).

---

## Ready for next stage? (non-binding Write guess)

- **Ready for:** Refine-dev-guide (tighten trap inventory / DoD if needed).  
- **Not ready for:** Implement until Refine + Ready-check + Stage authorize.  
- **Guess Ready-check readiness after Refine:** ~8.8 / 10 — not 10 because Implement still invents exact questions and may hit corpus-thin A3.
