# Development Setup

Quick setup guide for working on this project from a new machine. Check off items as you complete them.

> ✅ **SETUP COMPLETE** - All development environment tasks have been completed successfully on this MacBook. You're ready to start development!

## Prerequisites

- [x] Node.js LTS (22+) - verified v22.17.0
- [x] Python 3.12+ - verified v3.12.8
- [x] Git

## Setup Steps

### 1. Clone and Navigate
- [x] Clone repository and navigate to project directory
```bash
git clone <your-repo-url>
cd mechainic_rag
```

### 2. Install uv (Python package manager) - REQUIRED
- [x] Install uv package manager using Homebrew:
```bash
brew install uv
```
- [x] uv added to PATH automatically with Homebrew

### 3. Python Environment - REQUIRED
- [x] Create virtual environment from repo root:
```bash
uv venv .venv
```
- [x] Activate virtual environment:
```bash
source .venv/bin/activate
```
- [x] Install Python dependencies:
```bash
uv pip install -r requirements.txt
```

### 4. Node Environment
- [x] Ensure pnpm is installed globally
- [x] Install Node.js dependencies:
```bash
cd web
pnpm install
```

### 5. Environment Variables
- [x] Create `web/.env.local` (note: in the `web/` folder, not root)
- [x] Copy from example and fill in actual values:
```bash
# Copy from example
cp ../env.example .env.local
```
- [x] Fill in all required environment variables:
  - [x] `GEMINI_API_KEY=...`
  - [x] `SUPABASE_URL=...`
  - [x] `SUPABASE_SERVICE_ROLE_KEY=...`
  - [x] `SUPABASE_ANON_KEY=...`
  - [x] App configuration variables
  - [x] Retrieval configuration variables

### 6. Place Input Documents
- [x] Put PDFs into `rag_input/` at repo root:
  - [x] Owner's Manual
  - [x] Service Manual  
  - [x] Wiring Diagram

### 7. Verify Setup
- [x] Test Python ingestion (from repo root):
```bash
source .venv/bin/activate
python scripts/ingest/ingest.py --dry-run
```
- [x] Test Next.js app (from web/):
```bash
cd web
pnpm run dev
# Visit http://localhost:3000/api/health → should return {"status":"ok"}
```
- [x] Test database connection and verify full pipeline works
  - [x] Confirmed Supabase connection active
  - [x] Verified data is already indexed and retrieval working
- [x] Test ingestion skeleton:
  - [x] `python scripts/ingest/ingest.py --dry-run`
  - [x] Confirmed discovery of all 3 PDFs and shows planned steps

### 6) Verify database connection
 - [x] Test Supabase connection from local environment
 - [x] Verify vector extension is working

## Notes

- **Environment files**: `.env.local` goes in `web/` folder (where `package.json` is)
- **Python venv**: Activate with `source .venv/bin/activate` from repo root
- **PDFs**: Place in `rag_input/` at repo root (Owner's Manual, Service Manual, Wiring Diagram)
- **Secrets**: Never commit `.env.local` - it's gitignored

## Troubleshooting

- If uv not found: restart shell or run `source $HOME/.local/bin/env`
- If Next.js can't find env vars: ensure `.env.local` is in `web/` folder
- If Python deps fail: ensure you're in the activated venv (`source .venv/bin/activate`)
