# Refusal detection: before vs after

**Date:** 2026-10-26 · **Before:** `1bb7b8a` · **After:** the commit that adds this file
**Stack:** local Compose, generator `gemma4:e2b`, embeddings `nomic-embed-text`, `MECHANIC_FORCE_RRF_ONLY=1` (the cross-encoder could not run on this machine: the `sharp` native module is not built), rate limiter off, one ask per question, run one after the other.
**Evidence JSON:** `evals/evidence/2026-10-26_refusal_detection.json` (every reply, both arms).
**Questions:** `evals/golden_fixture_v1.json` (40 answerable, 4 unanswerable) plus `evals/abstain_extra_a.json` and `evals/abstain_extra_b.json` (12 unanswerable and 12 answerable each, written for this check).

## Results

| Set | Unanswerable refused, before | after | Answerable answered, before | after |
| --- | ---: | ---: | ---: | ---: |
| Golden (4 / 40) | 2 / 4 | **4 / 4** | 40 / 40 | 39 / 40 |
| Extra A (12 / 12) | 7 / 12 | **11 / 12** | 11 / 12 | 12 / 12 |
| Extra B (12 / 12) | 4 / 12 | **12 / 12** | 12 / 12 | 11 / 12 |
| **Total (28 / 64)** | **13 / 28** | **27 / 28** | **63 / 64** | **62 / 64** |

Citation hit on answered answerable questions: before 62 of 63, after 62 of 62 (section match, as in the 2026-10-20 evidence).

## Reading it

- **The model was already refusing most of these.** Before the fix, 14 of the 15 unanswerable questions counted as `answered` were refusals written as "Context is insufficient." or "The context provided does not contain information…". The one real miss left is h09 ("heater core" capacity): the model answered with the engine coolant capacity. That is a wrong answer, not a refusal, and no detector fixes it.
- **Answerable questions refused after the fix: g28 and v17.** Both are replies of the same kind the detector now reads correctly: in the before arm g28 said "Context is insufficient." (counted as answered), and v17 refused in the after arm but answered in the before arm. Run to run the model flips on a few questions (h15 refused before, answered after), so read ±1 or 2 per set as noise. One ask per question; no repeat runs.
- **A retrieval-distance gate was built and removed.** With the old detector (threshold 0.317) it refused 3 of 4 golden questions, and answerable v17 was refused. With the new detector it changed no result on any of the three sets. See `docs/design/refusal_detection.md`.
- **Not unseen.** The detector wording was written after reading the model's replies on the golden set and on the extra sets, so these sets do not test it on text it never saw. The wording is the system prompt's own ("context is insufficient"). n is small and the corpus is one synthetic 20-chunk manual.

## Unverified

- Hosted `gemma-4-26b-a4b-it` was not run. Its refusals were not recorded (the 2026-10-20 plan notes they match "insufficient evidence").
- Cross-encoder arm not run here.
