# Getting started — Mechanic RAG (clean clone)

Clone-depth path for the **hybrid → RRF → section dedup → local CE** product slice.

- Hosted demo in 60s (zero install, no local models): [mechanic-rag.vercel.app](https://mechanic-rag.vercel.app)
- Skim + Overview: [`README.md`](README.md)
- Contracts: [`docs/ARCHITECTURE.md`](docs/ARCHITECTURE.md)
- Product why: [`docs/VISION.md`](docs/VISION.md)
- Technical FAQ: [`FAQ.md`](FAQ.md)

> **Looking for the fastest evaluation?** Use the hosted demo above. It runs the full hybrid vector + FTS → RRF → section dedup pipeline with citation labels over the complete Honda S2000 service manuals (`cat:2003-honda-s2000`) — no Docker, Python, Node, or multi-GB local models. The clone path below uses synthetic fixtures.
>
> If you are cloning to develop locally, you can use the optional **Dev Container** (`.devcontainer/`) or follow the clean-clone steps below.

**Fast path:** from repo root, `./scripts/smoke.sh` (Docker + Ollama preflight → Compose → `web/.env.local` → fixture ingest → fail-closed). Then pull models, `cd web && pnpm install && pnpm dev`, and run health/ask below.

This is the clone-and-run path for a **fixtures-only** public repo. Public corpus = synthetic fixtures only. Eval results: [README eval results](README.md#eval-results). **License:** PolyForm Noncommercial 1.0.0 — source-available / non-commercial (not OSI open source; not MIT).

> **Multimodal:** This clone path is **text RAG** on `fixtures/` — you do **not** need multimodal env flags. Optional local image/VLM flags default **off**. See Technical FAQ and [`docs/VISION.md`](docs/VISION.md).

---

## Prerequisites

- **Docker** (Compose Postgres + pgvector)
- **Node** + [`pnpm`](https://pnpm.io/) (Next app under `web/`)
- **Python 3.11+** + venv (`mecharag` CLI)
- Host **Ollama** (embeddings + generator)

---

## Clean-clone options

Choose between two clean-clone setups:

### Option A: Dev Container (`.devcontainer/`)
Open this repository in VS Code using the **Remote - Containers** extension (or GitHub Codespaces on the free tier). The devcontainer automatically:
- Starts a containerized Postgres 16 + pgvector database service with all migrations (`001`–`004`) applied.
- Installs Python 3.12 and Node 22 with `pnpm`.
- Installs the `mecharag` CLI in editable mode.
- Does **not** require downloading multi-GB Ollama models. You can test Ask via the free-tier Gemini API (add `GEMINI_API_KEY` to `web/.env.local`) or verify the lexical retrieval and extractive degrade paths.

### Option B: Local host environment (Docker Compose + host Ollama)

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

**Why this path:** Next.js reads `web/.env.local`. The CLI `load_dotenv()` then loads that same file. A root `.env` alone works for the CLI but not for Next, so keep one file at `web/.env.local`.

Do not commit `.env` / `.env.local`. Leave `MECHANIC_FORCE_RRF_ONLY` **unset** for normal CE-on asks (see Common pitfalls).

### 3. Ollama pulls

```bash
ollama pull nomic-embed-text
ollama pull gemma4:e2b
# Fallback if primary missing: OLLAMA_MODEL=qwen3.5:4b && ollama pull qwen3.5:4b
```

If `gemma4:e2b` fails to pull on an older Ollama build, upgrade Ollama or use the fallback model above.

### 4. Python CLI + fixture ingest

```bash
python -m venv .venv && source .venv/bin/activate
pip install -e .
mecharag ingest --source fixtures
```

Compose must be up and `DATABASE_URL` correct **before** ingest.

`mecharag ingest --source fixtures` loads the public Honda S2000 demo from `fixtures/honda_s2000_demo/` (`fixture:honda-s2000-demo`). Anyone who runs only this path should see that fixture vehicle — not private local corpora (see appendix).

### 5. Public fail-closed check

```bash
python scripts/checks/public_fail_closed.py fixtures
```

Runs once on `fixtures` for the public clone. Do not point public defaults at private/OEM trees.

### 6. Web app

```bash
cd web && pnpm install && pnpm test && pnpm dev
```

### 7. Health + one ask

Copy these targets from README Try it (do not invent vehicle/question IDs):

```bash
curl -s localhost:3000/api/health
# Postgres-only probe (200 iff SELECT 1 succeeds; 503 JSON on failure)
curl -sS -D- "http://localhost:3000/api/health?mode=db"
curl -s -X POST localhost:3000/api/ask \
  -H 'content-type: application/json' \
  -d '{"vehicle_id":"fixture:honda-s2000-demo","question":"What is the oil drain plug torque?"}'
```

---

## Eval smoke (Next must be up)

```bash
# from repo root, venv active, Next still running
mecharag eval --golden evals/
```

If Next is down, `--retrieval-only` is an escape hatch only — the full smoke run expects health + ask + eval with Next up.

The paired reranker-on vs RRF-only eval isn't needed for this setup; see the FAQ and [`evals/RERANKER_DECISION.md`](evals/RERANKER_DECISION.md).

---

## Common pitfalls

| Pitfall | Why it matters |
|---------|----------------|
| Ingest before Compose / wrong port | Health/ask fail; use host **5433**, not 5432 |
| Root `.env` only | CLI may work; Next will not see vars |
| `MECHANIC_FORCE_RRF_ONLY=1` left set | Production-looking ask skips CE; unset for normal use |
| `MECHANIC_DIAGNOSTICS=0` (default) | HTTP responses hide CE/ablation fields; turn on for local diagnostics |
| Claiming gemma without pull | Prefer documented fallback; record which model actually ran |

---

## What the clone includes

| Topic | Detail |
|-------|--------|
| Corpus | Synthetic S2000 fixture in `fixtures/` (original demo text; no OEM PDFs) |
| Ranking | Hybrid → RRF → section dedup, plus the local cross-encoder reranker ([`evals/RERANKER_DECISION.md`](evals/RERANKER_DECISION.md)) |
| Multimodal | Optional image and vision paths stay off; the clone is text RAG |
| License | PolyForm Noncommercial 1.0.0 ([`LICENSE`](LICENSE)); for commercial use, contact the copyright holder |
| Evals | Golden set in `evals/golden_fixture_v1.json`: 40 answerable questions plus 4 with no answer in the fixture by design |

---

**Technical FAQ:** [`FAQ.md`](FAQ.md) · **Skim:** [`README.md`](README.md) · **License:** [`LICENSE`](LICENSE)

---

## Appendix: local private lanes (optional)

Not required for the public clone. Keep OEM and private corpus trees **out of git**.

### Private gold root

Local DB may show more vehicles than the public clone when you ingest a configured local gold root:

```bash
export MECHANIC_PRIVATE_GOLD_ROOT=/path/to/local/gold   # required; never default fixtures/
mecharag ingest --source private-gold
```

Unset `MECHANIC_PRIVATE_GOLD_ROOT` fail-closes (no silent fixtures fallthrough). Extra dropdown ids such as `fixture:demo-miata-nb` / `fixture:demo-s2000-ap1` come from local synthetic multi-vehicle packs under that root — **not** from public `fixtures/`. `cat:*` rows come from a local private corpus you ingest.

### Ask smoke after private-gold ingest

Synthetic pack example (after private-gold ingest of that pack):

```bash
curl -s -X POST localhost:3000/api/ask \
  -H 'content-type: application/json' \
  -d '{"vehicle_id":"cat:demo-synthetic-truck","question":"Drain oil with vehicle level — what is the oil capacity procedure?"}'
# Expect: contract-valid JSON; answered OR insufficient_evidence OK
```

Local private-corpus smoke (after private-gold ingest of a local gold root, e.g. `~/var/mechanic_garage/gold`):

```bash
curl -s localhost:3000/api/vehicles
# Expect fixtures first, then cat: when indexed

curl -s -X POST localhost:3000/api/ask \
  -H 'content-type: application/json' \
  -d '{"vehicle_id":"cat:<your-vehicle-id>","question":"What is the drain plug torque?"}'
```

Private-corpus golden evals are **local-only** (not in the public clone tip). If you keep a private goldens file outside git:

```bash
# .venv/bin/mecharag eval --golden /path/to/local/golden_garage_v1.json --no-paired-ask
```

Never commit `cat:` / OEM goldens.

### Multimodal flags (default off)

Local image channel / VLM paths are optional and default **off**. They are not part of the public fixtures path. Details: FAQ §8.

### Eval results

What the paired eval found: [README eval results](README.md#eval-results). Full history: [`evals/RERANKER_DECISION.md`](evals/RERANKER_DECISION.md).
