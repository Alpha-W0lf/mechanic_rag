## Mechanic RAG — hybrid → RRF → CE vertical slice

Personal, non-commercial **portfolio** project. Text-only RAG over automotive service documentation.

**Status:** Guide 01 vertical slice implemented for local Compose + fixtures. Formal embed/CE **frozen (Tom override)** Guide 09. **License:** PolyForm Noncommercial 1.0.0 — **source-available / non-commercial** (not OSI open source; not MIT). **Not** portfolio-complete. **Not** public-flip ready. **Not** “v1 done.”

**SSOT:** [`docs/VISION.md`](docs/VISION.md) · [`docs/ARCHITECTURE.md`](docs/ARCHITECTURE.md) · [`GETTING_STARTED.md`](GETTING_STARTED.md) · [`INTERVIEW.md`](INTERVIEW.md) · [`LICENSE`](LICENSE) · [`docs/dev_guides/2026-07-12_dev_guide_01_hybrid_rrf_ce_ask_path.md`](docs/dev_guides/2026-07-12_dev_guide_01_hybrid_rrf_ce_ask_path.md) · [`evals/MODEL_FREEZE_STATUS.md`](evals/MODEL_FREEZE_STATUS.md)

### Stack (Guide 01)

- Next.js App Router under **`web/src/app` only** (root `web/app` removed — no dual tree)
- Compose **Postgres + pgvector** (no Supabase product path)
- Offline Python CLI: **`mecharag ingest`** / **`mecharag eval`**
- Host **Ollama** generator default **`gemma4:e2b`** (fallback `qwen3.5:4b`); embedding `nomic-embed-text` @ 768 (**frozen** Guide 09 override)
- Ranking: vehicle-filtered vector + lexical → **RRF** → **section dedup (default on)** → local **CE** (degrade to RRF on failure)

### Quick Start

```bash
# 1. Postgres
docker compose up -d

# 2. Env
cp .env.example web/.env.local
# ensure Ollama is running; pull models:
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
# Paired ablation: see "Paired ask ablation eval" below (two Next processes)
```

### Honest limits

- Public corpus = **`fixtures/` only** (synthetic). No OEM PDFs, Drive, or Ford.
- Embedding + CE IDs are **frozen (Tom override)** Guide 09 — paired ask n=44 delta **0** (helps=0/hurts=0); **not** earned lift (`evals/MODEL_FREEZE_STATUS.md`).
- Generator default is **gemma4:e2b** (pass 9 smoke OK). Pass 8c eval baseline historically used **qwen3.5:4b**.
- Eval set is **44** fixture cases on `fixture:honda-s2000-demo` (Guide 04–08; T1 synthetic confusable sections); paired ask `ce_vs_rrf_ask_delta_hits=0` (helps=0/hurts=0); second vehicle / wiring still deferred (`evals/PATH_TO_30.md`).
- Stale paths (`db/schema.sql`, `supabase/**`, deleted stub `web/app`) are non-authoritative.
- Packaging: [`GETTING_STARTED.md`](GETTING_STARTED.md) (clone path) · [`INTERVIEW.md`](INTERVIEW.md) (FAQ) — Guide 03; still not portfolio v1 / public flip / v1 Done.
- **License:** [`LICENSE`](LICENSE) — PolyForm Noncommercial 1.0.0 (Guide 10a). Source-available · non-commercial OK · contact copyright holder for commercial use. **Not** OSI open source / **not** MIT. LICENSE Met ≠ public flip.
- Public-flip packaging checklist (≠ flip): [`docs/PUBLIC_FLIP_CHECKLIST.md`](docs/PUBLIC_FLIP_CHECKLIST.md). Formal freeze (Guide 09 Tom override): [`evals/MODEL_FREEZE_STATUS.md`](evals/MODEL_FREEZE_STATUS.md).

### Paired ask ablation eval (Guide 02)

True CE lift uses **two Next processes** (env gate — public ask schema is **not** widened):

| Arm | Env | Example |
|-----|-----|---------|
| CE-on | `MECHANIC_DIAGNOSTICS=1`, **unset** `MECHANIC_FORCE_RRF_ONLY` | `cd web && MECHANIC_DIAGNOSTICS=1 pnpm dev` → `:3000` |
| RRF-only | `MECHANIC_FORCE_RRF_ONLY=1` + diagnostics | `cd web && PORT=3001 MECHANIC_FORCE_RRF_ONLY=1 MECHANIC_DIAGNOSTICS=1 pnpm dev` |

`SECTION_DEDUP_ENABLED` must match on both. Then:

```bash
mecharag eval --golden evals/ \
  --ask-url http://127.0.0.1:3000/api/ask \
  --ask-url-rrf-only http://127.0.0.1:3001/api/ask
```

Expect summary fields `rrf_only_ask_hits`, `ce_ask_hits`, `ce_vs_rrf_ask_delta_hits` (citation∩gold). Lexical FTS counters are `*_lexical_proxy` and are **not** CE lift. Ablation diagnostics use `ablation_rrf_only=true` (not `rerank_degraded`). See also `mecharag eval --help`.

### Disclaimers

- Advisory only. Verify against your official service manual. Use at your own risk.
- No redistribution of OEM PDFs.
