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



## DB Indexing Plan (MVP + Portfolio-Grade)

Goal: robust, fast retrieval with vector + lexical signals on Supabase free tier.

1) pgvector verification and index creation
- Verify version:
```sql
select extversion from pg_extension where extname = 'vector';
```
- Prefer HNSW (cosine):
```sql
create index if not exists idx_chunks_embedding_hnsw
on public.chunks using hnsw (embedding vector_cosine_ops);
```
- Fallback IVFFlat (lists ≈ sqrt(N)):
```sql
create index if not exists idx_chunks_embedding_ivfflat
on public.chunks using ivfflat (embedding vector_cosine_ops) with (lists = 100);
-- at session/query time (if permitted): set ivfflat.probes = 10;
```

2) Lexical search (FTS/BM25-like) over `content`
- Add a generated tsvector and a GIN index (DDL proposed; apply when ready):
```sql
alter table public.chunks
  add column if not exists content_tsv tsvector
  generated always as (to_tsvector('english', coalesce(content,''))) stored;

create index if not exists idx_chunks_content_tsv on public.chunks using gin (content_tsv);
```
- Query with web-style operators:
```sql
-- $1 = query text
with q as (
  select websearch_to_tsquery('english', $1) as tsq
)
select id, docid := id, ts_rank_cd(content_tsv, q.tsq) as bm25
from public.chunks, q
where content_tsv @@ q.tsq
order by bm25 desc
limit 50;
```

3) Vector candidate retrieval (cosine)
```sql
-- $1 = query embedding (vector)
select id, 1 - (embedding <=> $1) as cosine
from public.chunks
order by embedding <=> $1 asc
limit 50;
```

4) Fusion strategy (recommended)
- Default: Reciprocal Rank Fusion (RRF). Stable and simple for portfolio demonstration.
- Alternative: Linear score combine `score = 0.7 * cosine + 0.3 * bm25_norm`.
- Apply MMR after fusion to reduce near-duplicates and enforce section diversity.

RRF sketch (conceptual SQL):
```sql
with
vec as (
  select id, row_number() over (order by embedding <=> $1 asc) as r
  from public.chunks
  limit 50
),
lex as (
  select id, row_number() over (order by ts_rank_cd(content_tsv, websearch_to_tsquery('english', $2)) desc) as r
  from public.chunks
  where content_tsv @@ websearch_to_tsquery('english', $2)
  limit 50
),
rrf as (
  select id, sum(1.0 / (60 + r)) as rrf_score
  from (
    select id, r from vec
    union all
    select id, r from lex
  ) u
  group by id
)
select * from rrf order by rrf_score desc limit 20;
```

5) Tuning guidance
- HNSW: start m=16, ef_search≈100 (where configurable). IVFFlat: probes≈10.
- Candidate pool sizes: 50–100 per modality before fusion; final top-k≈6–12.
- Conditional fusion option: fuse only when top-1 cosine < 0.40 or vector candidates < 3; otherwise vector-only.

6) Instrumentation
- Log top similarities, bm25 ranks, fusion scores, chosen k, MMR λ, and final selections for eval reproducibility.

