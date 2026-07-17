# Dev Guide 07 — Freeze-evidence discriminative eval (Path A)

**Date:** 2026-07-17  
**Repo:** `mechanic_rag`  
**Work item:** Guide 07 — +5–10 discriminative trap goldens + paired-ask re-baseline (freeze-evidence path)  
**Stage that authored this:** Write-dev-guide (pass 104)  
**Last refined:** Refine-dev-guide (pass 105b) — one pass  
**Ready-check:** 2026-07-17 (pass 108) — **READY** for Implement (human Stage authorize required)  
**Status:** **Reviewed — shippable** (2026-07-17 pass 114) after honesty microfixes; no freeze/public-flip  
**Handoff (Review):** `second_brain/docs/2026-07-17_spoke_mechanic_guide07_review_pass114_handoff.md`  
**Handoff (Implement):** `second_brain/docs/2026-07-17_spoke_mechanic_guide07_implement_pass109_handoff.md`  
**Handoff (Refine):** `second_brain/docs/2026-07-17_spoke_mechanic_guide07_refine_pass105b_handoff.md`  
**Context SSOT:** `mechanic_rag/docs/2026-07-17_guide07_freeze_evidence_eval_context_summary.md`  
**Handoff (Write):** `second_brain/docs/2026-07-17_spoke_mechanic_guide07_write_pass104_handoff.md`  
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
| New case count | **+5 to +10** (inclusive); **default +8** when A2 finds ≥8 honest pairs |
| Resulting n | **35–40** |
| IDs | Continue `g31`… (no reuse of g01–g30 ids) |
| `vehicle_id` | **`fixture:honda-s2000-demo`** on every new case |
| Case schema | `id`, `question`, `vehicle_id`, `allowed_content_substrings`, `allowed_section_paths`, `notes` |
| Gold shape (trap) | Prefer **one primary gold section** (tight `allowed_section_paths`); **do not** copy g29/g30 “multi-section both allowed” pattern — that reduces arm divergence |
| Avoid theme clones | Do **not** rephrase g29 (thermo vs coolant multi-allow) or g30 (spark gap vs torque multi-allow) as “new” traps |
| Trap mix (soft target) | ≥3 near-dup; ≥2 lexical-trap / semantic-need; ≥1 multi-chunk distractor intent; **0 required** new empty-gold hard misses |
| Generator | `gemma4:e2b` |
| CE | `Xenova/ms-marco-MiniLM-L-6-v2` via `transformers_js` / `classification` |
| Embed | `nomic-embed-text` @ 768 — **candidate** (unchanged) |
| Re-baseline | Twin Next (:3000 CE-on, :3001 `MECHANIC_FORCE_RRF_ONLY=1`) + `mecharag eval --golden evals/ --ask-url … --ask-url-rrf-only …` |
| CE-helps / CE-hurts | Count cases where `ask_ce.citation_gold_hit != ask_rrf_only.citation_gold_hit`; record both counts in MODEL_FREEZE_STATUS Guide 07 table |
| Freeze after run | **Human-only; no auto-freeze** |
| Public flip | **Out of scope** |
| Corpus thinness | Fixture has ≥6 near-dup section pairs (oil/clutch/spark/cool/valve/MTF) — A3 stop is residual risk, not default expectation |
| Illustrative inventory | Soft-default below — rename OK if pins hold |

### Soft-default trap inventory (illustrative — Implement may rename)

Prefer questions with **high lexical overlap to a distractor section** but **one** gold section. Distinct from existing g29/g30 multi-allow cases.

| Soft id | Trap class | Gold section (intent) | Distractor family |
|---------|------------|----------------------|-------------------|
| `g31-trap-thermo-full-open` | Near-dup | 4-2 Thermostat (95 °C full open) | 4-1 Coolant capacity/mix |
| `g32-trap-spark-gap-only` | Lexical | 3-1 gap mm | 3-1 torque / 3-2 interval wording |
| `g33-trap-oil-filter-turn` | Lexical | 1-2 “3/4 turn” | 1-1 drain torque / capacity |
| `g34-trap-clutch-pushrod` | Near-dup | 2-1 pushrod adjust | 2-2 hydraulic fluid |
| `g35-trap-exhaust-clearance` | Near-dup | 5-1 exhaust mm | 5-1 intake mm |
| `g36-trap-mtf-filler-hole` | Near-dup | 6-1 fill-to-filler | 6-1 capacity liters / ATF confusion |
| `g37-trap-spark-interval` | Lexical | 3-2 105k interval | 3-1 type/gap/torque |
| `g38-trap-radiator-cap-psi` | Multi-chunk | 4-1 radiator cap kPa/psi | 4-1 capacity / 4-2 thermostat |

If fixture cannot support 8 honest traps, stop at **≥5** and document why — do **not** invent OEM facts; do **not** pad with empty-gold hard misses.

---

## Acceptance criteria (Implement — unchecked until then)

- [x] +5–10 new trap cases in `golden_fixture_v1.json`; schema valid; golds from fixture text  
- [x] Paired ask re-baseline completed; `last_run_summary.json` refreshed (n, hits, delta, CE id/mode, generator, degrade_rate)  
- [x] Report CE-helps / CE-hurts counts (asymmetric citation∩gold) in MODEL_FREEZE_STATUS or summary note  
- [x] Status tables remain **candidate**; VISION §9 freeze + public-flip remain `- [ ]`  
- [x] Honesty surfaces updated for new n + delta (no lift/freeze/public-flip theater)  
- [x] No ranking code changes unless harness bug blocked (unexpected — stop for human)  
- [x] No LICENSE invent; no public-flip claim  

---

## Ordered step checklist

All boxes start unchecked. **Do not check in Write / Refine / Ready-check.** Only Implement checks them.

### Phase A — Corpus + baseline re-anchor

- [x] **A1.** Confirm current n=30; last_run delta 0; CE-helps=0 / CE-hurts=0 (or recompute from `last_run_summary.json`).  
- [x] **A2.** Read `fixtures/honda_s2000_demo/service_manual.txt`; list near-dup section pairs usable for traps.  
- [x] **A3.** If fewer than 5 honest traps possible without inventing text → **STOP** for human (corpus too thin) or propose minimal synthetic fixture section (explicit Tom OK).  
- [x] **A4.** Do **not** flip VISION §9; do not change candidate→frozen.

### Phase B — Author trap goldens

- [x] **B1.** Add **5–10** cases (`g31`…) with `vehicle_id=fixture:honda-s2000-demo`, non-empty golds from fixture; prefer **single primary** gold section.  
- [x] **B2.** Each `notes` field states trap class, intended distractor section, and that gold is single-primary (not g29/g30 multi-allow clone).  
- [x] **B3.** Update `golden_fixture_v1.json` debt / metadata; update `PATH_TO_30.md` for discriminative band (second vehicle / wiring still deferred).  
- [x] **B4.** Reject eval gaming: no CE-probe-as-gold without fixture-grounded substrings.  

### Phase C — Paired-ask re-baseline

- [x] **C1.** Run twin-process paired ask (CE-on + RRF-only) per MODEL_FREEZE_STATUS command pattern.  
- [x] **C2.** Write/overwrite `evals/last_run_summary.json` with full n (35–40).  
- [x] **C3.** Record summary fields + **CE-helps** / **CE-hurts** counts:  
  `helps = sum(ce_hit and not rrf_hit)`; `hurts = sum(rrf_hit and not ce_hit)` over paired cases in `last_run_summary.json`.  
- [x] **C4.** Update `MODEL_FREEZE_STATUS.md` Guide 07 evidence table (n, hits, delta, helps, hurts); keep status **candidate**; freeze packaging **parked**; **no freeze flip**.

### Phase D — Honesty Align (thin)

- [x] **D1.** Update INTERVIEW / GETTING_STARTED / README eval maturity lines for new n + delta (and “still not frozen”).  
- [x] **D2.** Optional: VISION §9 ≥30 row footnote that discriminative band landed — **without** checking freeze/public-flip.  
- [x] **D3.** If delta still 0: refresh keep-with-justification note that set remains non-/weakly-discriminative — **do not** invent lift.  
- [x] **D4.** N/A this run (delta=0) — §9 freeze/public-flip left unchecked; no auto-freeze.

### Phase E — Stop

- [x] **E1.** No public-flip claim; no LICENSE invent; no ranking redesign.  
- [x] **E2.** Stop for Review. Freeze decision is a **separate** human Stage after metrics.

---

## Verification / Definition of Done

```bash
# From mechanic_rag/
python3 - <<'PY'
import json, re
g = json.load(open("evals/golden_fixture_v1.json"))
cases = g["cases"]
n = len(cases)
assert 35 <= n <= 40, n
ids = [c["id"] for c in cases]
assert len(ids) == len(set(ids)), "duplicate ids"
traps = [c for c in cases if re.match(r"^g(3[1-9]|[4-9]\d)", c["id"])]
assert 5 <= len(traps) <= 10, [c["id"] for c in traps]
for c in traps:
    assert c.get("vehicle_id") == "fixture:honda-s2000-demo", c["id"]
    assert c.get("allowed_content_substrings"), c["id"]
    assert c.get("allowed_section_paths"), c["id"]
d = json.load(open("evals/last_run_summary.json"))
assert d["n_cases"] == n
assert "ce_vs_rrf_ask_delta_hits" in d
helps = hurts = 0
for c in d.get("cases", []):
    ce = (c.get("ask_ce") or {}).get("citation_gold_hit")
    rrf = (c.get("ask_rrf_only") or {}).get("citation_gold_hit")
    if ce and not rrf:
        helps += 1
    if rrf and not ce:
        hurts += 1
print("golden OK", n, "traps", len(traps), "delta", d["ce_vs_rrf_ask_delta_hits"], "helps", helps, "hurts", hurts)
PY

rg -n 'Formal embed/CE|Public flip' docs/VISION.md
# Expect both still "- [ ]"

rg -n 'candidate|Guide 07|ce_vs_rrf_ask_delta|helps|hurts|frozen' evals/MODEL_FREEZE_STATUS.md
# Must find candidate + Guide 07 evidence; must NOT flip embed/CE to frozen

# Guide 07 must not create LICENSE
test ! -f LICENSE
```

**DoD (Implement):** Trap band landed; paired re-baseline written; helps/hurts reported; candidates + §9 freeze/public-flip unchanged; honesty matches numbers; no auto-freeze; no public-flip claim; no ranking redesign.

**DoD (Refine — this pass):** Pins tightened (single-primary gold, no g29/g30 clones, helps/hurts recipe, clean verify); Ready-check readiness scored; no Implement.

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
| Trap clones g29/g30 multi-allow | Reject — prefer single-primary gold; rename theme |
| New traps still both-hit | Acceptable outcome; document helps=0; no freeze theater |

---

## Stop conditions

- **Refine-dev-guide:** Stop after this refine + numeric Ready-check readiness. Do **not** Implement.  
- **Later Implement:** Stop when Phases A–E DoD met; never auto-freeze; never public-flip.  
- **Stop for human if:** invent freeze/lift/public flip; corpus invent; ranking redesign; LICENSE invent; A3 corpus-thin.

---

## Locked decisions (do not reopen)

| Decision | Lock |
|----------|------|
| Path | **A** discriminative growth |
| Size | **+5–10** traps (default +8) |
| Auto-freeze | **Forbidden** |
| Public flip in Guide 07 | **Forbidden** |
| Model status default | **Candidates** |

---

## Refine pass 105b notes

- Pinned **single-primary gold section** (avoid g29/g30 multi-allow clones that kill discriminability).  
- Diversified soft inventory (full-open thermo, filter 3/4 turn, pushrod, exhaust clearance, filler hole, radiator cap psi).  
- Executable **helps/hurts** recipe + cleaned DoD verify script (`vehicle_id` assert).  
- Corpus-thin A3 demoted to residual risk (fixture has clear near-dup pairs).  
- Soft residual remaining: exact question wording craft at Implement.

---

## Ready-check readiness (binding score)

| Track | Score | Why not 10 |
|-------|-------|------------|
| Guide 07 freeze-evidence discriminative eval | **9.0 / 10** | Exact trap question/substring craft remains Implement invent (soft). Optional synthetic-section path if A3 trips. Not material pin invent — Ready-check next. |

**Ready-check next?** **Yes.**  
**More Refine?** **No.**  
**Implement now?** **No** — Ready-check + Tom Stage authorize first.  
**Freeze / public flip claimed?** **No.**

---

## Ready-check before code (pass 108)

### Zoom-out

| Check | Verdict |
|-------|---------|
| Context + guide aligned? | **Yes** — Path A locks match context + refined pins (single-primary gold, +5–10, no auto-freeze) |
| Evidence baseline current? | **Yes** — n=30, delta 0, candidates, §9 unchecked, fixture present (10 `###` sections), paired harness fields present |
| Blast radius + rollback clear? | **Yes** — goldens/summary/MODEL_FREEZE/honesty docs; revert commits |
| Edge cases planned? | **Yes** — flat/+/− delta; A3 thin; no g29/g30 clones; no auto-freeze |
| Material refinements still required? | **No** — soft craft only (exact questions/substrings) |

### Implement readiness (binding score)

| Track | Score | Why not 10 |
|-------|-------|------------|
| Guide 07 freeze-evidence discriminative eval | **9.0 / 10** | Exact trap question + gold substring craft remains Implement invent (soft). Twin-process ops proof is Implement/Review runtime — not withheld. Score not inflated vs Refine. |

**Explicit call: READY for Implement** — after Tom authorizes `Stage: Implement`.  
**More Refine?** **No.**  
**Implement now?** **No** — this stage stops for human approval.  
**Do not freeze. Do not public-flip. Candidates stay candidates.**

---

## Review implementation (pass 114)

**Against:** Implement `ad13efb` + guide DoD + QUALITY_STANDARD §5.

### Findings

| Finding | Severity | Disposition |
|---------|----------|-------------|
| DoD verify (n=38, traps 8, substrings in fixture, delta 0, helps/hurts 0, §9 unchecked, candidates) | — | Pass |
| No ranking redesign / no LICENSE / no freeze invent | — | Pass |
| Honesty surfaces mostly matched n=38 | Soft | Fixed: MODEL_FREEZE H1; ARCHITECTURE honesty line; INTERVIEW §5 heading |
| Several Path A traps near-paraphrase prior easy both-hit cases (g33≈g14, g34≈g21, …) | Soft residual | Documented in MODEL_FREEZE Guide 07 table — **not** rewritten this Review (would force re-baseline; out of smallest fix) |
| Flat delta after Path A | Expected | Acceptable per guide edge-case; freeze stays parked |

### Shippable call

**Shippable** after honesty microfixes above. Soft residual (trap near-paraphrase) is known limitation of this evidence attempt — future freeze-evidence work would need harder distractor design or corpus growth, not silent freeze.

**No Align self-start. No freeze. No public-flip.**
