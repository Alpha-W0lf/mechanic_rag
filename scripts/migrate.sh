#!/usr/bin/env bash
# Apply db/migrations to Compose Postgres (idempotent enough for 001_init on empty DB).
# Prefer docker compose init on first boot; use this when the volume already exists.
# Files whose names contain DRAFT are never applied (planning drafts only).
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
DATABASE_URL="${DATABASE_URL:-postgres://mechanic:mechanic@localhost:5433/mechanic_rag}"
LIST_ONLY=0
if [[ "${1:-}" == "--list" ]]; then
  LIST_ONLY=1
fi
if [[ "${LIST_ONLY}" -eq 0 ]]; then
  echo "Applying migrations to ${DATABASE_URL}"
fi
for f in "${ROOT}"/db/migrations/*.sql; do
  base="$(basename "$f")"
  if [[ "${base}" == *DRAFT* ]]; then
    echo "skip ${base} (DRAFT)"
    continue
  fi
  echo "→ ${base}"
  if [[ "${LIST_ONLY}" -eq 0 ]]; then
    psql "$DATABASE_URL" -v ON_ERROR_STOP=1 -f "$f"
  fi
done
if [[ "${LIST_ONLY}" -eq 0 ]]; then
  echo "Done."
fi
