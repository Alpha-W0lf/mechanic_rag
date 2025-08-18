-- Mechanic RAG (S2000) — Supabase schema (pgvector)

-- Enable pgvector extension (Supabase usually has this available)
create extension if not exists vector;

-- Documents table: one row per source document (e.g., Owner's Manual, Service Manual)
create table if not exists public.documents (
  id uuid primary key default gen_random_uuid(),
  vehicle text not null,
  source_name text not null unique,
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
  image_path text, -- path to the source page image for multimodal retrieval
  embedding vector,  -- leave dimension unspecified to avoid mismatch during early exploration
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


