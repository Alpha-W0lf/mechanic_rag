#!/bin/bash
# M2 C1 Arm B — ask with image channel OFF (:3002)
cd "$(dirname "$0")/../web" || exit 1
export DATABASE_URL="${DATABASE_URL:-postgres://mechanic:mechanic@localhost:5433/mechanic_rag}"
export MECHANIC_GARAGE_ROOT="${MECHANIC_GARAGE_ROOT:-$HOME/var/mechanic_garage}"
export MECHANIC_PYTHON="${MECHANIC_PYTHON:-$(cd .. && pwd)/.venv/bin/python}"
export MECHANIC_DIAGNOSTICS=1
export MECHANIC_IMAGE_CHANNEL=0
exec pnpm exec next dev -p 3002 -H 127.0.0.1
