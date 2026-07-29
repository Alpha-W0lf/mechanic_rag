-- M2 image embedding side table (Build Go 2026-07-26)
-- Model freeze: openai/clip-vit-base-patch32 → vector(512)

CREATE TABLE IF NOT EXISTS chunk_image_embeddings (
  chunk_id TEXT PRIMARY KEY REFERENCES chunks(chunk_id) ON DELETE CASCADE,
  vehicle_id TEXT NOT NULL REFERENCES vehicles(vehicle_id),
  document_id TEXT NOT NULL,
  page_start INTEGER NOT NULL,
  page_end INTEGER,
  embedding vector(512) NOT NULL,
  embedding_model TEXT NOT NULL,
  embedding_dim INTEGER NOT NULL CHECK (embedding_dim = 512),
  asset_locator TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_cie_vehicle ON chunk_image_embeddings (vehicle_id);

CREATE INDEX IF NOT EXISTS idx_cie_embedding_hnsw
  ON chunk_image_embeddings USING hnsw (embedding vector_cosine_ops);
