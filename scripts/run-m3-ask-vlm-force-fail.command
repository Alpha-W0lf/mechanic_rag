#!/bin/bash
# M3 B1 Arm C — VLM on but forced fail (degrade)
cd "$(dirname "$0")/../web" || exit 1
export DATABASE_URL="${DATABASE_URL:-postgres://mechanic:mechanic@localhost:5433/mechanic_rag}"
export MECHANIC_GARAGE_ROOT="${MECHANIC_GARAGE_ROOT:-$HOME/var/mechanic_garage}"
export MECHANIC_PYTHON="${MECHANIC_PYTHON:-$(cd .. && pwd)/.venv/bin/python}"
export MECHANIC_DIAGNOSTICS=1
export MECHANIC_VLM=1
export MECHANIC_VLM_FORCE_FAIL=1
exec pnpm exec next dev -p 3003 -H 127.0.0.1
