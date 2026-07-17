# Path to ≥30 goldens (Guide 04 complete; Guide 07 discriminative band)

Guide 04 landed **30** fixture cases in `golden_fixture_v1.json` on `fixture:honda-s2000-demo` only (g01–g30).

**Guide 07 (Path A):** Added **+8** discriminative single-primary traps (`g31`–`g38`); n=**38**. Paired ask re-baseline required after growth (see `evals/last_run_summary.json` + `MODEL_FREEZE_STATUS.md`). **No auto-freeze.**

**Path status:** S2000 golden count ≥30 met; discriminative trap band landed. Formal embed/CE freeze + public flip still open.

**Still deferred** (public fixtures only — no Drive/Ford/PrivateGold):

1. Second synthetic vehicle when catalog grows.
2. Wiring / procedure distractors once fixture text exists.
3. Degrade-observation notes (not labeled as ablation).

Do **not** encode historical proxy `ce_vs_rrf_delta_hits=+1` / `n=5` as the lift baseline.
