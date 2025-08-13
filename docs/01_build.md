## Phase 1 — Project Foundation & Scaffolding

Objective: Establish a clean, production-minded foundation (env, DB, app scaffold, CI) without building feature logic yet.

### Prerequisites
- Node.js LTS, pnpm or npm
- Supabase account (free tier)
- Google AI Studio API key (Gemini)
- Vercel account (free tier)

### Steps
1) Repository hygiene
   - Copy `env.example` to `.env.local` and fill values for local dev.
   - In Vercel, add project environment variables (server-side only).
   - Ensure `.gitignore` excludes local env/secrets and build artifacts.

2) Database (Supabase)
   - Create a new Supabase project (free tier).
   - In the SQL editor, run `db/schema.sql` to create tables, indexes, and view.
   - Note the `SUPABASE_URL` and keys; populate `.env.local` and Vercel env vars.

3) App scaffold (Next.js + TypeScript)
   - Initialize a Next.js app (TypeScript). Include ESLint and Prettier.
   - Add basic directory structure for `app/` or `pages/`, `lib/`, `scripts/`.
   - Create placeholder serverless API routes for `/api/ask` and `/api/health`.

4) Tooling & CI
   - Configure linting/formatting (ESLint, Prettier). Add scripts to `package.json`.
   - Set up a minimal GitHub Actions workflow: install, lint, build.

5) Documentation polish
   - Keep `README.md` user-facing (setup, usage, architecture). No roadmaps here.
   - Use `docs/` for plans, research, and build guides.

Exit criteria
- Local dev runs with a Hello World UI and working `/api/health` route.
- Supabase schema deployed.
- CI passes lint and build on PRs.

