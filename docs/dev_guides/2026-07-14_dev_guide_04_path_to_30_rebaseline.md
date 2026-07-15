# Dev Guide 04 — Path-to-≥30 goldens + paired-ask re-baseline

**Date:** 2026-07-14  
**Repo:** `mechanic_rag`  
**Work item:** Guide 04 — fixture goldens → ≥30 + paired-ask re-baseline  
**Stage that authored this:** Write-dev-guide (pass 43); Refine-dev-guide (pass 44)  
**Status:** **Implemented** (Guide 04 Implement, 2026-07-14)

**Context SSOT:** `mechanic_rag/docs/2026-07-14_guide04_path_to_30_rebaseline_context_summary.md`  
**Prerequisite:** Guides 01–03 shippable (hybrid→CE, paired ablation n=12 delta 0, packaging). This guide grows **fixture eval only** — no ranking redesign, no freeze-as-DoD, no PrivateGold/Drive/Ford.

---

## Objective

Raise the public fixture golden set from **n=12 → ≥30** on `fixture:honda-s2000-demo`, then re-run the **paired ask ablation** under `gemma4:e2b` and refresh honesty docs.

**Success signal:** `golden_fixture_v1.json` has ≥30 distinct cases with real gold substrings from the S2000 fixture; `last_run_summary.json` + `MODEL_FREEZE_STATUS.md` show fresh ask-delta metrics; freeze remains **human-only** (not required for DoD).

---

## Learning notes (new for this guide)

1. **Golden growth ≠ freeze** — More cases improve coverage; they do not invent CE lift. Freeze stays a human claim after evidence.

2. **Unused fixture seeds** — The 63-line S2000 manual still has unused facts (oil grade, radiator cap, spark type/interval, coolant mix, thermostat full-open, MTF fill). Prefer those before paraphrasing existing goldens.

3. **Ask-delta vs proxy-delta** — Honest field is `ce_vs_rrf_ask_delta_hits`. Proxy `ce_vs_rrf_delta_hits=+1` / `n=5` remains forbidden as lift.

4. **Ablation ≠ degrade** — Keep `ablation_rrf_only` distinct from `rerank_degraded`.

---

## References (paths only)

- `mechanic_rag/docs/2026-07-14_guide04_path_to_30_rebaseline_context_summary.md`
- `mechanic_rag/docs/VISION.md` (§9)
- `mechanic_rag/docs/ARCHITECTURE.md` (§7, §10, §15)
- `mechanic_rag/evals/golden_fixture_v1.json`
- `mechanic_rag/evals/PATH_TO_30.md`
- `mechanic_rag/evals/MODEL_FREEZE_STATUS.md`
- `mechanic_rag/evals/last_run_summary.json`
- `mechanic_rag/fixtures/honda_s2000_demo/service_manual.txt`
- `mechanic_rag/docs/dev_guides/2026-07-13_dev_guide_02_rrf_ablation_eval_freeze.md`
- `mechanic_rag/GETTING_STARTED.md` / `INTERVIEW.md` (honesty touch)
- `second_brain/docs/2026-07-14_prioritize_next_work_guide04_pass40_fan_in.md`
- `second_brain/docs/2026-07-14_refine_context_guide04_pass42_fan_in.md`
- `second_brain/docs/workflow_os/rails/QUALITY_STANDARD.md`

---

## Architecture constraints (binding)

1. **Fixture eval growth + re-baseline only.** No ranking redesign; no PrivateGold/Drive/Ford; no second vehicle catalog; no mandatory freeze.  
2. **Vehicle scope:** `fixture:honda-s2000-demo` only.  
3. **Theme mix** — soft pins below.  
4. **Metric rails:** ask-delta honesty; proxy lift forbidden.  
5. **Same-delivery docs honesty** for VISION §9 / PATH_TO_30 / MODEL_FREEZE_STATUS / README / INTERVIEW eval maturity lines.  
6. Do not invent fixture facts not in `service_manual.txt`.

---

## Soft pins (locked defaults)

| Pin | Locked default |
|-----|----------------|
| Count | **≥30** distinct `cases[]` in `golden_fixture_v1.json` |
| Vehicle | `fixture:honda-s2000-demo` only |
| Theme mix (new ≈ +18) | **+10** positives; **+3** hard misses; **+3** negative/never-mix; **+2** multi-section |
| Deferred themes | Second vehicle; wiring (no text); degrade-as-cases |
| Case schema keys | `id`, `question`, `vehicle_id`, `allowed_content_substrings`, `allowed_section_paths`, `notes` |
| Prefer unused seeds | SAE 10W-30/API SJ; oil filter 3/4 turn; NGK PFR7G-11; 105k interval; 50/50 Type 2; radiator cap 93–123 kPa; thermostat full-open 95 °C; MTF fill-to-filler |
| Re-baseline command | Twin servers + `mecharag eval --golden evals/ --ask-url … --ask-url-rrf-only …` (see MODEL_FREEZE_STATUS) |
| Freeze | **Not** DoD — optional human keep-with-justification after evidence |
| PATH_TO_30 header | Retitle Guide 02 → Guide 04 / path-complete language |
| Twin ablation in CI | **Not required** — operator re-baseline is DoD; document twin ports; do not fail default CI if second Next missing |
| Illustrative inventory | Soft-default `g13`–`g30` table below — Implement may rename within theme if counts hold |

### Soft-default new-case inventory (n: 12 → 30; +18)

**Positives (+10)** — gold substrings must appear in `service_manual.txt`:

| id | Theme seed | Gold substring hint (must appear in fixture) |
|----|------------|-----------------------------------------------|
| `g13-oil-grade` | API SJ / SAE 10W-30 | `SAE 10W-30` or `API SJ` |
| `g14-oil-filter-turn` | filter install | `additional 3/4 turn` |
| `g15-spark-plug-type` | plug type | `NGK PFR7G-11` |
| `g16-spark-interval` | interval | `105,000 miles` |
| `g17-coolant-mix` | mix ratio | `50/50` + `Type 2` (or equivalent both present) |
| `g18-radiator-cap` | cap pressure | `93–123 kPa` or `13.5–17.8 psi` |
| `g19-thermostat-full-open` | full open | `95 °C` or `203 °F` |
| `g20-mtf-fill` | fill procedure | `bottom of the filler hole` |
| `g21-clutch-pushrod` | adjust cue | `clutch master cylinder pushrod` |
| `g22-spark-misfire-inspect` | early inspect | `misfire DTCs` |

**Hard misses (+3)** — empty `allowed_content_substrings` / `allowed_section_paths` (g10 pattern); out-of-corpus:

| id | Question intent |
|----|-----------------|
| `g23-hard-miss-brake-pad-pn` | brake pad OEM part number |
| `g24-hard-miss-ecu-pinout` | ECU connector pinout (not ABS — distinct from g10) |
| `g25-hard-miss-tsb-oil` | oil-consumption TSB number |

**Negative / never-mix (+3)** — polarity with locators where fixture supports:

| id | Intent | Gold / notes |
|----|--------|--------------|
| `g26-never-mix-clutch-fluid` | reinforce never-mix | `Never mix fluid types` (clutch hydraulic) |
| `g27-wrong-oil-20w50` | reject wrong viscosity as specified | gold = `SAE 10W-30` (answer must not treat 20W-50 as correct) |
| `g28-never-atf-in-mtf` | ATF ≠ MTF | gold = `Honda Manual Transmission Fluid` / `MTF` |

**Multi-section distractors (+2)** — question spans families; gold prefers correct section:

| id | Intent | Prefer section |
|----|--------|----------------|
| `g29-multi-thermo-vs-coolant` | open temp vs capacity distractor | `## 4 Cooling` / `### 4-2 Thermostat` |
| `g30-multi-spark-gap-vs-torque` | gap vs torque distractor | `### 3-1 Specification` electrode gap |

Implement may adjust question prose; **ids + gold hints + theme counts are locked defaults.**

---

## Acceptance criteria (unchecked)

- [x] `golden_fixture_v1.json` ≥30 on S2000 only; distinct ids; gold maps to real fixture lines  
- [x] Theme mix meets pins (or honest shortfall if a theme cannot be filled without inventing text)  
- [x] Paired ask re-run; refresh `last_run_summary.json`; ask-delta honesty; proxy lift forbidden  
- [x] VISION §9 / README / INTERVIEW / `MODEL_FREEZE_STATUS.md` / `PATH_TO_30.md` updated  
- [x] No invented freeze / lift; no ranking redesign; no second vehicle / PrivateGold / Drive / Ford  

---

## Ordered step checklist

All boxes start unchecked. **Do not check boxes in Write / Ready-check.**

### Phase A — Inventory + growth plan

- [x] **A1.** Confirm baseline n=12; list existing `id`s (g01–g12).  
- [x] **A2.** Author new cases per **soft-default inventory** `g13`–`g30` (Soft pins).  
- [x] **A3.** Hard-miss / negative / multi-section follow g10/g11/g09 patterns + table.  
- [x] **A4.** Confirm no second vehicle / wiring invent.

### Phase B — Author ≥30 goldens

- [x] **B1.** Grow `evals/golden_fixture_v1.json` to **≥30** cases; unique `id`s (prefer inventory ids).  
- [x] **B2.** Every positive/negative case: `allowed_content_substrings` and/or `allowed_section_paths` cite real fixture text (hints in Soft pins).  
- [x] **B3.** Hard-miss: empty allowed evidence / out-of-corpus expectations per existing convention.  
- [x] **B4.** Update `n_cases_target_band` / `path_to_30` / `debt` meta honestly (count path met).  
- [x] **B5.** Update `evals/PATH_TO_30.md` header/status for Guide 04 (themes 2/4 still deferred).

### Phase C — Paired-ask re-baseline

- [x] **C1.** Bring up twin Next processes (CE-on `:3000` + `MECHANIC_FORCE_RRF_ONLY=1` on `:3001`) per MODEL_FREEZE_STATUS.  
- [x] **C2.** Run:
  ```bash
  mecharag eval --golden evals/ \
    --ask-url http://127.0.0.1:3000/api/ask \
    --ask-url-rrf-only http://127.0.0.1:3001/api/ask
  ```
- [x] **C3.** Confirm `last_run_summary.json` records `rrf_only_ask_hits`, `ce_ask_hits`, `ce_vs_rrf_ask_delta_hits`, n≥30, generator `gemma4:e2b` (or documented fallback).  
- [x] **C4.** Update `MODEL_FREEZE_STATUS.md` evidence tables for new n + delta; CE stays **candidate** unless human freezes.  
- [x] **C5.** If delta flat/negative: refresh keep-with-justification **stub only** — do **not** invent lift or freeze.  
- [x] **C6.** Do **not** require twin ablation in default CI (Soft pin).

### Phase D — Docs honesty + stop

- [x] **D1.** VISION §9: ≥30 path status / eval maturity honesty.  
- [x] **D2.** README + INTERVIEW eval maturity lines: n≥30; delta from this run; still not freeze unless human.  
- [x] **D3.** Grep proxy `+1` / `n=5` / bare `ce_vs_rrf_delta_hits` as lift — forbid.  
- [x] **D4.** Stop. No ranking redesign; no PrivateGold; no freeze theater.

---

## Verification / Definition of Done

**Done when:**

1. ≥30 distinct fixture goldens on S2000 only with real evidence locators.  
2. Theme mix satisfied (or honest shortfall documented).  
3. Fresh paired ask summary + MODEL_FREEZE_STATUS updated.  
4. Docs honesty same delivery; no freeze/lift theater.  
5. No product ranking code required for DoD beyond eval JSON + docs (+ optional stub).

**Not required:** Human freeze; second vehicle; wiring corpus; CI-mandatory twin ablation (operator path OK if documented); PrivateGold/Drive/Ford.

**Suggested verification:**

```bash
# From mechanic_rag/
python3 - <<'PY'
import json
from pathlib import Path
d=json.loads(Path('evals/golden_fixture_v1.json').read_text())
cases=d['cases']
assert len(cases) >= 30
assert len({c['id'] for c in cases}) == len(cases)
assert {c['vehicle_id'] for c in cases} == {'fixture:honda-s2000-demo'}
print(len(cases))
PY
rg -n '≥30|>= 30|ce_vs_rrf_ask_delta_hits|candidate|PATH_TO_30' docs/VISION.md evals/MODEL_FREEZE_STATUS.md evals/PATH_TO_30.md README.md INTERVIEW.md
# Twin-server re-baseline (operator):
# mecharag eval --golden evals/ --ask-url http://127.0.0.1:3000/api/ask --ask-url-rrf-only http://127.0.0.1:3001/api/ask
```

---

## Blast radius and risks

| Risk | Mitigation |
|------|------------|
| Near-duplicate questions | Distinct ids + distinct gold substrings |
| Invented fixture facts | Quote only `service_manual.txt` |
| Freeze mid-growth | Freeze not in DoD |
| Twin-process flake | Document operator path; don’t fail packaging CI |
| Proxy lift creep | Metric rails + grep |
| PATH_TO_30 stale Guide 02 label | Phase B5 |

### Rollback

Revert golden JSON + eval docs commits; restore n=12 evidence language if reverted.

---

## Edge-case handling

| Edge case | Behavior |
|-----------|----------|
| Hard-miss | citation∩gold miss; do not invent `insufficient_evidence` reliability claims |
| Multi-section distractors | Gold points at correct section family |
| Negative polarity | never-mix / wrong fluid with locators |
| Flat/negative delta | candidate + keep stub; no freeze |
| Asymmetric paired failures | Record honestly |
| Theme shortfall without inventing text | Document; do not fabricate OEM |

---

## Stop conditions / non-goals

**Stop when** DoD met. **Do not:** freeze theater; ranking redesign; second vehicle; PrivateGold; Drive/Ford; claim portfolio v1 via eval count alone.

---

## Honest readiness (after Refine pass 44)

- Material invent reduced: `g13`–`g30` inventory + gold hints + CI twin policy pinned.  
- Remaining craft: exact question sentences (acceptable at Implement).  
- Next: **Ready check before code**. Implement only after Ready + human approve.  
