#!/usr/bin/env bash
# Apply db/migrations to Compose Postgres (idempotent enough for 001_init on empty DB).
# Prefer docker compose init on first boot; use this when the volume already exists.
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
DATABASE_URL="${DATABASE_URL:-postgres://mechanic:mechanic@localhost:5433/mechanic_rag}"
echo "Applying migrations to ${DATABASE_URL}"
for f in "${ROOT}"/db/migrations/*.sql; do
  echo "→ $(basename "$f")"
  psql "$DATABASE_URL" -v ON_ERROR_STOP=1 -f "$f"
done
echo "Done."
