#!/usr/bin/env bash
# Dev Container initialization script
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT"

echo "== Initializing Mechanic RAG Dev Container =="

# 1. Environment configuration: default to container Postgres
if [ ! -f web/.env.local ]; then
  cp .env.example web/.env.local
  # In the dev container with network_mode: service:postgres, Postgres is on localhost:5432
  sed -i 's|localhost:5433|localhost:5432|g' web/.env.local
  echo "[ok] created web/.env.local (mapped to localhost:5432)"
fi

# 2. Install Python package in editable mode
python3 -m pip install --upgrade pip
python3 -m pip install -e ".[dev]"

# 3. Install web dependencies
cd web
pnpm install

echo "== Dev Container ready =="
echo "Note: Multi-GB Ollama models are optional."
echo "- For hosted Gemini generation: add GEMINI_API_KEY to web/.env.local"
echo "- For local Ollama: connect to host or pull nomic-embed-text / gemma4:e2b"
echo "- For smoke tests / extractive degrade: run pnpm test or python scripts/checks/public_fail_closed.py fixtures"
