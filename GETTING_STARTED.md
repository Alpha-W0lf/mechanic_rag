# Getting started — Mechanic RAG (clean clone)

Clone-depth operator path for the **hybrid → RRF → section dedup → local CE** product slice. Contracts: [`docs/ARCHITECTURE.md`](docs/ARCHITECTURE.md). Interview gotchas: [`INTERVIEW.md`](INTERVIEW.md). Skim + Try it: [`README.md`](README.md). Product why: [`docs/VISION.md`](docs/VISION.md).

**Fast path:** from repo root, `./scripts/stranger_smoke.sh` (Docker + Ollama preflight → Compose → `web/.env.local` → fixture ingest → fail-closed). Then pull models, `cd web && pnpm install && pnpm dev`, and run health/ask below.

This is the stranger-clone path for a **fixtures-only** public repo. Guide 10b = packaging “fixtures-only public flip” Met; **GitHub visibility public** is a separate gate (see [`docs/PUBLIC_FLIP_CHECKLIST.md`](docs/PUBLIC_FLIP_CHECKLIST.md)). Embed/CE are **frozen (Tom override)** Guide 09 with n=44 delta **0** honesty (not earned lift). **License:** PolyForm Noncommercial 1.0.0 — source-available / non-commercial (not OSI open source; not MIT). Public corpus = fixtures only.

> **Multimodal honesty:** This clone path is **M0 text RAG** on `fixtures/` — you do **not** need multimodal env flags to complete it. Personal-garage **M1–M3 are Met** locally (`cat:*` + optional flags: image channel, `MECHANIC_VLM`); all default **off**. Friend Drive library **≠** Mechanic ingest. See [`INTERVIEW.md`](INTERVIEW.md) themes **10–11** and [`docs/VISION.md`](docs/VISION.md) §5.

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

**Local DB may show more vehicles than the public clone:** `mecharag ingest --source fixtures` loads only `fixture:honda-s2000-demo` from `fixtures/honda_s2000_demo/`. Extra dropdown ids such as `fixture:demo-miata-nb` / `fixture:demo-s2000-ap1` come from **Guide 12 PrivateGold synthetic multi-vehicle packs** (local `MECHANIC_PRIVATE_GOLD_ROOT` ingest) — not from public `fixtures/`, and **not** from Tom’s personal garage fleet. `cat:*` rows are personal-garage ingest. Strangers who never run private-gold see only the Honda S2000 fixture.

**PrivateGoldSource (Guide 11, optional / local only):** fixture-first Contract 7.2 ingest from a configured local Gold root — **not** the stranger public path.

```bash
export MECHANIC_PRIVATE_GOLD_ROOT=/path/to/local/gold   # required; never default fixtures/
mecharag ingest --source private-gold
```

Unset `MECHANIC_PRIVATE_GOLD_ROOT` fail-closes (no silent fixtures fallthrough). Guide 11 Met = `fixture:` pack under that root. **Guide 12:** stage ≥2 distinct `fixture:` vehicles and optionally a root `gold_status.json` with `zero_gap=false` / `publishable=false` (sidecar is not Contract 7.2). **Guide 13 Soft Adjust:** local `cat:` / `private_oem` packs require `gold_status.json` with present-only / incomplete honesty (`friend_publish_eligible` rejected on Soft Adjust path). **Guide 14 Soft Adjust live pilot:** map Vehicle `present_only_receipt.json` → `gold_status.json` via `mecharag receipt-to-gold-status`, then Soft Adjust-load local live emit (e.g. `cat:2017-f-150` under Vehicle builder `out/live/`). **Guide 15 Soft Adjust ask smoke:** after Soft Adjust private-gold ingest of synthetic `cat:demo-synthetic-f150`, `POST /api/ask` with that `vehicle_id` returns a contract-valid response (`answered` or `insufficient_evidence`); incomplete Gold honesty remains — **not** friend rclone Review Met / dual-product Done / Ford PTS / live F-150 upsert Met; no OEM committed to this repo. Never Drive as ingest (GD2).

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

**Soft Adjust ask smoke (Guide 15, after Soft Adjust private-gold ingest of synthetic pack):**

```bash
curl -s -X POST localhost:3000/api/ask \
  -H 'content-type: application/json' \
  -d '{"vehicle_id":"cat:demo-synthetic-f150","question":"Drain oil with vehicle level — what is the oil capacity procedure?"}'
# Expect: contract-valid JSON; Soft Adjust vehicle_id on citations; answered OR insufficient_evidence OK
# ≠ dual-product Done · ≠ friend Soft Adjust Review Met
```

**Personal garage ask smoke (after private-gold ingest of `~/var/mechanic_garage/gold`):**

```bash
# Vehicle list (UI picker) — fixtures first, then cat: when indexed
curl -s localhost:3000/api/vehicles
# Expect: { "vehicles": [ "fixture:…", "cat:2003-honda-s2000", … ] }

# Triumph (first Met)
curl -s -X POST localhost:3000/api/ask \
  -H 'content-type: application/json' \
  -d '{"vehicle_id":"cat:2015-triumph-street-triple","question":"What is the sump drain plug torque for the Street Triple?"}'

# Remaining garage vehicles (multi-vehicle smoke Met)
curl -s -X POST localhost:3000/api/ask \
  -H 'content-type: application/json' \
  -d '{"vehicle_id":"cat:2003-honda-s2000","question":"What is the engine oil drain bolt torque on the S2000?"}'
curl -s -X POST localhost:3000/api/ask \
  -H 'content-type: application/json' \
  -d '{"vehicle_id":"cat:2021-yamaha-yxz1000r-ss-se","question":"What is the engine oil drain bolt tightening torque on the YXZ1000R?"}'
curl -s -X POST localhost:3000/api/ask \
  -H 'content-type: application/json' \
  -d '{"vehicle_id":"cat:2016-ford-transit-350","question":"What is the oil pan drain plug torque on the Transit?"}'
# Expect: answered OR insufficient_evidence; citations only for the asked cat: vehicle when answered
# ≠ friend Drive Done · ≠ multimodal

# M1 linked page asset (after ask returns visual_assets[].href — or known garage doc/page)
# First GET may rasterize via pdftoppm (≤8s) then cache under ~/var/mechanic_garage/assets/
# curl -fsS "http://127.0.0.1:3000/api/assets/<vehicle_id>/<document_id>/1" -o /tmp/page.png
# Ask never rasterizes; missing bronze → omit visual / GET 404

# Private garage golden evals are LOCAL-ONLY (not in the public clone tip).
# If you keep a private goldens file outside git, invoke with an explicit path, e.g.:
# .venv/bin/mecharag eval --golden /path/to/local/golden_garage_v1.json --no-paired-ask
# ≠ public fixture n=44 baseline · ≠ CE lift claim · never commit cat:/OEM goldens
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
| Packaging | Stranger-clone + FAQ shell — fixtures-only public flip Met Guide 10b |
| Public flip | **Met** Guide 10b (fixtures-only) — not earned CE lift; not OSI open source; not Drive |
| PrivateGold | Guide 11–13 fixture/synthetic Soft Adjust Met + Guide 14 Soft Adjust **live pilot** + Guide 15 Soft Adjust **ask smoke** (synthetic Soft Adjust vehicle; incomplete Gold OK) — not friend Drive Soft Adjust Review Met; not dual-product Done; no OEM in git; not live Soft Adjust full upsert Met |
| Embed / CE | **Frozen (Tom override)** Guide 09 — flat delta; no lift claim (`evals/MODEL_FREEZE_STATUS.md`); CE **stays in stack** for architecture completeness + `rerank_degraded` fail-open (not because n=44 showed lift); paired ask delta **0** on n=44 (helps=0/hurts=0); see INTERVIEW §11 |
| Multimodal | **M1–M3 Met** on personal garage under local flags (default off); **not** required for this stranger clone — M0 text on fixtures only |
| Public flip checklist | [`docs/PUBLIC_FLIP_CHECKLIST.md`](docs/PUBLIC_FLIP_CHECKLIST.md) — Guide 10b Met |
| License | **PolyForm Noncommercial 1.0.0** ([`LICENSE`](LICENSE), Guide 10a) — source-available / non-commercial; commercial use → contact copyright holder; **not** OSI open source / **not** MIT |
| Guide 02 paired ask (historical) | `ce_vs_rrf_ask_delta_hits=0` (n=12, gemma, citation∩gold) — honest flat |
| Guide 04 paired ask (historical) | `ce_vs_rrf_ask_delta_hits=0` (n=30) |
| Guide 07 paired ask (historical) | `ce_vs_rrf_ask_delta_hits=0` (n=38) — superseded as current by Guide 08 |
| Guide 08 paired ask (evidence) | `ce_vs_rrf_ask_delta_hits=0` (n=44, T1 +6 traps, `gemma4:e2b`, citation∩gold; CE-helps=0 / CE-hurts=0) — honest flat; freeze later landed via Guide 09 **Tom override** (not auto-freeze from ablation) |
| Proxy theater | Historical `ce_vs_rrf_delta_hits=+1` / `n=5` is **forbidden** as lift |
| Corpus | **Fixtures only** — no Drive / Ford / OEM PDFs in this repo |
| ≥30 goldens | **Done** (Guide 04); Guide 07–08 discriminative bands landed (n=44) — second vehicle / wiring still deferred (`evals/PATH_TO_30.md`) |

---

**Interview FAQ:** [`INTERVIEW.md`](INTERVIEW.md) · **Skim:** [`README.md`](README.md)
