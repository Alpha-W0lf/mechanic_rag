-- Mechanic RAG (S2000) — Supabase schema (pgvector)

-- Enable pgvector extension (Supabase usually has this available)
create extension if not exists vector;

-- Documents table: one row per source document (e.g., Owner's Manual, Service Manual)
create table if not exists public.documents (
  id uuid primary key default gen_random_uuid(),
  vehicle text not null,
  source_name text not null,
  source_type text not null, -- e.g., 'pdf'
  path text,                 -- relative path or identifier
  ingested_at timestamptz not null default now()
);

-- Chunks table: semantically searchable units
create table if not exists public.chunks (
  id uuid primary key default gen_random_uuid(),
  document_id uuid not null references public.documents(id) on delete cascade,
  chunk_index integer not null,
  content text not null,
  page_start integer,
  page_end integer,
  section_heading text,
  section_path text, -- e.g., "13 Clutch > 13-3 Service"
  embedding vector(768),  -- Google text-embedding-004 uses 768 dimensions
  created_at timestamptz not null default now()
);

-- Helpful composite index for metadata filters
create index if not exists idx_chunks_doc_idx on public.chunks(document_id, chunk_index);

-- Vector index (choose one; IVFFlat is widely available)
-- Adjust lists based on dataset size (rule of thumb: sqrt(num_vectors))
create index if not exists idx_chunks_embedding_ivfflat on public.chunks using ivfflat (embedding vector_cosine_ops) with (lists = 100);

-- Alternative (if HNSW is supported and desired)
-- create index if not exists idx_chunks_embedding_hnsw on public.chunks using hnsw (embedding vector_cosine_ops);

-- View for convenient retrieval with document metadata
create or replace view public.chunk_views as
select c.*, d.vehicle, d.source_name, d.source_type, d.path
from public.chunks c
join public.documents d on d.id = c.document_id;


-- Additive portfolio-grade DDL (idempotent) — indexing & metadata
-- Reference: docs/sop.md and docs/indexing_research.md

-- Embedding provenance metadata (optional but recommended)
alter table if exists public.chunks
  add column if not exists embedding_model text,
  add column if not exists embedding_dim integer,
  add column if not exists embedding_version text,
  add column if not exists embedded_at timestamptz;

-- Lexical search support (generated tsvector + GIN index)
alter table if exists public.chunks
  add column if not exists content_tsv tsvector
  generated always as (to_tsvector('english', coalesce(content,''))) stored;

create index if not exists idx_chunks_content_tsv on public.chunks using gin (content_tsv);

-- Prefer HNSW where supported; keep IVFFlat as baseline (already created above)
-- If HNSW creation fails on your Supabase project, keep IVFFlat index only.
do $$ begin
  begin
    execute 'create index if not exists idx_chunks_embedding_hnsw on public.chunks using hnsw (embedding vector_cosine_ops)';
  exception when others then
    -- Swallow errors if hnsw unsupported; IVFFlat remains in place
    null;
  end;
end $$;

-- Log table for embedding runs (provenance & rollback)
create table if not exists public.embedding_runs (
  id uuid primary key default gen_random_uuid(),
  model text not null,
  model_version text,
  embedding_dim integer not null,
  code_version text,
  started_at timestamptz not null default now(),
  finished_at timestamptz,
  notes text
);

