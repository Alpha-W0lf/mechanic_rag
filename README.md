## Mechanic RAG — hybrid → RRF → CE vertical slice

Personal, non-commercial **portfolio** project. Text-only RAG over automotive service documentation.

**Status:** Guide 01 vertical slice implemented for local Compose + fixtures (pass 8c/9). **Not** portfolio-complete. **Not** public-flip ready. **Not** “v1 done.”

**SSOT:** [`docs/VISION.md`](docs/VISION.md) · [`docs/ARCHITECTURE.md`](docs/ARCHITECTURE.md) · [`docs/dev_guides/2026-07-12_dev_guide_01_hybrid_rrf_ce_ask_path.md`](docs/dev_guides/2026-07-12_dev_guide_01_hybrid_rrf_ce_ask_path.md) · [`evals/MODEL_FREEZE_STATUS.md`](evals/MODEL_FREEZE_STATUS.md)

### Stack (Guide 01)

- Next.js App Router under **`web/src/app` only** (root `web/app` removed — no dual tree)
- Compose **Postgres + pgvector** (no Supabase product path)
- Offline Python CLI: **`mecharag ingest`** / **`mecharag eval`**
- Host **Ollama** generator default **`gemma4:e2b`** (fallback `qwen3.5:4b`); embedding candidate `nomic-embed-text` @ 768
- Ranking: vehicle-filtered vector + lexical → **RRF** → **section dedup (default on)** → local **CE** (degrade to RRF on failure)

### Quick Start

```bash
# 1. Postgres
docker compose up -d

# 2. Env
cp .env.example web/.env.local
# ensure Ollama is running; pull candidates:
#   ollama pull nomic-embed-text
#   ollama pull gemma4:e2b   # operator default; or OLLAMA_MODEL=qwen3.5:4b

# 3. Python CLI
python -m venv .venv && source .venv/bin/activate
pip install -e .
mecharag ingest --source fixtures

# 4. Public fail-closed check
python scripts/checks/public_fail_closed.py fixtures

# 5. Web
cd web && pnpm install && pnpm test && pnpm dev
# health + ask
curl -s localhost:3000/api/health
curl -s -X POST localhost:3000/api/ask \
  -H 'content-type: application/json' \
  -d '{"vehicle_id":"fixture:honda-s2000-demo","question":"What is the oil drain plug torque?"}'

# 6. Golden eval (start Next first for full ask path; or --retrieval-only)
mecharag eval --golden evals/
```

### Honest limits

- Public corpus = **`fixtures/` only** (synthetic). No OEM PDFs, Drive, or Ford.
- Embedding + CE IDs are **candidates** (smoke-verified / provisional CE keep) — **not frozen** until human freeze for portfolio ranking claims (`evals/MODEL_FREEZE_STATUS.md`).
- Generator default is **gemma4:e2b** (pass 9 smoke OK). Pass 8c eval baseline historically used **qwen3.5:4b**.
- Eval set starts at **5** cases; grow to ≥30 before “complete” claims.
- Stale paths (`db/schema.sql`, `supabase/**`, deleted stub `web/app`) are non-authoritative.
- Missing packaging: GETTING_STARTED, INTERVIEW.

### Disclaimers

- Advisory only. Verify against your official service manual. Use at your own risk.
- No redistribution of OEM PDFs.
