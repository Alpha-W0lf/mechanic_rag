#!/usr/bin/env bash
# Thin stranger path: preflight → Compose → env → fixture ingest → fail-closed.
# Does NOT start Next or twin-process CE ablation — prints next steps.
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT"

die() {
  echo "ERROR: $*" >&2
  exit 1
}

echo "== Mechanic RAG stranger smoke =="
echo "Repo: $ROOT"
echo

# --- Preflight ---
if ! command -v docker >/dev/null 2>&1; then
  die "docker not found. Install Docker Desktop / Engine, then retry."
fi
if ! docker info >/dev/null 2>&1; then
  die "docker daemon not reachable. Start Docker, then retry."
fi
if ! command -v ollama >/dev/null 2>&1; then
  die "ollama not found on PATH. Install Ollama (https://ollama.com), then retry."
fi
if ! curl -fsS --max-time 3 http://127.0.0.1:11434/api/tags >/dev/null 2>&1; then
  die "Ollama API not reachable at http://127.0.0.1:11434. Run: ollama serve"
fi

echo "[ok] docker + ollama preflight"

# --- Compose Postgres ---
echo "[..] docker compose up -d"
docker compose up -d

# --- Env (single copy target for Next + CLI) ---
if [[ ! -f web/.env.local ]]; then
  if [[ ! -f .env.example ]]; then
    die "missing .env.example — cannot create web/.env.local"
  fi
  cp .env.example web/.env.local
  echo "[ok] created web/.env.local from .env.example"
else
  echo "[ok] web/.env.local already present"
fi

# --- Python venv + ingest ---
if [[ ! -d .venv ]]; then
  echo "[..] python3 -m venv .venv"
  python3 -m venv .venv
fi
PY="${ROOT}/.venv/bin/python"
[[ -x "$PY" ]] || die "missing $PY after venv create"
if ! "$PY" -m pip --version >/dev/null 2>&1; then
  echo "[..] bootstrapping pip (ensurepip)"
  "$PY" -m ensurepip --upgrade >/dev/null 2>&1 \
    || die "pip missing in .venv and ensurepip failed — recreate: rm -rf .venv && python3 -m venv .venv"
fi
echo "[..] python -m pip install -e ."
"$PY" -m pip install -q -e .
MECHARAG="${ROOT}/.venv/bin/mecharag"
[[ -x "$MECHARAG" ]] || die "mecharag missing after pip install -e . — check pyproject console scripts"
echo "[..] mecharag ingest --source fixtures"
"$MECHARAG" ingest --source fixtures

# --- Fail-closed ---
echo "[..] public fail-closed (fixtures)"
"$PY" scripts/checks/public_fail_closed.py fixtures

echo
echo "== Stranger smoke base path OK =="
echo
echo "Next steps (ask path — not run by this script):"
echo "  1) ollama pull nomic-embed-text"
echo "  2) ollama pull gemma4:e2b   # or OLLAMA_MODEL=qwen3.5:4b"
echo "  3) cd web && pnpm install && pnpm dev"
echo "  4) curl -s localhost:3000/api/health"
echo "  5) curl -s -X POST localhost:3000/api/ask \\"
echo "       -H 'content-type: application/json' \\"
echo "       -d '{\"vehicle_id\":\"fixture:honda-s2000-demo\",\"question\":\"What is the oil drain plug torque?\"}'"
echo
echo "Full footguns / ablation: GETTING_STARTED.md"
echo "Advisory only — verify against official manuals. No OEM redistribution."
