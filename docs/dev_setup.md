# Development Setup

Quick setup guide for working on this project from a new machine.

## Prerequisites

- Node.js LTS (22+)
- Python 3.12+
- Git

## Setup Steps

### 1. Clone and Navigate
```bash
git clone <your-repo-url>
cd mechainic_rag
```

### 2. Install uv (Python package manager)
```bash
curl -LsSf https://astral.sh/uv/install.sh | sh
source $HOME/.local/bin/env  # Add to PATH
```

### 3. Python Environment
```bash
# From repo root
uv venv .venv
source .venv/bin/activate
uv pip install -r requirements.txt
```

### 4. Node Environment
```bash
cd web
npm install -g pnpm  # if not already installed
pnpm install
```

### 5. Environment Variables
Create `web/.env.local` (note: in the `web/` folder, not root):

```bash
# Copy from example
cp ../env.example .env.local
```

Then fill in your actual values:
```bash
# Google Gemini API
GEMINI_API_KEY=your_gemini_api_key

# Supabase
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
SUPABASE_ANON_KEY=your_anon_key

# App configuration
NEXT_PUBLIC_APP_NAME=Mechanic RAG (S2000)
NODE_ENV=development

# Retrieval configuration
RETRIEVAL_FUSION_MODE=always
FUSION_LINEAR_ALPHA=0.7
MMR_LAMBDA=0.4
RETRIEVAL_K_DEFAULT=8
```

### 6. Verify Setup
```bash
# Test Python ingestion (from repo root)
source .venv/bin/activate
python scripts/ingest/ingest.py --dry-run

# Test Next.js app (from web/)
cd web
pnpm run dev
# Visit http://localhost:3000/api/health → should return {"status":"ok"}
```

## Notes

- **Environment files**: `.env.local` goes in `web/` folder (where `package.json` is)
- **Python venv**: Activate with `source .venv/bin/activate` from repo root
- **PDFs**: Place in `rag_input/` at repo root (Owner's Manual, Service Manual, Wiring Diagram)
- **Secrets**: Never commit `.env.local` - it's gitignored

## Troubleshooting

- If uv not found: restart shell or run `source $HOME/.local/bin/env`
- If Next.js can't find env vars: ensure `.env.local` is in `web/` folder
- If Python deps fail: ensure you're in the activated venv (`source .venv/bin/activate`)
