## Embedding Model Research — Aug 2025

Status: Research in progress — decision pending. We will compare candidates via small-scale retrieval evals before selecting.

### Requirements
- Free-tier friendly; generous rate limits.
- Strong performance on technical English (automotive manuals).
- Reasonable vector dimensionality; supports pgvector HNSW/IVFFlat.

### Candidates
- Google `text-embedding-004` (preferred baseline per `docs/gemini_api_notes.md`): high limits, solid quality.
- Cohere Embed v3 (English/Multilingual): check free-tier status in 2025.
- Open-source (hosted): BGE-base/large, bge-m3; only viable if a free hosted inference exists (no GPU hosting budget).

### Research To-Do
- Verify free-tier terms (as of Aug 2025) and RPM/TPM for each candidate.
- Compare vector dimensions, cosine performance, and cost/limits.
- Run a 100–200 question/answer retrieval probe on a small subset of chunks to estimate Recall@8 and citation precision.
- Record findings and recommendation; only select a model if it clears the baseline by ≥3–5%.

### Preprocessing
- Normalize whitespace, Unicode, and units (e.g., N·m vs lb-ft). Keep case; remove excessive boilerplate.
- Include section path and page range in the chunk text for extra signal.

### Indexing (pgvector)
- Use HNSW where available; otherwise IVFFlat.
- Suggested params: HNSW m=16, ef_search≈100; or IVFFlat lists≈sqrt(N), probes≈10.
- Store L2-normalized vectors; use cosine similarity.

### Evaluation Metrics
- Retrieval: Recall@k, MRR@10, nDCG@10 on the curated S2000 QA set.
- Ablations: compare chunk sizes and top-k values per model.

### Decision Placeholder
- Default to `text-embedding-004` unless another candidate shows ≥3–5% improvement in Recall@8 and better citation precision at similar or lower cost.

