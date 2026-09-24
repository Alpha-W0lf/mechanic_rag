-- Planning draft only — do not apply until Build MR-2.
-- Freeze: openai/clip-vit-base-patch32 → vector(512)
-- Evidence: docs/2026-07-26_spike_evidence_m2_fixture_embed.json

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

-- Apply after dim freeze confirmed in Build:
-- CREATE INDEX IF NOT EXISTS idx_cie_embedding_hnsw
--   ON chunk_image_embeddings USING hnsw (embedding vector_cosine_ops);
