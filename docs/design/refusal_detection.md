# Design: return `insufficient_evidence` when the generator says it can't answer

**Status:** Written before the fix; the fix shipped 2026-10-26. Kept as the design record.
**Scope:** `isEvidenceInsufficient` in `web/src/server/citations.ts`. No retrieval or ranking change.

## Problem

The 4 golden questions the fixture manual does not answer (g10, g23, g24, g25) all came back `answered` on the local `gemma4:e2b` (`evals/evidence/2026-09-24_rrf_vs_ce_paired.json`). The first plan was to abstain when retrieval is weak. Measuring the model's actual replies showed something simpler: for g23 and g25 the model did refuse ("The context provided does not contain information…", "Context is insufficient."), and `isEvidenceInsufficient` did not recognise either wording, so the refusal was returned as an answer with citations.

## Rule

> If the generator's reply says the context is insufficient or does not contain the information, the outcome is `insufficient_evidence`, with the existing reply text and no citations.

Two phrasings are added to the existing list: `context (provided) is/are insufficient`, and `context (provided) does not contain|mention|provide|have|include`. The second also covers the order "The context provided does not…". The system prompt tells the model to "say so clearly" when the context is insufficient, so these are the words it is most likely to use.

## Why not a retrieval-score threshold

Tried first, with the top vector distance (the signal that separated best: AUC 0.97 on 68 questions). A threshold that refused all 4 golden questions (0.317) sat 0.001 from the nearest answerable question, and it refused paraphrased answerable questions on the development set. After the detector fix it added nothing on any of the three question sets. Not built; the numbers are in `evals/evidence/2026-10-26_refusal_detection.md`.

## Known limit

A model that answers with an invented number (h09, "heater core" capacity, answered with the engine coolant capacity) is not caught by any of this. That needs a retrieval or grounding check and is a separate change.
