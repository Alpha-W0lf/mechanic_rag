# Dev Guide 08 — Harder discriminative CE traps (T1-primary)

**Date:** 2026-07-17  
**Repo:** `mechanic_rag`  
**Work item:** Guide 08 — harder discriminative CE traps + synthetic confusable sections + paired-ask re-baseline  
**Stage that authored this:** Write-dev-guide (pass 122)  
**Status:** **Draft — Write complete** — stop for hub fan-in / Ready-check (do **not** Implement from this stage)  
**Context SSOT:** `mechanic_rag/docs/2026-07-17_guide08_harder_discriminative_ce_traps_context_summary.md`  
**Handoff (Write):** `second_brain/docs/2026-07-17_spoke_mechanic_guide08_write_pass122_handoff.md`  
**Handoff (Gather):** `second_brain/docs/2026-07-17_spoke_mechanic_guide08_gather_pass121_handoff.md`  
**Freeze SSOT:** `mechanic_rag/evals/MODEL_FREEZE_STATUS.md`  
**Prerequisite:** Guide 07 Path A closed (n=38, delta 0, helps/hurts 0; near-paraphrase residual documented); Guide 05 keep; Guide 06 packaging parked.

**Hub locks (pass 122 — do not reopen):**

| Lock | Value |
|------|--------|
| Path | **Write Guide 08 (W)** |
| Corpus | **T1** — allow **1–3** synthetic confusable fixture sections |
| Auto-freeze | **Forbidden** even if `ce_vs_rrf_ask_delta_hits > 0` |
| Public flip | **Forbidden** / out of scope |
| Freeze | Stays **parked** until Tom lock **after** future evidence |

---

## Objective

Create a **second freeze-evidence attempt** that can produce **ranking disagreement** between CE-on and RRF-only on citation∩gold — by adding **synthetic confusable sections** plus **anti-paraphrase** trap goldens — then re-baseline honestly.

**Success signal:**

1. Fixture gains **1–3** new `###` sections that are **lexically confusable** with existing content but hold **distinct** facts (demo-labeled synthetic; not OEM).  
2. `golden_fixture_v1.json` adds **5–10** new trap cases (`g39`…), all `fixture:honda-s2000-demo`, golds from **post-T1** fixture text; **no near-paraphrase** of g01–g38.  
3. Fresh paired ask under `gemma4:e2b` + CE `Xenova/ms-marco-MiniLM-L-6-v2` / `classification` writes `evals/last_run_summary.json`.  
4. `MODEL_FREEZE_STATUS.md` gets a **Guide 08** evidence table (n, hits, delta, CE-helps, CE-hurts); status tables remain **candidate**.  
5. VISION §9 freeze + public-flip remain **unchecked**.  
6. Metrics reported honestly — **flat delta is an acceptable outcome**.

**This guide is not a freeze-flip guide.** Positive delta → report → stop for Tom; never auto-freeze.

---

## Learning notes (interview-portable)

1. **Discriminative evaluation** — A test set that can separate systems; if both arms always both-hit, lift is unmeasurable.  
2. **Ranking disagreement** — Same retrieve pool, different order/cutoff → gold in one arm’s citations but not the other’s (CE-helps / CE-hurts).  
3. **Ablation** — Hold retrieve fixed; change only CE on vs forced RRF-only (`MECHANIC_FORCE_RRF_ONLY`).  
4. **Confusable corpus design** — Near-duplicate documents with different labels are a standard IR stress test; paraphrase queries alone often fail on tiny corpora (Guide 07 lesson).

---

## References (paths only)

- `mechanic_rag/docs/2026-07-17_guide08_harder_discriminative_ce_traps_context_summary.md`  
- `mechanic_rag/docs/dev_guides/2026-07-17_dev_guide_07_freeze_evidence_discriminative_eval.md`  
- `mechanic_rag/evals/golden_fixture_v1.json`  
- `mechanic_rag/evals/last_run_summary.json`  
- `mechanic_rag/evals/MODEL_FREEZE_STATUS.md`  
- `mechanic_rag/evals/PATH_TO_30.md`  
- `mechanic_rag/fixtures/honda_s2000_demo/service_manual.txt`  
- `mechanic_rag/docs/VISION.md` (§9)  
- `mechanic_rag/docs/PUBLIC_FLIP_CHECKLIST.md`  
- `mechanic_rag/docs/ARCHITECTURE.md`  
- `mechanic_rag/GETTING_STARTED.md` / `INTERVIEW.md` / `README.md`  
- `mechanic_rag/mecharag/eval_cmd.py` (paired ask — read-only unless harness bug)  
- `mechanic_rag/mecharag/fixture_source.py` (heading split — know how new `###` become chunks)  
- `second_brain/docs/workflow_os/rails/QUALITY_STANDARD.md`  

**Forbidden as lift/freeze evidence:** proxy `ce_vs_rrf_delta_hits=+1` / `n=5`; OEM/wiring invent; empty-gold hard-miss growth as “lift path”; Guide 07 paraphrase-style traps.

---

## Architecture constraints (binding)

1. **Fixture + eval growth + paired re-baseline only.** No ranking redesign, model swaps, CE_TOP_K changes as “fix,” PrivateGold, Drive, Ford, second vehicle catalog.  
2. **Vehicle:** `fixture:honda-s2000-demo` only.  
3. **T1 corpus:** Add **1–3** synthetic confusable `###` sections to `service_manual.txt`. Banner/comment that text is **synthetic demo**, not OEM. Prefer new section numbers under existing chapters (e.g. `1-3`, `3-3`, `4-3`) or a new `## 7 …` chapter if cleaner — Implement chooses; keep ≤3 new `###`.  
4. **Hit predicate unchanged:** citation∩gold — not answer-substring alone for lift.  
5. **Metric SSOT:** `ce_vs_rrf_ask_delta_hits`, `rrf_only_ask_hits`, `ce_ask_hits`, plus **CE-helps / CE-hurts**.  
6. **No auto-freeze / no §9 freeze flip / no public-flip claim** — even if delta > 0.  
7. **Candidates stay candidates** until separate Tom freeze authorize.  
8. **No empty-gold hard misses** as the Guide 08 band — they cannot create CE-helps.  
9. **Twin-process paired ask** is DoD for re-baseline (operator path); not CI-mandatory.  
10. **Re-ingest required** after fixture edit (content hash changes) before eval.

---

## Soft pins (binding for Implement)

| Pin | Locked default |
|-----|----------------|
| Path | **T1-primary** harder traps + re-baseline |
| Synthetic sections | **1–3** confusable `###` (inclusive); **default 2** if inventory supports |
| New trap cases | **+5 to +10**; **default +6** after T1 (quality > pad) |
| Resulting n | **43–48** (from current 38) |
| IDs | Continue `g39`… (no reuse of g01–g38) |
| `vehicle_id` | **`fixture:honda-s2000-demo`** |
| Case schema | `id`, `question`, `vehicle_id`, `allowed_content_substrings`, `allowed_section_paths`, `notes` |
| Gold shape | **Single-primary** gold section; **no** g29/g30 multi-allow clones |
| Anti-paraphrase | See dedicated section below — **hard fail** if violated |
| Generator | `gemma4:e2b` |
| CE | `Xenova/ms-marco-MiniLM-L-6-v2` / `transformers_js` / `classification` |
| Embed | `nomic-embed-text` @ 768 — **candidate** |
| Re-baseline | Twin Next `:3000` CE-on + `:3001` `MECHANIC_FORCE_RRF_ONLY=1` + `mecharag eval --golden evals/ --ask-url … --ask-url-rrf-only …` |
| CE-helps / CE-hurts | Record in MODEL_FREEZE **Guide 08** table |
| Freeze after run | **Human-only; no auto-freeze** |
| Public flip | **Out of scope** |

### Anti-paraphrase rules (hard)

1. New `question` must **not** be a near-rephrase of any existing case in `golden_fixture_v1.json` (Guide 07 Review residuals are the floor: g33≈g14, g34≈g21, g35≈g12, g31≈g19, g32≈g04, g36≈g20, g37≈g16, g38≈g18).  
2. Prefer gold facts that live in **new T1 sections** or require choosing between a **new confusable pair** — not re-asking old easy facts.  
3. `notes` must state: trap class, gold section, distractor section, and **why ranking disagreement is plausible** (shared tokens / competing numbers).  
4. Non-empty `allowed_content_substrings` and `allowed_section_paths`; substrings must appear **verbatim** in fixture after T1 edit.  
5. Forbid CE-probe-as-gold without fixture substrings.  
6. Forbid empty `allowed_*` hard misses in the Guide 08 band.

### Soft-default T1 section inventory (illustrative — Implement may rename)

Add **1–3** of these (or equivalent confusable pairs). Each pair must share **lexical overlap** (same domain words) but **different** numeric/procedural facts.

| Soft section id | Confusable with | Distinct fact intent |
|-----------------|-----------------|----------------------|
| `1-3 Oil Filler Cap Torque` (synthetic) | 1-1 drain plug torque / 1-2 filter | Separate N·m for filler cap vs drain plug |
| `3-3 Cold vs Hot Spark Gap Note` (synthetic) | 3-1 electrode gap | Alternate gap rule under “inspection” wording that steals “gap” tokens |
| `4-3 Cooling Fan Switch Temp` (synthetic) | 4-2 thermostat begin/full open | Fan-on temperature near thermostat numbers |
| `7-1 Brake Fluid Spec` (synthetic new chapter) | 2-2 clutch hydraulic DOT | Same DOT language, different system — only if still ≤3 new `###` total |

**Design intent:** Questions that say “torque,” “gap,” “temperature,” or “DOT” should have a **wrong but lexically strong** neighbor chunk so RRF may cite the distractor while CE may promote gold (or vice versa).

### Soft-default trap inventory (illustrative — `g39`…)

| Soft id | Trap class | Gold (intent) | Distractor |
|---------|------------|---------------|------------|
| `g39-trap-filler-cap-torque` | Confusable torque | New 1-3 filler cap N·m | 1-1 drain 39 N·m |
| `g40-trap-fan-switch-temp` | Confusable temp | New 4-3 fan switch °C | 4-2 begin/full open |
| `g41-trap-inspection-gap` | Confusable gap | New 3-3 inspection gap rule | 3-1 install gap |
| `g42-trap-dot-clutch-not-brake` | Confusable fluid | 2-2 clutch DOT | New 7-1 brake DOT (if added) **or** skip if 7-1 not chosen |
| `g43-trap-thermo-vs-fan` | Near-dup temps | 4-2 full open | New 4-3 fan |
| `g44-trap-drain-vs-filler-torque` | Lexical torque | 1-1 drain | New 1-3 filler |

Implement may drop/rename rows as long as **+5–10** cases, anti-paraphrase, and T1 sections exist. Prefer traps whose gold is in **new** sections when possible.

---

## Acceptance criteria (Implement — unchecked until then)

- [ ] 1–3 synthetic confusable `###` sections added; demo/synthetic labeling present  
- [ ] Fixture re-ingested; new chunks queryable  
- [ ] +5–10 anti-paraphrase trap cases (`g39`…); schema valid; substrings in fixture  
- [ ] Paired ask re-baseline; `last_run_summary.json` refreshed  
- [ ] CE-helps / CE-hurts reported in MODEL_FREEZE Guide 08 table  
- [ ] Status tables **candidate**; VISION §9 freeze + public-flip remain `- [ ]`  
- [ ] Honesty surfaces updated for new n + delta (no lift/freeze/public-flip theater)  
- [ ] No ranking code changes; no LICENSE invent; no public-flip claim  

---

## Ordered step checklist

All boxes start unchecked. **Do not check in Write / Refine / Ready-check.** Only Implement checks them.

### Phase A — Re-anchor + anti-paraphrase audit

- [ ] **A1.** Confirm baseline: n=38; delta 0; helps=0; hurts=0; candidates; §9 unchecked.  
- [ ] **A2.** List existing questions that must **not** be paraphrased (at least Guide 07 residual pairs).  
- [ ] **A3.** Confirm T1 budget: choose **1–3** confusable sections from soft inventory (or equivalent).  
- [ ] **A4.** Do **not** flip VISION §9; do not change candidate→frozen.

### Phase B — Synthetic confusable sections (T1)

- [ ] **B1.** Edit `fixtures/honda_s2000_demo/service_manual.txt`: add chosen sections; keep heading style (`##` / `###`); include a one-line synthetic/demo note in section body or chapter banner.  
- [ ] **B2.** Ensure each new section has **distinct** facts (numbers/procedures) that overlap lexically with a distractor.  
- [ ] **B3.** Run `mecharag ingest --source fixtures` (expect hash change / new chunks).  
- [ ] **B4.** Spot-check DB or ask smoke that new section paths appear.

### Phase C — Author harder trap goldens

- [ ] **C1.** Add **5–10** cases `g39`… with single-primary gold; prefer gold in T1 sections.  
- [ ] **C2.** Enforce anti-paraphrase rules; `notes` include disagreement rationale.  
- [ ] **C3.** Update golden metadata / debt / `PATH_TO_30.md` for Guide 08 band.  
- [ ] **C4.** Reject eval gaming: no CE-probe golds without fixture substrings.

### Phase D — Paired-ask re-baseline

- [ ] **D1.** Twin Next (`:3000` CE-on, `:3001` `MECHANIC_FORCE_RRF_ONLY=1`).  
- [ ] **D2.** `mecharag eval --golden evals/ --ask-url … --ask-url-rrf-only …` → overwrite `last_run_summary.json`.  
- [ ] **D3.** Compute CE-helps / CE-hurts; record Guide 08 table in `MODEL_FREEZE_STATUS.md`; keep **candidate**; **no freeze flip**.  
- [ ] **D4.** If delta still 0: refresh keep note that T1 attempt may still be weakly discriminative — **do not** invent lift.

### Phase E — Honesty Align (thin)

- [ ] **E1.** Update INTERVIEW / GETTING_STARTED / README maturity lines for new n + delta.  
- [ ] **E2.** Optional VISION §9 footnote — **without** checking freeze/public-flip.  
- [ ] **E3.** Update Guide 08 context Outcome if present; ARCHITECTURE honesty if stale.  
- [ ] **E4.** If delta > 0: report; still **no auto-freeze**; leave §9 unchecked.

### Phase F — Stop

- [ ] **F1.** No public-flip claim; no LICENSE invent; no ranking redesign.  
- [ ] **F2.** Stop for Review. Freeze decision is a **separate** human Stage after metrics.

---

## Verification / Definition of Done

```bash
# From mechanic_rag/
python3 - <<'PY'
import json, re
from pathlib import Path
fix = Path("fixtures/honda_s2000_demo/service_manual.txt").read_text()
# rough: more ### than Guide 07 baseline of 10
n_sec = len(re.findall(r"^### ", fix, re.M))
assert 11 <= n_sec <= 13, f"expected +1..3 sections over 10, got {n_sec}"
assert "synthetic" in fix.lower() or "demo" in fix.lower()
g = json.load(open("evals/golden_fixture_v1.json"))
cases = g["cases"]
n = len(cases)
assert 43 <= n <= 48, n
ids = [c["id"] for c in cases]
assert len(ids) == len(set(ids))
new = [c for c in cases if re.match(r"^g(39|4\d|5\d)", c["id"])]
assert 5 <= len(new) <= 10, [c["id"] for c in new]
old_qs = {c["question"].strip().lower() for c in cases if c not in new}
for c in new:
    assert c["vehicle_id"] == "fixture:honda-s2000-demo"
    assert c["allowed_content_substrings"] and c["allowed_section_paths"]
    q = c["question"].strip().lower()
    assert q not in old_qs, f"exact duplicate question: {c['id']}"
    for s in c["allowed_content_substrings"]:
        assert s in fix, (c["id"], s)
d = json.load(open("evals/last_run_summary.json"))
assert d["n_cases"] == n
helps = hurts = 0
for c in d.get("cases", []):
    ce = (c.get("ask_ce") or {}).get("citation_gold_hit")
    rrf = (c.get("ask_rrf_only") or {}).get("citation_gold_hit")
    if ce and not rrf: helps += 1
    if rrf and not ce: hurts += 1
print("OK", n, "new", len(new), "sections", n_sec, "delta", d["ce_vs_rrf_ask_delta_hits"], "helps", helps, "hurts", hurts)
PY

rg -n 'Formal embed/CE|Public flip' docs/VISION.md
# Expect both still "- [ ]"

rg -n 'Guide 08|candidate|helps|hurts|frozen' evals/MODEL_FREEZE_STATUS.md
# Must find Guide 08 evidence + candidate; must NOT flip to frozen

test ! -f LICENSE
```

**DoD (Implement):** T1 sections + anti-paraphrase traps landed; paired re-baseline written; helps/hurts reported; candidates + §9 unchanged; honesty matches numbers; no auto-freeze; no public-flip; no ranking redesign.

**DoD (Write — this pass):** Executable guide with steps, DoD, blast radius, edge cases, anti-paraphrase, T1 pins; **no Implement**.

---

## Blast radius and risks

| Risk | Angle | Mitigation |
|------|-------|------------|
| Repeat Guide 07 paraphrase theater | Interview / metrics | Anti-paraphrase hard rules; prefer gold in T1 sections |
| Eval gaming | Trust | Fixture substrings; Review rejects CE-tuned golds |
| Synthetic text mistaken for OEM | Legal | Demo/synthetic labeling in fixture |
| Freeze theater after +delta | Portfolio | No auto-freeze; §9 grep in DoD |
| Public-flip creep | Marketing | Out of scope |
| Ingest skipped | Eval on stale chunks | Phase B3 mandatory |
| Twin ops pain | Operator | Document ports; not CI-mandatory |
| Ranking redesign temptation | Scope | Forbidden |

### Rollback

Revert fixture + golden + summary + honesty doc commits; re-ingest prior fixture hash if needed.

---

## Edge-case handling

| Case | Behavior |
|------|----------|
| Still flat after T1 | Acceptable evidence attempt; keep parked; no lift invent |
| Delta > 0 | Report helps/hurts; **stop**; Tom freeze Stage separate |
| Delta < 0 | Document CE-hurts; freeze more forbidden |
| Cannot fit honest traps in ≤3 sections | Prefer fewer high-quality traps (≥5) over padding; STOP if <5 |
| New section breaks fixture parser | Fix heading format only; no ranking changes |
| Temptation to change CE_TOP_K to “create” delta | **Forbidden** — eval gaming |
| Paraphrase of g01–g38 slips in | Review rejects; rewrite before shippable |

---

## Stop conditions

- **Write-dev-guide:** Stop after this guide; **no Implement**; prefer hub fan-in before Ready-check.  
- **Later Implement:** Stop when Phases A–F DoD met; never auto-freeze; never public-flip.  
- **Stop for human if:** invent freeze/lift/public flip; OEM invent; ranking redesign; LICENSE invent; anti-paraphrase impossible without scope break.

---

## Locked decisions (do not reopen)

| Decision | Lock |
|----------|------|
| Write Guide 08 | **W** |
| Corpus | **T1** 1–3 synthetic confusable sections |
| Auto-freeze | **Forbidden** |
| Public flip | **Forbidden** |
| Model status default | **Candidates** until Tom lock after evidence |

---

## Write pass 122 notes

- T1-primary supersedes Guide 07 “prefer existing text first” for *this* guide — existing-only already failed.  
- Soft inventories are illustrative; anti-paraphrase + section budget are binding.  
- Flat after T1 remains an honest, shippable Implement outcome for the *evidence attempt*.  
- Ready-check / Implement require separate Stage authorize (hub resume).
