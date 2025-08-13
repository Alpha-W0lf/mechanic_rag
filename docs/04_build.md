## Phase 4 — Evaluation & Tuning

Objective: Establish a small-but-realistic S2000 QA set and tune retrieval/chunking to meet acceptance targets.

### Steps
1) Dataset curation
   - Create 30–50 questions across maintenance, torque, diagnostics, fluids, safety.
   - Store as JSON/CSV with expected citation sections/pages if known.

2) Evaluation harness
   - Script to run queries, capture retrieved chunks, answers, and citations.
   - Compute Recall@k, MRR@10, nDCG@10, citation presence/correctness, and factuality spot-checks.

3) Tuning loop
   - Vary chunk size/overlap, dynamic `k`, MMR λ, and similarity thresholds.
   - Record results; select configuration meeting targets.

Exit criteria
- Meets initial thresholds: ≥85% citation presence, ≥75% factuality (spot-check), ≥80% Recall@8.

