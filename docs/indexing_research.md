## Indexing Research — pgvector on Supabase (Aug 2025)

Status: Research in progress — confirm against Supabase docs at implementation time.

### What we need
- Determine which pgvector index types are supported on Supabase free tier (IVFFlat, HNSW).
- Choose index (and params) for cosine similarity on our expected corpus size.

### Known guidance (to validate)
- Cosine similarity: use `vector_cosine_ops`.
- IVFFlat:
  - Lists ≈ sqrt(num_vectors) as a starting point.
  - `SET ivfflat.probes` around 10 for recall/latency balance.
- HNSW (if supported):
  - `m ≈ 16`, `ef_search ≈ 100` baseline; tune per latency/recall.

### Action items
- [ ] Check Supabase docs for pgvector version and HNSW availability on free tier.
- [ ] If HNSW available: prefer HNSW for interactive retrieval; else use IVFFlat with tuned lists/probes.
- [ ] Benchmark recall/latency on a subset after ingestion; record chosen params.

### Findings from Web Search 1 (Aug 2025)

- Could not locate an authoritative Supabase docs page confirming HNSW availability on free tier.
- Community guidance (to be verified): pgvector HNSW is supported on newer pgvector versions; availability may depend on Supabase Postgres/pgvector version.
- Interim plan: proceed with IVFFlat (lists≈sqrt(N), probes≈10) as baseline; at implementation, check `SELECT extversion FROM pg_extension WHERE extname='vector'` and attempt HNSW index creation in a dev project.

### Findings from Web Search 2 (Aug 2025)

- No authoritative confirmation found via public repos/issues for `CREATE INDEX USING hnsw` on Supabase-managed Postgres.
- Proceed with IVFFlat as baseline; at implementation time, verify by:
  - Checking pgvector version: `SELECT extversion FROM pg_extension WHERE extname='vector'`.
  - Attempting HNSW index creation in a dev DB: `create index ... using hnsw (embedding vector_cosine_ops)` and observing support/errors.

### Findings from Web Search 3 (Aug 2025) — HNSW on Supabase

- Supabase docs include guidance for HNSW indexes with pgvector and operator classes `vector_cosine_ops`, `vector_l2_ops`, `vector_ip_ops`.
- Practical note: pgvector ≥ 0.6.0 supports parallel index builds for faster HNSW creation; ensure project uses a recent version.
- Tuning reminders: consider `m`, `ef_construction`, and `ef_search`; increase `maintenance_work_mem` and `max_parallel_maintenance_workers` during index build.
- Action: Prefer HNSW for interactive retrieval if available; otherwise fallback to IVFFlat. Confirm availability in the target Supabase project at implementation time.


