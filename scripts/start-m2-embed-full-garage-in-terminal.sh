#!/usr/bin/env bash
# Start full-garage M2 page embed in Terminal.app (long-running; not Cursor process group).
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
LOG_DIR="${HOME}/var/mechanic_scratch/m2_embed"
mkdir -p "$LOG_DIR"
CMD="$ROOT/scripts/run-m2-embed-full-garage.command"
chmod +x "$CMD" 2>/dev/null || true
open "$CMD"
echo "Started M2 full-garage embed via Terminal (see $LOG_DIR)"
