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

### Findings from Web Search 1 (Aug 2025) — Google text-embedding-004

- Model notes: widely used semantic embedding model; historically generous free-tier quotas (see `docs/gemini_api_notes.md`).
- Operational notes: reports of intermittent latency spikes under load; scheduled deprecation around Nov 2025 with migration path to a successor (e.g., `text-embedding-005`).
- Practical implication: viable baseline today, but plan an easy switch (env/config) to a successor model; avoid hard-coding vector dimensions.
- Action: confirm current vector dimension and quotas at implementation time; design schema and code to tolerate model swaps (re-embed workflow).

### Findings from Web Search 2 (Aug 2025) — BGE-M3 (BAAI)

- Multi-function embedding: supports dense, sparse (lexical/BM25-like), and multi-vector (ColBERT-like) representations from one model; useful for hybrid retrieval without separate pipelines.
- Multilingual coverage (100+ languages) and long-context inputs (up to ~8k tokens) reported; strong cross-lingual retrieval performance on public benchmarks.
- Open-source; runs locally but benefits from GPU for throughput. CPU-only on M2 Max likely acceptable for small batches; not ideal for bulk re-embedding.
- Integration note: pgvector stores dense vectors; sparse/multi-vector outputs would need additional storage/logic. For MVP, use dense-only mode.

### Findings from Web Search 3 (Aug 2025) — Google text-embedding-005

- Successor to `text-embedding-004`; intended migration target per Google guidance.
- Action items for implementation time:
  - Confirm current vector dimension and multilingual support on `ai.google.dev`.
  - Verify free-tier quotas/RPM/TPM and pricing.
  - Ensure code/config can toggle model via env; avoid hard-coding dimensions; support re-embedding workflow.
- Schema note: keep `embedding` column without fixed dimension to tolerate model swaps; validate index settings after migration.

### Findings from Web Search 4 (Aug 2025) — Cohere Embed v3

- Variants: `embed-english-v3.0` and `embed-multilingual-v3.0` (1024-dim); light variants (`-light-v3.0`) produce 384-dim vectors; typical max input ~512 tokens.
- Input types allow optimization (`search_query`, `search_document`, `classification`, `clustering`). Use search_document for chunks; search_query for queries.
- Multilingual option covers 100+ languages; English variants slightly better for purely English corpora.
- Integration: store as cosine-normalized vectors in pgvector; document dimensions per model; avoid mixing dimensions in a single table or store dimension per row.

### Findings from Web Search 5 (Aug 2025) — Jina Embeddings v3

- Jina offers hosted and open models with strong multilingual support; commonly 1024–3072 dimensions depending on variant; check docs for exact dims.
- Pros: good quality on retrieval benchmarks; generous OSS ecosystem; some hosted free tiers exist intermittently.
- Cons: vendor lock-in risk if using proprietary hosted endpoints; local open variants may require GPU for throughput.
- Integration: treat similar to Cohere/Google; confirm dimension, normalize vectors, and keep model/dimension in metadata for safe swaps.

### Update Check (Aug 2025) — Google text-embedding-005

- This search did not yield authoritative dimension/quota details. Keep the migration target, but verify on `ai.google.dev` at implementation time and capture: vector dimension, multilingual notes, and quotas/pricing.

### Additional Landscape (Aug 2025) — Broader Embeddings

- OpenAI (hosted): `text-embedding-3-small` (good quality/cost), `text-embedding-3-large` (higher quality, 3072-dim). Pros: strong benchmarks, easy API; Cons: paid tier, free credits vary; Vercel serverless friendly.
- OSS on Hugging Face: bge-base/large, bge-m3, e5, instructor; Pros: no vendor lock-in; Cons: CPU-only on M2 is slow for bulk; GPUs not available on Vercel free; embedding jobs better run locally/offline.
- Other hosted: Jina embeddings, VoyageAI, Cohere: Pros: strong multilingual/models; Cons: varying free tiers/quotas.
- Deployment constraints: Vercel free has no GPU; serverless suitable for generation + retrieval; heavy embedding best done offline or via hosted API during ingestion.
- Decision impact: Keep env-driven model selection; default to Google 004 for MVP; allow swapping to OpenAI/Cohere if quotas or quality require it; run ingestion locally (M2 Max) or in a one-off batch service.

