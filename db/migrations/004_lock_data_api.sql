-- JH-52: lock existing public-schema tables away from Supabase Data API.
-- Idempotent. Apply to Production Supabase manually after review.
--
-- Pattern matches 003_ask_rate_limit.sql: ENABLE ROW LEVEL SECURITY with
-- no FORCE and no policies (PostgREST anon/authenticated → default deny).
-- The Next.js app and mecharag ingest connect as the table owner via
-- pg / psycopg + DATABASE_URL and bypass RLS. We do not FORCE ROW LEVEL
-- SECURITY, so that owner path is unchanged.
--
-- Compose has no anon/authenticated roles — REVOKE and default-privilege
-- changes are gated so this file still applies there.
--
-- Known app tables (001–003): vehicles, documents, chunks, index_state,
-- chunk_image_embeddings, ask_rate_buckets. This file also locks any
-- other public base table / sequence that exists at apply time.

DO $$
DECLARE
  r record;
BEGIN
  FOR r IN
    SELECT c.relname
    FROM pg_class c
    JOIN pg_namespace n ON n.oid = c.relnamespace
    WHERE n.nspname = 'public'
      AND c.relkind = 'r'
    ORDER BY c.relname
  LOOP
    EXECUTE format('ALTER TABLE public.%I ENABLE ROW LEVEL SECURITY', r.relname);
  END LOOP;
END
$$;

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'anon') THEN
    REVOKE ALL ON ALL TABLES IN SCHEMA public FROM anon;
    REVOKE ALL ON ALL SEQUENCES IN SCHEMA public FROM anon;
    -- Future public relations created by the applying role must not
    -- inherit Supabase's default GRANT to anon. Gated: Compose has
    -- no anon role. Applies only to objects created by current_user.
    ALTER DEFAULT PRIVILEGES IN SCHEMA public REVOKE ALL ON TABLES FROM anon;
    ALTER DEFAULT PRIVILEGES IN SCHEMA public REVOKE ALL ON SEQUENCES FROM anon;
  END IF;
  IF EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'authenticated') THEN
    REVOKE ALL ON ALL TABLES IN SCHEMA public FROM authenticated;
    REVOKE ALL ON ALL SEQUENCES IN SCHEMA public FROM authenticated;
    ALTER DEFAULT PRIVILEGES IN SCHEMA public REVOKE ALL ON TABLES FROM authenticated;
    ALTER DEFAULT PRIVILEGES IN SCHEMA public REVOKE ALL ON SEQUENCES FROM authenticated;
  END IF;
END
$$;
