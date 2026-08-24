# Getting started — Mechanic RAG (clean clone)

Clone-depth path for the **hybrid → RRF → section dedup → local CE** product slice.

- Skim + Try it: [`README.md`](README.md)
- Contracts: [`docs/ARCHITECTURE.md`](docs/ARCHITECTURE.md)
- Product why: [`docs/VISION.md`](docs/VISION.md)
- Technical FAQ: [`FAQ.md`](FAQ.md)

**Fast path:** from repo root, `./scripts/stranger_smoke.sh` (Docker + Ollama preflight → Compose → `web/.env.local` → fixture ingest → fail-closed). Then pull models, `cd web && pnpm install && pnpm dev`, and run health/ask below.

This is the stranger-clone path for a **fixtures-only** public repo. Public corpus = synthetic fixtures only. Embed/CE are **frozen** with honest flat paired-ask delta (not earned lift) — see [`evals/MODEL_FREEZE_STATUS.md`](evals/MODEL_FREEZE_STATUS.md). **License:** PolyForm Noncommercial 1.0.0 — source-available / non-commercial (not OSI open source; not MIT).

> **Multimodal:** This clone path is **text RAG** on `fixtures/` — you do **not** need multimodal env flags. Optional local image/VLM flags default **off**. See Technical FAQ and [`docs/VISION.md`](docs/VISION.md).

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

`mecharag ingest --source fixtures` loads the public Honda S2000 demo from `fixtures/honda_s2000_demo/` (`fixture:honda-s2000-demo`). Strangers who only run this path should see that fixture vehicle — not private local corpora (see appendix).

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

Copy these targets from README Try it (do not invent vehicle/question IDs):

```bash
curl -s localhost:3000/api/health
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

If Next is down, `--retrieval-only` is an escape hatch only — full stranger smoke expects health + ask + eval with Next up.

Paired CE-on vs RRF-only ablation is **not** part of this GETTING_STARTED DoD — see Technical FAQ and [`evals/MODEL_FREEZE_STATUS.md`](evals/MODEL_FREEZE_STATUS.md).

---

## Operator footguns

| Footgun | Why it bites |
|---------|----------------|
| Ingest before Compose / wrong port | Health/ask fail; use host **5433**, not 5432 |
| Root `.env` only | CLI may work; Next will not see vars |
| `MECHANIC_FORCE_RRF_ONLY=1` left set | Production-looking ask skips CE; unset for normal use |
| `MECHANIC_DIAGNOSTICS=0` (default) | HTTP responses hide CE/ablation fields; turn on for local diagnostics |
| Claiming gemma without pull | Prefer documented fallback; record which model actually ran |

---

## Honesty (stranger)

| Topic | Truth |
|-------|--------|
| Public corpus | **Fixtures only** — no Drive / Ford / OEM PDFs in this repo |
| Packaging | Fixtures-only public packaging — not earned CE lift; not OSI open source |
| Embed / CE | **Frozen** — flat paired-ask delta; no lift claim ([`evals/MODEL_FREEZE_STATUS.md`](evals/MODEL_FREEZE_STATUS.md)); CE stays in stack for architecture + fail-open degradation |
| Multimodal | Not required for this clone — text RAG on fixtures |
| License | **PolyForm Noncommercial 1.0.0** ([`LICENSE`](LICENSE)) — source-available / non-commercial; commercial use → contact copyright holder; **not** OSI open source / **not** MIT |
| Eval size | Public goldens ≥30 (current discriminative set n=44) — see `evals/` |

---

**Technical FAQ:** [`FAQ.md`](FAQ.md) · **Skim:** [`README.md`](README.md) · **License:** [`LICENSE`](LICENSE)

---

## Appendix: local private lanes (optional)

Not required for the public clone. Keep OEM and private garage trees **out of git**.

### Private gold root

Local DB may show more vehicles than the public clone when you ingest a configured local gold root:

```bash
export MECHANIC_PRIVATE_GOLD_ROOT=/path/to/local/gold   # required; never default fixtures/
mecharag ingest --source private-gold
```

Unset `MECHANIC_PRIVATE_GOLD_ROOT` fail-closes (no silent fixtures fallthrough). Extra dropdown ids such as `fixture:demo-miata-nb` / `fixture:demo-s2000-ap1` come from local synthetic multi-vehicle packs under that root — **not** from public `fixtures/`, and **not** from a personal garage fleet unless you ingest those packs. `cat:*` rows are personal-garage ingest.

Friend Drive libraries and separate vehicle-doc pipelines are **not** Mechanic ingest targets.

### Ask smoke after private-gold ingest

Synthetic pack example (after private-gold ingest of that pack):

```bash
curl -s -X POST localhost:3000/api/ask \
  -H 'content-type: application/json' \
  -d '{"vehicle_id":"cat:demo-synthetic-f150","question":"Drain oil with vehicle level — what is the oil capacity procedure?"}'
# Expect: contract-valid JSON; answered OR insufficient_evidence OK
```

Personal garage smoke (after private-gold ingest of a local garage gold root, e.g. `~/var/mechanic_garage/gold`):

```bash
curl -s localhost:3000/api/vehicles
# Expect fixtures first, then cat: when indexed

curl -s -X POST localhost:3000/api/ask \
  -H 'content-type: application/json' \
  -d '{"vehicle_id":"cat:2015-triumph-street-triple","question":"What is the sump drain plug torque for the Street Triple?"}'
```

Private garage golden evals are **local-only** (not in the public clone tip). If you keep a private goldens file outside git:

```bash
# .venv/bin/mecharag eval --golden /path/to/local/golden_garage_v1.json --no-paired-ask
```

Never commit `cat:` / OEM goldens.

### Multimodal flags (default off)

Personal-garage image channel / VLM paths are optional and default **off**. They are not part of the stranger fixtures path. Details: Technical FAQ themes on multimodal honesty.

### Diligence ledger (historical paired-ask)

| Evidence | Note |
|----------|------|
| n=12 / n=30 / n=38 / n=44 paired ask | `ce_vs_rrf_ask_delta_hits=0` (citation∩gold) — honest flat |
| Historical proxy theater | `ce_vs_rrf_delta_hits=+1` / `n=5` is **forbidden** as lift |
| Freeze | Tom override after flat ablation — CE remains for architecture completeness |

More: [`evals/MODEL_FREEZE_STATUS.md`](evals/MODEL_FREEZE_STATUS.md) · [`FAQ.md`](FAQ.md).
