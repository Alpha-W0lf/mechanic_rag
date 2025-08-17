## Phase 1 — Project Foundation & Scaffolding

Objective: Establish a clean, production-minded foundation (env, DB, app scaffold, CI) without building feature logic yet.

### Prerequisites
- Node.js LTS, pnpm or npm
- Supabase account (free tier)
- Google AI Studio API key (Gemini)
- Vercel account (free tier)

### Steps
- [x] **Repository hygiene**
  - [x] Copy `env.example` to `.env.local` and fill values for local dev.
  - [x] In Vercel, add project environment variables (server-side only).
  - [x] Ensure `.gitignore` excludes local env/secrets and build artifacts.
- [x] **Database (Supabase)**
  - [x] Create a new Supabase project (free tier).
  - [x] In the SQL editor, run `db/schema.sql` to create tables, indexes, and view.
  - [x] Note the `SUPABASE_URL` and keys; populate `.env.local` and Vercel env vars.
- [x] **App scaffold (Next.js + TypeScript)**
  - [x] Initialize a Next.js app (TypeScript). Include ESLint and Prettier.
  - [x] Add basic directory structure for `app/` or `pages/`, `lib/`, `scripts/`.
  - [x] Create placeholder serverless API routes for `/api/ask` and `/api/health`.
- [x] **Tooling & CI**
  - [x] Configure linting/formatting (ESLint, Prettier). Add scripts to `package.json`.
  - [x] Set up a minimal GitHub Actions workflow: install, lint, build.
- [x] **Documentation polish**
  - [x] Keep `README.md` user-facing (setup, usage, architecture). No roadmaps here.
  - [x] Use `docs/` for plans, research, and build guides.

Exit criteria
- Local dev runs with a Hello World UI and working `/api/health` route.
- Supabase schema deployed.
- CI passes lint and build on PRs.

