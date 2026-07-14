# Path to ≥30 goldens (Guide 02)

Guide 02 DoD requires **≥10–15** fixture cases (current `golden_fixture_v1.json`).
Hitting **≥30** is **not** required for Guide 02; freeze/portfolio claims should wait.

Themes to add later (public fixtures only — no Drive/Ford/PrivateGold):

1. More S2000 positives (filter interval, radiator cap, coolant mix, MTF fill).
2. Second synthetic vehicle when catalog grows.
3. More hard misses / insufficient_evidence expectations.
4. Procedure / wiring distractors once fixture text exists.
5. Degrade-observation notes (not labeled as ablation).
6. Negative polarity (wrong fluid / never-mix) with locators.
7. Multi-section questions where CE must prefer the right section.

Do **not** encode historical proxy `ce_vs_rrf_delta_hits=+1` / `n=5` as the lift baseline when adding cases.
