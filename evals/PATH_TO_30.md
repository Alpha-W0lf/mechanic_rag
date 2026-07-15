# Path to ≥30 goldens (Guide 04 — S2000 path complete)

Guide 04 landed **30** fixture cases in `golden_fixture_v1.json` on `fixture:honda-s2000-demo` only (g01–g30).

**Path status:** S2000 golden count target met. Paired ask re-baseline at n=30 completed 2026-07-14 (`ce_vs_rrf_ask_delta_hits=0`; see `evals/last_run_summary.json` + `MODEL_FREEZE_STATUS.md`).

**Still deferred** (public fixtures only — no Drive/Ford/PrivateGold):

1. Second synthetic vehicle when catalog grows.
2. Wiring / procedure distractors once fixture text exists.
3. Degrade-observation notes (not labeled as ablation).

Do **not** encode historical proxy `ce_vs_rrf_delta_hits=+1` / `n=5` as the lift baseline.
