-- Mechanic RAG v1 schema (Compose Postgres + pgvector)
-- Sole schema authority. Embedding dim locked to candidate nomic-embed-text @ 768
-- until freeze gate; change requires migration + reindex_needed.

CREATE EXTENSION IF NOT EXISTS vector;

CREATE TABLE IF NOT EXISTS vehicles (
  vehicle_id TEXT PRIMARY KEY,
  year INTEGER NOT NULL,
  make TEXT NOT NULL,
  model TEXT NOT NULL,
  engine TEXT NOT NULL,
  trim TEXT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS documents (
  id BIGSERIAL PRIMARY KEY,
  document_id TEXT NOT NULL,
  artifact_version TEXT NOT NULL,
  vehicle_id TEXT NOT NULL REFERENCES vehicles(vehicle_id),
  doc_family TEXT NOT NULL,
  document_name TEXT,
  content_hash TEXT NOT NULL,
  corpus_version TEXT NOT NULL,
  manifest_id TEXT NOT NULL,
  provenance JSONB NOT NULL DEFAULT '{}'::jsonb,
  page_start INTEGER,
  page_end INTEGER,
  section_path TEXT,
  rights_class TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (vehicle_id, doc_family, document_id, artifact_version)
);

CREATE INDEX IF NOT EXISTS idx_documents_vehicle_family
  ON documents (vehicle_id, doc_family);
CREATE INDEX IF NOT EXISTS idx_documents_content_hash
  ON documents (content_hash);

CREATE TABLE IF NOT EXISTS chunks (
  chunk_id TEXT PRIMARY KEY,
  document_pk BIGINT NOT NULL REFERENCES documents(id) ON DELETE CASCADE,
  document_id TEXT NOT NULL,
  artifact_version TEXT NOT NULL,
  vehicle_id TEXT NOT NULL REFERENCES vehicles(vehicle_id),
  doc_family TEXT NOT NULL,
  chunk_index INTEGER NOT NULL,
  content TEXT NOT NULL,
  content_checksum TEXT NOT NULL,
  page_start INTEGER,
  page_end INTEGER,
  section_path TEXT,
  heading TEXT,
  modality TEXT NOT NULL DEFAULT 'text',
  embedding vector(768) NOT NULL,
  embedding_model TEXT NOT NULL,
  embedding_dim INTEGER NOT NULL,
  content_tsv tsvector GENERATED ALWAYS AS (to_tsvector('simple', coalesce(content, ''))) STORED,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (document_pk, chunk_index)
);

CREATE INDEX IF NOT EXISTS idx_chunks_vehicle ON chunks (vehicle_id);
CREATE INDEX IF NOT EXISTS idx_chunks_vehicle_family ON chunks (vehicle_id, doc_family);
CREATE INDEX IF NOT EXISTS idx_chunks_content_tsv ON chunks USING GIN (content_tsv);
CREATE INDEX IF NOT EXISTS idx_chunks_embedding_hnsw
  ON chunks USING hnsw (embedding vector_cosine_ops);

CREATE TABLE IF NOT EXISTS index_state (
  vehicle_id TEXT NOT NULL REFERENCES vehicles(vehicle_id),
  doc_family TEXT NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('not_indexed', 'indexed', 'reindex_needed', 'blocked')),
  embedding_model TEXT,
  embedding_dim INTEGER,
  corpus_version TEXT,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (vehicle_id, doc_family)
);
