# AGENTS.md

Mechanic RAG: hybrid retrieval (pgvector + Postgres FTS → RRF → section dedup) with server-checked citations. Next.js app and Ask API in `web/`, Python ingest and eval CLI in `mecharag/`.

## Commands

```bash
# Web (from web/)
pnpm install --frozen-lockfile
pnpm lint && pnpm typecheck && pnpm test && pnpm build
pnpm vitest run src/server/__tests__/citations.test.ts   # one file

# Python (from repo root, venv active)
pip install -e ".[dev]"
python scripts/checks/public_fail_closed.py fixtures
python scripts/checks/public_fail_closed.py --tree .
pytest -m "not integration and not slow"
MECHANIC_EXTRA_FIXTURES_ROOT=/path/to/program pytest            # full suite, external fixtures

# Local stack (Docker + Ollama)
docker compose up -d                       # Postgres on localhost:5433
mecharag ingest --source fixtures
# paired eval: Next on :3000 (reranker on) and :3001 with MECHANIC_FORCE_RRF_ONLY=1, both MECHANIC_DIAGNOSTICS=1
mecharag eval --golden evals/golden_fixture_v1.json \
  --ask-url http://127.0.0.1:3000/api/ask --ask-url-rrf-only http://127.0.0.1:3001/api/ask
```

## Done means

- The web and Python commands above pass locally, and CI is green on the PR.
- A bug fix lands with a test that fails on the old code.
- A change to retrieval, ranking, prompts or models comes with a fresh eval run saved under `evals/evidence/` (date, git SHA, model IDs, n), and the README results table matches it.
- Claims in docs are labelled Verified, Unverified or Unknown in the PR description.

## Conventions

- Pipeline order is fixed: retrieve → RRF → section dedup → optional cross-encoder → context assembly. Change it only with eval evidence.
- Citation labels are assigned once in `web/src/server/citations.ts`; citation metadata comes from database rows.
- `web/src/lib/retrieval/` stays pure (no DB, Next.js or model imports).
- Keep each source file small enough to read whole (under 400 lines).
- `db/migrations/` is the only schema source; add a new numbered file for each change.
- One logical change per PR, in its own branch or worktree.

## Safety

- Secrets live in `web/.env.local` (copied from `.env.example`) and in Vercel settings.
- The public tree holds synthetic fixtures only; `public_fail_closed.py` enforces this in CI (fixtures, plus no PDFs anywhere and images only in `docs/assets/`). Private corpora load from `MECHANIC_PRIVATE_GOLD_ROOT` outside the repo.
- The maintainer applies production database migrations and private-corpus ingest.

## Map

- `docs/ARCHITECTURE.md`: read when changing retrieval, ranking, citations or the Ask contract (§7 for ranking).
- `docs/ops.md`: read when touching hosting, health checks, rate limits or CI.
- `evals/`: read when changing anything that can move answer quality.
- `docs/design/`: read before writing a spec for a new feature (example of the expected shape).
- `GETTING_STARTED.md`: read when the local stack will not start.
