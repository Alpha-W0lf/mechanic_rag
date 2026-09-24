-- JH-42: public Ask abuse-shield buckets (hashed client + global fixed windows).
-- Idempotent. Apply to Production Supabase manually after review.
-- Rows expire via expires_at; the app DELETEs expired rows on each Ask.
-- Never stores a raw IP — bucket_id is an opaque HMAC key.

CREATE TABLE IF NOT EXISTS ask_rate_buckets (
  bucket_id TEXT PRIMARY KEY,
  hit_count INTEGER NOT NULL DEFAULT 1 CHECK (hit_count >= 0),
  expires_at TIMESTAMPTZ NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_ask_rate_buckets_expires_at
  ON ask_rate_buckets (expires_at);

-- Cleanup for environments that already had the table (idempotent no-op on empty).
DELETE FROM ask_rate_buckets WHERE expires_at < now();
