# Getting started — Mechanic RAG (clean clone)

Clone-depth operator path for the **hybrid → RRF → section dedup → local CE** vertical slice. Contracts: [`docs/ARCHITECTURE.md`](docs/ARCHITECTURE.md). Interview gotchas: [`INTERVIEW.md`](INTERVIEW.md). Skim + Quick Start: [`README.md`](README.md). Product why: [`docs/VISION.md`](docs/VISION.md).

This is **not** portfolio v1 complete, **not** public-flip ready, **not** a model freeze. Public corpus = fixtures only.

---

## Prerequisites

- **Docker** (Compose Postgres + pgvector)
- **Node** + [`pnpm`](https://pnpm.io/) (Next app under `web/`)
- **Python 3.x** + venv (`mecharag` CLI)
- Host **Ollama** (embeddings + generator)

---

## Clean-clone path

From repo root, in order:

### 1. Thin Compose (Postgres on host port 5433)

```bash
docker compose up -d
```

Compose maps container `5432` → host **`5433`** (see `.env.example` / `docker-compose.yml`). `DATABASE_URL` must use `localhost:5433`. This is one Compose step — not an ops runbook.

### 2. Env — single copy target

```bash
cp .env.example web/.env.local
```

**Why this path:** Next.js reads `web/.env.local`. The CLI `load_dotenv()` then loads that same file. A root `.env` alone can satisfy CLI but **not** Next — teach one copy target, not “also try root.”

Do not commit `.env` / `.env.local`. Leave `MECHANIC_FORCE_RRF_ONLY` **unset** for normal CE-on asks (see Footguns).

### 3. Ollama pulls

```bash
ollama pull nomic-embed-text
ollama pull gemma4:e2b
# Fallback if primary missing: OLLAMA_MODEL=qwen3.5:4b && ollama pull qwen3.5:4b
```

Do **not** claim `gemma4:e2b` works without a successful pull / smoke. Older Ollama builds may fail on gemma tags — upgrade or use the documented fallback.

### 4. Python CLI + fixture ingest

```bash
python -m venv .venv && source .venv/bin/activate
pip install -e .
mecharag ingest --source fixtures
```

Compose must be up and `DATABASE_URL` correct **before** ingest.

### 5. Public fail-closed check

```bash
python scripts/checks/public_fail_closed.py fixtures
```

Runs once on `fixtures` for the stranger path. Do not point public defaults at private/OEM trees.

### 6. Web app

```bash
cd web && pnpm install && pnpm test && pnpm dev
```

### 7. Health + one ask

Copy these targets from README Quick Start (do not invent vehicle/question IDs):

```bash
curl -s localhost:3000/api/health
curl -s -X POST localhost:3000/api/ask \
  -H 'content-type: application/json' \
  -d '{"vehicle_id":"fixture:honda-s2000-demo","question":"What is the oil drain plug torque?"}'
```

### 8. Eval smoke (Next must be up)

```bash
# from repo root, venv active, Next still running
mecharag eval --golden evals/
```

If Next is down, `--retrieval-only` is an escape hatch only — full stranger smoke expects health + ask + eval with Next up.

**Twin-process paired ask ablation** (CE-on vs `MECHANIC_FORCE_RRF_ONLY`) is **not** part of this GETTING_STARTED DoD — see README “Paired ask ablation eval.”

---

## Operator footguns

| Footgun | Why it bites |
|---------|----------------|
| Ingest before Compose / wrong port | Health/ask fail; use host **5433**, not 5432 |
| Root `.env` only | CLI may work; Next will not see vars |
| `MECHANIC_FORCE_RRF_ONLY=1` left set | Production-looking ask skips CE; unset for normal use |
| `MECHANIC_DIAGNOSTICS=0` (default) | HTTP responses hide CE/ablation fields; turn on for eval/interview diagnostics |
| Claiming gemma without pull | Prefer documented fallback; record which model actually ran |

---

## Honesty

| Topic | Truth |
|-------|--------|
| Packaging | Stranger-clone + FAQ shell — not portfolio v1 complete |
| Public flip | **Not** ready |
| Embed / CE | **Candidates** — not frozen; Guide 05 keep-with-justification (`evals/MODEL_FREEZE_STATUS.md`) — CE stays in pipeline; paired ask delta **0** on n=38 (Guide 07; helps=0/hurts=0); Guide 06 freeze packaging **parked** |
| Public flip checklist | Packaging only — [`docs/PUBLIC_FLIP_CHECKLIST.md`](docs/PUBLIC_FLIP_CHECKLIST.md) (≠ flip / ≠ v1 Done) |
| Guide 02 paired ask (historical) | `ce_vs_rrf_ask_delta_hits=0` (n=12, gemma, citation∩gold) — honest flat |
| Guide 04 paired ask (historical) | `ce_vs_rrf_ask_delta_hits=0` (n=30) — superseded as current by Guide 07 |
| Guide 07 paired ask (current) | `ce_vs_rrf_ask_delta_hits=0` (n=38, +8 traps, `gemma4:e2b`, citation∩gold; CE-helps=0 / CE-hurts=0) — honest flat after discriminative attempt; CE remains **candidate**; **no auto-freeze** |
| Proxy theater | Historical `ce_vs_rrf_delta_hits=+1` / `n=5` is **forbidden** as lift |
| Corpus | **Fixtures only** — no Drive / Ford / OEM PDFs in this repo |
| ≥30 goldens | **Done** (Guide 04); discriminative band **+8** (Guide 07, n=38) — second vehicle / wiring still deferred (`evals/PATH_TO_30.md`) |

---

**Interview FAQ:** [`INTERVIEW.md`](INTERVIEW.md) · **Skim:** [`README.md`](README.md)
