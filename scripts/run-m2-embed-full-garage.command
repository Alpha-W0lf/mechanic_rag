#!/usr/bin/env bash
# Full personal garage CLIP page embeds (cat:*). Idempotent. Requires [m2] extra.
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"
LOG_DIR="${HOME}/var/mechanic_scratch/m2_embed"
mkdir -p "$LOG_DIR"
LOG="$LOG_DIR/run.stdout.log"
export DATABASE_URL="${DATABASE_URL:-postgres://mechanic:mechanic@localhost:5433/mechanic_rag}"
export MECHANIC_GARAGE_ROOT="${MECHANIC_GARAGE_ROOT:-$HOME/var/mechanic_garage}"
{
  echo "=== m2 embed start $(date -u +%Y-%m-%dT%H:%M:%SZ) ==="
  echo "DATABASE_URL=$DATABASE_URL"
  echo "MECHANIC_GARAGE_ROOT=$MECHANIC_GARAGE_ROOT"
  caffeinate -i "$ROOT/.venv/bin/python" -u -m mecharag embed-images \
    --vehicle-prefix 'cat:%' \
    --batch-size 4 \
    2>&1 | tee -a "$LOG"
  echo "=== m2 embed end $(date -u +%Y-%m-%dT%H:%M:%SZ) exit=$? ==="
} | tee -a "$LOG"
