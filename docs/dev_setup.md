# Development Setup

Quick setup guide for working on this project from a new machine. Check off items as you complete them.

> ✅ **SETUP COMPLETE** - All development environment tasks have been completed successfully on this MacBook. You're ready to start development!

## Prerequisites

- [x] Node.js LTS (22+) - verified v22.17.0
- [x] Python 3.13+ - verified v3.13.7
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

### 3. System-Level Dependencies - REQUIRED
- [x] Install Python 3.13 (if not available):
```bash
brew install python@3.13
```
- [x] Install `poppler` for PDF manipulation:
```bash
brew install poppler
```

### 4. Python Environment - REQUIRED
- [x] Create virtual environment using Python 3.13:
```bash
uv venv -p python3.13 .venv
```
- [x] Activate virtual environment:
```bash
source .venv/bin/activate
```
- [x] Install Python dependencies from `pyproject.toml`:
```bash
uv pip install -e .
```

### 5. Node Environment
- [x] Ensure pnpm is installed globally
- [x] Install Node.js dependencies:
```bash
cd web
pnpm install
```

### 6. Environment Variables
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

### 7. Place Input Documents
- [x] Put PDFs into `rag_input/` at repo root:
  - [x] Owner's Manual
  - [x] Service Manual  
  - [x] Wiring Diagram

### 8. Verify Setup
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
- **Python venv**: Activate with `source .venv/bin/activate` from repo root. Use `uv venv -p python3.13 .venv` to create it.
- **Python Dependencies**: Install with `uv pip install -e .` which reads from `pyproject.toml`.
- **PDFs**: Place in `rag_input/` at repo root (Owner's Manual, Service Manual, Wiring Diagram)
- **Secrets**: Never commit `.env.local` - it's gitignored

## Troubleshooting

- If uv not found: restart shell or run `source $HOME/.local/bin/env`
- If Next.js can't find env vars: ensure `.env.local` is in `web/` folder
- If Python deps fail: ensure you're in the activated venv and have run `uv pip install -e .`.
