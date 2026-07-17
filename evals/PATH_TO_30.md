# Path to ≥30 goldens (Guide 04–08)

Guide 04 landed **30** fixture cases on `fixture:honda-s2000-demo` (g01–g30).

**Guide 07 (Path A):** +8 traps (`g31`–`g38`); n=**38**; paired ask flat (helps=0/hurts=0). Soft residual: near-paraphrase band.

**Guide 08 (T1):** +3 synthetic confusable `###` sections + **+6** anti-paraphrase traps (`g39`–`g44`); n=**44**. Paired ask re-baseline required. **No auto-freeze.**

**Path status:** S2000 ≥30 met; discriminative attempts Guide 07–08 landed. Formal embed/CE freeze + public flip still open.

**Still deferred** (public fixtures only):

1. Second synthetic vehicle when catalog grows.
2. Wiring / procedure distractors once fixture text exists.
3. Degrade-observation notes (not labeled as ablation).

Do **not** encode historical proxy `ce_vs_rrf_delta_hits=+1` / `n=5` as the lift baseline.
