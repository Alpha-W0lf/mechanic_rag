## Manual Build Steps (Accounts, Env, One-time Setup)

> ✅ **ALL SETUP COMPLETE** - All manual build steps have been completed successfully on both MacBooks. Development environment is fully configured and ready for Phase 2 implementation!

Follow these steps to provision external services and wire up local/prod envs. Keep this open while you work and check off completed items.

### 1) Supabase (free tier)
- [x] Create a new Supabase project (free tier) in the dashboard
- [x] Go to SQL Editor and run our schema:
  - [x] Open `db/schema.sql` from this repo and paste into Supabase SQL editor; run it
  - [x] Verify it adds tables, vector/FTS indexes, optional HNSW, and an `embedding_runs` log table
- [x] Verify pgvector extension and (optionally) HNSW index:
  - [x] In SQL editor: `select extversion from pg_extension where extname='vector';`
  - [x] Confirm HNSW or IVFFlat index creation succeeded
- [x] Copy credentials for local and Vercel envs:
  - [x] `SUPABASE_URL`
  - [x] `SUPABASE_SERVICE_ROLE_KEY` (server-side only)
  - [x] `SUPABASE_ANON_KEY` (only needed server-side in rare cases; never expose to client code)

### 2) Vercel (free tier)
- [x] Create a Vercel project and link it to this repository. Root directory: `/web`
- [x] Add Project Environment Variables (Production + Preview):
  - [x] `GEMINI_API_KEY`: from Google AI Studio
  - [x] `SUPABASE_URL`: from Supabase settings
  - [x] `SUPABASE_SERVICE_ROLE_KEY`: server-side only
  - [x] `SUPABASE_ANON_KEY`: add only if needed (server-side only)
  - [x] Retrieval knobs (optional, default is fine):
    - [x] `RETRIEVAL_FUSION_MODE=always` (or `conditional`)
    - [x] `FUSION_LINEAR_ALPHA=0.7`
    - [x] `MMR_LAMBDA=0.4`
    - [x] `RETRIEVAL_K_DEFAULT=8`
- [x] Trigger the first deploy to verify the CI/build pipeline

### 3) Local environment
- [x] Fill local env file `web/.env.local` (copied from `env.example`):
  - [x] `GEMINI_API_KEY=...`
  - [x] `SUPABASE_URL=...`
  - [x] `SUPABASE_SERVICE_ROLE_KEY=...`
  - [x] `SUPABASE_ANON_KEY=...`
  - [x] Retrieval knobs configured with defaults
- [x] Install Node.js dependencies and run the app locally:
  - [x] `cd web`
  - [x] `pnpm install`
  - [x] `pnpm run dev`
  - [x] Open `http://localhost:3000/api/health` → verified `{ "status": "ok" }`

### 4) Place input documents
- [x] Put your PDFs into `rag_input/` at repo root:
  - [x] Owner's Manual, Service Manual, Wiring Diagram
- [x] Confirmed PDFs are not committed (rag_input/ is ignored; .gitkeep exists)

### 5) Python ingestion environment (REQUIRED)
- [x] Install `uv` package manager: `brew install uv`
- [x] Add uv to PATH (automatic with Homebrew)
- [x] From repo root:
  - [x] `uv venv .venv`
  - [x] `source .venv/bin/activate`
  - [x] `uv pip install -r requirements.txt`
- [x] Test ingestion skeleton:
  - [x] `python scripts/ingest/ingest.py --dry-run`
  - [x] Confirmed discovery of all 3 PDFs and shows planned steps

### 6) Verify database connection
- [x] Test Supabase connection from local environment
- [x] Verify vector extension is working
- [x] Test a sample query to ensure full pipeline works
- [x] Confirmed data is already indexed and retrieval is working perfectly

### 7) Supabase CLI (optional local admin)
- [x] Install Supabase CLI: `brew install supabase/tap/supabase` (completed on M2 Max MacBook)
- [x] Install Supabase CLI on M2 Pro MacBook: `brew install supabase/tap/supabase` (completed)
- [x] Note: You can manage everything from the dashboard; CLI is not required for this project

Notes
- Keep secrets out of client code. Only serverless API routes should access Supabase service role and Gemini keys.
- HNSW index is attempted automatically in `db/schema.sql`; it will silently fall back if unsupported.


