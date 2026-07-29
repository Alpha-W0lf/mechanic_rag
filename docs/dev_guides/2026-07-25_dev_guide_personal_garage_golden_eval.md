# Dev guide — Personal garage golden-question set (thin)

**Date:** 2026-07-25  
**Repo:** `mechanic_rag`  
**Work item:** Small private-garage golden JSON for `mecharag eval` (citation∩gold) — separate from public fixture n=44  
**Stage that authored this:** Write → Ready → Implement (Tom authorize chain)  
**Status:** **Implement Met + Review Pass** (2026-07-25) · Ready was Go 8.7/10  

### Declare (Implement)

| Item | Value |
|------|-------|
| Will write | `evals/golden_garage_v1.json` · GETTING_STARTED · context · Review |
| Will **not** | Merge into fixture goldens · CE lift claim · freeze reopen |

---

## 1. Objective

Ship a **thin** garage golden file that scores personal `cat:` ask via existing `mecharag eval` **citation∩gold** (not answer-string theater).

**Success signal (Implement Met):**

1. File `evals/golden_garage_v1.json` exists with **8 cases**: 4 positive torque (one per garage vehicle) + 4 hard-miss (empty gold lists).  
2. Does **not** alter `evals/golden_fixture_v1.json` or public n=44 freeze baseline.  
3. Invoke with **explicit file** (dir loader only takes first `golden*.json`):  
   `uv run mecharag eval --golden evals/golden_garage_v1.json`  
4. Live run (Next + Compose + Ollama up): all **4 positives** `citation_gold_hit=true`; all **4 hard-miss** `citation_gold_hit=false`.  
5. Docs honesty: garage goldens ≠ public fixture eval; OEM torque substrings in git are intentional private-eval evidence (not public-flip corpus).  
6. No harness rewrite unless a blocking bug (prefer reuse).

**Out of Met:** Paired CE ablation on garage · ≥30 garage cases · wiring family traps · expect_outcome enforcement in harness · multimodal.

---

## 2. Locked decisions (Tom 2026-07-25)

| Decision | Locked |
|----------|--------|
| Path | `evals/golden_garage_v1.json` |
| Size | **8** cases (4 positive + 4 hard-miss) |
| Vehicles | All four personal garage `cat:` ids |
| Metric | Existing ask `citation_gold_hit` |
| Invoke | Explicit `--golden evals/golden_garage_v1.json` |
| Public fixture file | **Untouched** |
| Rights | Short OEM torque/procedure substrings allowed in this private golden file only |

**Positive questions** (reuse smoke anchors):

| `vehicle_id` | Question | Preferred `allowed_content_substrings` (DB-verified at Write) |
|--------------|----------|----------------------------------------------------------------|
| `cat:2015-triumph-street-triple` | Sump drain plug torque | `Sump drain plug to sump 25` |
| `cat:2003-honda-s2000` | Engine oil drain bolt torque | `33 lbf.ft`, `45 N.m` |
| `cat:2021-yamaha-yxz1000r-ss-se` | Engine oil drain bolt tightening torque | `10 N·m (1.0 kgf·m, 7.4 lb·ft)` (and/or crankcase-specific if needed) |
| `cat:2016-ford-transit-350` | Oil pan drain plug torque | `20 lb.ft (27 Nm)` |

**Hard-miss:** Out-of-corpus questions; empty `allowed_section_paths` + `allowed_content_substrings`; optional `expect_outcome: "insufficient_evidence"` (doc-only — harness does not enforce).

---

## 3. DRY / architecture

1. Reuse `mecharag/eval_cmd.py` — no parallel eval CLI.  
2. Do not invent answer-correctness scoring.  
3. Prefer substrings over fragile PDF page section paths.  
4. Dir `mecharag eval --golden evals/` still means **fixture** file first alphabetically — document that garage must pass **file path**.

---

## 4. References

- `mecharag/eval_cmd.py`, `evals/golden_fixture_v1.json`  
- Ask smoke guides (Triumph + multi-vehicle)  
- `GETTING_STARTED.md`, `evals/PATH_TO_30.md` (honesty pointer only)

---

## 5. Ordered Implement checklist

- [x] **A1.** Author `evals/golden_garage_v1.json` (8 cases + metadata).  
- [x] **A2.** Re-verify substrings exist in Compose `chunks` before claim.  
- [x] **A3.** Run `uv run mecharag eval --golden evals/golden_garage_v1.json` with Next up.  
- [x] **A4.** Record hit counts in guide evidence (do not overwrite fixture baseline claims).  
- [x] **A5.** Thin GETTING_STARTED + living context Rank-3 Met.  
- [x] **A6.** Optional: one-line PATH_TO_30 / ARCHITECTURE honesty — garage private eval separate.

### Implement evidence (2026-07-25)

| Item | Result |
|------|--------|
| Command | `.venv/bin/mecharag eval --golden evals/golden_garage_v1.json --no-paired-ask` |
| `ce_ask_hits` / n | **4** / 8 (positives only; hard-miss correctly non-hits) |
| Positives `citation_gold_hit` | **4/4** (Triumph, S2000, YXZ, Transit) |
| Hard-miss `citation_gold_hit` | **0/4** (all False) — Met |
| Hard-miss `outcome` | Often `answered` (model may still narrate) — **not** Met criterion; citation∩gold is |
| Evidence copy | `evals/last_run_summary_garage_v1.json` (fixture `last_run_summary.json` may be overwritten by later runs) |

---

## 6. DoD

| Gate | Pass |
|------|------|
| File | 8 cases; 4 vehicles |
| Eval run | 4/4 positive citation∩gold; 4/4 hard-miss miss |
| Isolation | Fixture golden untouched |
| Docs | Operator invoke path + honesty |
| Non-goals | No CE lift claim |

---

## 7. Blast / edges

| Risk | Mitigation |
|------|------------|
| Dir eval picks wrong file | Document explicit path; name `golden_garage_*` after fixture alphabetically — still load first only |
| Unicode `N·m` mismatch | DB-verify before lock |
| Generator non-determinism | Metric is citation∩gold not answer text |
| Rights scrutiny | Description banner: private garage eval |

---

## 8. Ready scores (inline — Go)

| Track | Score | Why not 10 |
|-------|-------|------------|
| Guide clarity | 9.0 | Soft: live hit rate unknown until run |
| Harness reuse | 9.2 | No code required |
| Rights / honesty | 8.5 | OEM strings in git — explicit banner |
| Overall | **8.7** | Go |

---

## 9. Stop (Write)

Proceed to Implement when authorized (this session: authorized).
