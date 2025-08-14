## Manual Build Steps (Accounts, Env, One-time Setup)

Follow these steps to provision external services and wire up local/prod envs. Keep this open while you work.

### 1) Supabase (free tier)
1. Create a new Supabase project (free tier) in the dashboard.
2. Go to SQL Editor and run our schema:
   - Open `db/schema.sql` from this repo and paste into Supabase SQL editor; run it.
   - It adds tables, vector/FTS indexes, optional HNSW, and an `embedding_runs` log table.
3. Verify pgvector extension and (optionally) HNSW index:
   - In SQL editor: `select extversion from pg_extension where extname='vector';`
   - If HNSW is supported, the index creation should have succeeded. If not, IVFFlat exists already.
4. Copy credentials for local and Vercel envs:
   - `SUPABASE_URL`
   - `SUPABASE_SERVICE_ROLE_KEY` (server-side only)
   - `SUPABASE_ANON_KEY` (only needed server-side in rare cases; never expose to client code)

### 2) Vercel (free tier)
1. Create a Vercel project and link it to this repository. Root directory: `/web`.
2. Add Project Environment Variables (Production + Preview):
   - `GEMINI_API_KEY`: from Google AI Studio
   - `SUPABASE_URL`: from Supabase settings
   - `SUPABASE_SERVICE_ROLE_KEY`: server-side only
   - `SUPABASE_ANON_KEY`: add only if needed (server-side only)
   - Retrieval knobs (optional, default is fine):
     - `RETRIEVAL_FUSION_MODE=always` (or `conditional`)
     - `FUSION_LINEAR_ALPHA=0.7`
     - `MMR_LAMBDA=0.4`
     - `RETRIEVAL_K_DEFAULT=8`
3. Trigger the first deploy to verify the CI/build pipeline.

### 3) Local environment
1. Fill local env file `web/.env.local` (copied from `env.example` already):
   - `GEMINI_API_KEY=...`
   - `SUPABASE_URL=...`
   - `SUPABASE_SERVICE_ROLE_KEY=...`
   - (optional) `SUPABASE_ANON_KEY=...`
   - Retrieval knobs if you want to override defaults.
2. Install dependencies and run the app locally:
   - `cd web`
   - `pnpm install`
   - `pnpm run dev`
   - Open `http://localhost:3000/api/health` → expect `{ "status": "ok" }`.

### 4) Place input documents
1. Put your PDFs into `rag_input/` at repo root:
   - Owner’s Manual, Service Manual, Wiring Diagram
2. We do not commit PDFs. `rag_input/` is ignored; a `.gitkeep` exists to keep the folder.

### 5) Optional: Supabase CLI (local admin)
1. Install Supabase CLI if you prefer local commands (optional).
2. You can still manage everything from the dashboard; CLI is not required for this project.

### 6) Optional: Python ingestion environment (uv)
1. Install `uv` (if not installed): see `https://docs.astral.sh/uv/`.
2. From repo root:
   - `uv venv .venv`
   - `source .venv/bin/activate`
   - `uv pip install -r requirements.txt`
3. Dry-run the ingestion skeleton:
   - `python scripts/ingest/ingest.py --dry-run`
   - Confirms discovery of PDFs and shows planned steps.

Notes
- Keep secrets out of client code. Only serverless API routes should access Supabase service role and Gemini keys.
- HNSW index is attempted automatically in `db/schema.sql`; it will silently fall back if unsupported.


