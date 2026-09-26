# Ops notes

Scoring and operator policy for the hosted demo. The synthetic Ask monitor itself lives in a private ops repo and is not implemented here.

## Free-tier ceiling & durability residual

Production is Vercel Hobby + Supabase Free + Gemini API free tier. Platform pause/delete and free-tier quota remain residual risks: a paused or deleted tenant, or a Gemini/Supabase quota exhaustion, can take the public demo down even when this repo is green. The external keep-alive (`GET /api/health?mode=db`) and the daily cited-Ask monitor (a private ops repo) mitigate inactivity pause and surface Ask failures; they are not high availability, and this demo carries no SLO.

`POST /api/ask` exports `maxDuration = 60` (Next.js App Router) so Vercel Hobby cannot leave Ask running past the same 60s generate/embed budget already used by `OLLAMA_TIMEOUT_MS`.

### Durability posture

Four mitigations run in parallel, each verified:

1. **Inactivity keep-alive** (`GET /api/health?mode=db`): an external Cloudflare Worker + GitHub Action keep Supabase Free active with lightweight `SELECT 1` queries, preventing the 7-day inactivity pause that caused an earlier outage (see [the incident write-up](./incidents/2026-08-supabase-pause.md)).
2. **Generator backoff & retry**: the hosted Gemini generator retries transient HTTP 429/503 errors with exponential backoff and jitter, up to 4 attempts (`MAX_GEN_ATTEMPTS = 4`).
3. **Extractive degraded fallback**: when Gemini generation or embedding fails after retries, `POST /api/ask` returns HTTP 200 with `outcome: "degraded"` and verbatim manual excerpts with citations, rather than an unhandled 500.
4. **Postgres-backed abuse shield**: fixed UTC windows (per-IP 10/min, 100/day; global 800/day) protect against burst abuse and against exhausting the Gemini embedding quota (~1K requests/day).

Additionally, a private daily synthetic Ask monitor (once daily, 12:03 PM America/Chicago) proactively verifies cited-Ask health and opens deduplicated GitHub issues on failure.

**The remaining, honest residual: the platform pause/delete class inherent to free-tier hosting.**
- Supabase Free compute auto-pauses after prolonged inactivity, or the project itself could be deleted, per Supabase's own retention policy.
- Vercel Hobby deployments can be deactivated, rate-limited, or paused.
- A provider could reset or change its free-tier quota policy at any time.

**Evidence is not the same thing as High Availability.** Public evidence (keep-alive probe logs, live smoke checks, reproducible stranger curls) raises confidence that the system is currently operational and architecturally resilient — it cannot, by itself, create HA. No paid multi-region Postgres replication, no Supabase Pro, no Vercel Pro, and no paid monitoring service is used here; none of that is hidden as a mitigation. There is no SLO/SLA/uptime claim of any kind. Downtime caused by a platform pause or deletion is an honest, unavoidable free-tier residual risk, stated plainly rather than downplayed.

## CI (this repo)

GitHub Actions workflow: [`.github/workflows/ci.yml`](../.github/workflows/ci.yml). Two jobs on `ubuntu-latest`, in parallel, on every PR and push to `main`, plus an on-demand `workflow_dispatch` Production Ask smoke probe. Later steps in a job use `if: success() || failure()` so a lint failure still records typecheck/Vitest results (and a fail-closed check still records pytest results) — the job still ends red, but nothing downstream is silently skipped. No paid runners. No scheduled Production smoke here (see below for why).

| Job | Gate | What a green run proves |
|---|---|---|
| `web` | `pnpm lint` (`next lint --max-warnings 0`) | ESLint is clean. Warnings and errors both fail the gate — no `\|\| true`, no `continue-on-error`. |
| `web` | `pnpm typecheck` (`tsc --noEmit`) | TypeScript is clean under `web/tsconfig.json` (app + tests). |
| `web` | `pnpm test` (`vitest run`) | Existing Vitest unit tests pass. |
| `web` | `pnpm build` | Next.js production compile succeeds. |
| `python` | `public_fail_closed.py fixtures` | Public `fixtures/` has no OEM PDFs, no private-corpus path tokens, no forbidden rights class. Fails closed. |
| `python` | `pytest -m "not integration and not slow"` | Fast unit tests for `mecharag/` + `scripts/` that need no network, Ollama, or Postgres. |
| `prod_ask_smoke` (`workflow_dispatch` only) | `prod_ask_smoke.py` | A live Production cited-Ask probe against `https://mechanic-rag.vercel.app/api/ask`. Proves Production Ask health on demand, without spending free-tier quota on every push/PR. Badge: [![Production Ask Smoke](https://github.com/Alpha-W0lf/mechanic_rag/actions/workflows/ci.yml/badge.svg?event=workflow_dispatch)](https://github.com/Alpha-W0lf/mechanic_rag/actions/workflows/ci.yml). |

**Python pin:** `3.13` (matches [`docs/dev_setup.md`](dev_setup.md) / [`.python-version`](../.python-version)). `pyproject.toml` allows `>=3.11`. Dependencies are cached.

**Test markers** (see `[tool.pytest.ini_options]` in `pyproject.toml`):

| Mark | Why it's excluded from this CI subset |
|---|---|
| `integration` | Needs sibling private fixtures, a live vehicle-data emit, or a running Compose/Next/Ollama stack — not present in this public clone. |
| `slow` | Needs the OEM PDF corpus under gitignored `rag_input/`, or anything requiring network/Ollama/Postgres. |

Run the local full suite (when the sibling private repo or a live emit is available) with `pytest` from the repo root — tests skip with a reason when those trees are absent, while CI actively deselects them so a missing sibling never looks like a silently-skipped gate. `tests/test_parser.py` and `tests/test_chunking.py` are collect-ignored entirely (legacy OEM PDF smoke tests that import an optional dependency not installed by default).

**Deliberately not in this repo's CI:**

- The full eval suite (`mecharag eval --golden evals/`).
- Scheduled Production/hosted smoke. This clone is dormant by design, and GitHub disables scheduled workflows on inactive repos anyway; the daily scheduled monitor runs from a private ops repo instead. To check Production Ask health manually, dispatch the `prod_ask_smoke` job via `workflow_dispatch`, or run `python scripts/checks/prod_ask_smoke.py` yourself.

**The daily cited-Ask monitor** lives in a private ops repo, not this one — it's the scheduled fixture Ask probe (once daily, 12:03 PM America/Chicago). Failures and degraded results open deduplicated GitHub issues there. This repo doesn't add its own schedule to duplicate that. Scoring is defined below, in [Ask monitor policy](#ask-monitor-policy). Public evidence and how a stranger can verify it independently: [Public evidence pack](#public-evidence-pack). Local `/api/health` remains the clone's own readiness check.

## Degraded Ask response

`POST /api/ask` returns **HTTP 200** `outcome: "degraded"` in two cases (both require at least one citation):

1. Hosted Gemini **generation** fails after its retry budget → `error_class` is `generator_unavailable` (or `rate_limited` on a 429).
2. **Embedding** fails (hosted Gemini quota, or a down local Ollama embedder) but lexical retrieval still hits → `error_class` is `embedding_unavailable` (or `rate_limited` on a 429). Never `generator_unavailable`.

```json
{
  "answer": "AI summary temporarily unavailable; showing the most relevant manual excerpts.\n\n[1] <verbatim snippet from a retrieved chunk>",
  "citations": [{ "label": "1", "chunk_id": "…", "document_id": "…", "section_path": "…", "page_start": 1, "page_end": 1 }],
  "outcome": "degraded",
  "error_class": "generator_unavailable",
  "visual_assets": [],
  "diagnostics": null
}
```

`error_class` on a degraded body is one of `generator_unavailable` | `embedding_unavailable` | `rate_limited`. There's no separate `degraded: true` flag — `outcome` is the discriminator. Database failures stay HTTP 503 `error_class: "database_unavailable"` (that's not a degrade). Zero retrieved chunks — including an embed failure combined with an empty lexical result — stays `insufficient_evidence`.

**Citation labels.** Labels are assigned once, at context assembly. The response `citations` array is the referenced subset with those original labels (it may be sparse, e.g. just `"1"` and `"3"`). Unknown `[n]` markers are stripped from `answer` and never appear as citation cards. An extractive degrade follows the same rule: skipped empty rows keep their original labels. The UI links an answer's `[n]` to `#citation-n` only when that label is actually present in `citations`.

## Ask log fields

Every Ask that enters the request handler emits exactly one `event:ask` JSON stdout line — this isn't gated by the diagnostics flag (that flag only gates the public response's `diagnostics` object). Typical fields: `outcome`, `generator_model`, `embedding_model`, `ce_skip_reason`, retrieval counts, per-stage timing (`embed_ms`, `vector_ms`, `lexical_ms`, `gen_ms`, `total_ms`), `gen_attempts` (1–4), and `error_class` when the ask degraded or failed.

When `ce_skip_reason` is set, `ce_n`/`ce_k`/`ce_ranked_chunk_ids` are omitted. Chunk-ID lists are capped at the first 10 plus a count field. Fields for an image-retrieval channel that never ran are omitted entirely; a field noting the hosted image channel is deliberately disabled is kept, so that skip stays explicit rather than silently absent.

**Abuse-shield 429s emit a minimal line** (`outcome: rate_limited`, `error_class: rate_limited`, and which limit was hit) before the request handler even runs — no IP, salt, or bucket hash is logged. A Gemini 429 that reaches the handler still logs as `outcome: degraded` (or a dependency error) with `error_class: rate_limited`.

## Ask monitor policy

A daily synthetic Ask monitor (a private ops repo; 12:03 PM America/Chicago) scores hosted Ask with the table below and opens a deduplicated GitHub issue on a **fail** or a **degraded pass**. This repository does not contain that workflow itself.

| Result | Score |
|---|---|
| `outcome: "answered"` (a full generated answer) | **pass** |
| `outcome: "degraded"` with at least one citation | **degraded pass** (warn) |
| An HTTP error, an `error_class` without a degraded body, or a degraded response with zero citations | **fail** |

A degraded 200 is still useful — extractive manual excerpts with clickable citations — but it's not a full Gemini answer, and it must never be scored as a silent pass.

<a id="public-evidence-pack"></a>
## Public evidence pack & Ask monitor

The daily scheduled monitor lives in a private ops repo and isn't visible to public clones. This repository has no scheduled Production smoke (see [CI](#ci-this-repo) above), but it does provide an on-demand Production Ask smoke probe via `workflow_dispatch`, in [`.github/workflows/ci.yml`](../.github/workflows/ci.yml).

**Public workflow badges:**
- **CI (every push & PR):** [![CI](https://github.com/Alpha-W0lf/mechanic_rag/actions/workflows/ci.yml/badge.svg)](https://github.com/Alpha-W0lf/mechanic_rag/actions/workflows/ci.yml) — proves web lint, typecheck, Vitest, build, the Python fail-closed check, and the fast unit tests.
- **Production Ask Smoke (on-demand):** [![Production Ask Smoke](https://github.com/Alpha-W0lf/mechanic_rag/actions/workflows/ci.yml/badge.svg?event=workflow_dispatch)](https://github.com/Alpha-W0lf/mechanic_rag/actions/workflows/ci.yml) — reflects manual on-demand runs of the live smoke probe against `POST https://mechanic-rag.vercel.app/api/ask`. (GitHub shows "no status" until someone manually dispatches the workflow on `main`.)

There's no private-repo badge URL offered for the daily monitor — a stranger would just get a 404 there, so it's not linked.

### Dated public evidence signals

| Signal | When | Result / score | What a stranger can check |
|---|---|---|---|
| Database keep-alive probe (`GET /api/health?mode=db`) | 2026-09-24 19:47:53 UTC | ready (`status: "ready"`, `checks.postgres: true`) | The curl below — proves Postgres is awake and reachable after idle, and prevents inactivity auto-pause |
| Readiness probe (`GET /api/health`) | 2026-09-24 19:47:52 UTC | ready (`status: "ready"`, `checks: { postgres: true, ollama: false }`) | The curl below — proves the serverless function executes, the DB is reachable, and a Gemini key is present |
| Vehicle catalog probe (`GET /api/vehicles`) | 2026-09-24 19:47:56 UTC | 200 OK (`["fixture:honda-s2000-demo"]`) | The curl below — proves a real Postgres query against the `vehicles` table |
| Public smoke check (`prod_ask_smoke.py`) | 2026-09-24 19:48:03 UTC | pass (`outcome: "answered"`, 2 citations, ~2.0s) | Reproduce via `prod_ask_smoke.py`, a GitHub Actions `workflow_dispatch`, or the Ask curl below |
| One-shot public cited-Ask probe (`POST /api/ask`) | 2026-09-24 19:48:03 UTC | pass (`outcome: "answered"`, 2 citations: `[1], [3]`) | The curl below — proves hybrid vector + FTS retrieval, RRF fusion, section dedup, Gemini generation, and working citation links |
| Last private monitor run (owner-attested) | Passing as of 2026-09-24 | pass (owner-reported) | Not independently verifiable from a public clone — that Actions run isn't public |

### Live evidence snapshots (verbatim public responses)

**Keep-alive probe (`GET /api/health?mode=db`):**

```json
{
  "probed_at": "2026-09-24T19:47:53Z",
  "url": "https://mechanic-rag.vercel.app/api/health?mode=db",
  "http_status": 200,
  "status": "ready",
  "mode": "db",
  "checks": {
    "postgres": true
  }
}
```

**Live cited-Ask probe (`POST /api/ask`):**

```json
{
  "probed_at": "2026-09-24T19:48:03Z",
  "url": "https://mechanic-rag.vercel.app/api/ask",
  "vehicle_id": "fixture:honda-s2000-demo",
  "question": "What is the oil drain plug torque?",
  "http_status": 200,
  "outcome": "answered",
  "answer": "The oil drain plug torque is 39 N·m (29 lbf·ft) [1], [3].",
  "citations_n": 2,
  "citations": [
    {
      "label": "1",
      "chunk_id": "fixture-s2000-service-manual:v1:c2:02cf8874b98aa02be1f8551f",
      "document_id": "fixture-s2000-service-manual",
      "section_path": "1 Engine Oil > 1-1 Specification",
      "page_start": 3,
      "page_end": 3
    },
    {
      "label": "3",
      "chunk_id": "fixture-s2000-service-manual:v1:c3:cb9fce9ad036aaee15a6d5c2",
      "document_id": "fixture-s2000-service-manual",
      "section_path": "1 Engine Oil > 1-2 Oil Filter Replacement",
      "page_start": 4,
      "page_end": 4
    }
  ]
}
```

### Reproducible stranger curls (multi-layer verification)

Anyone can verify each layer of the hosted architecture directly, with no secrets, tokens, or repo access required:

**1. Database keep-alive probe (Postgres is awake, and this call prevents auto-pause):**

```bash
curl -sS -D- "https://mechanic-rag.vercel.app/api/health?mode=db"
```
*Expected:* HTTP 200, `{"status":"ready","mode":"db","checks":{"postgres":true}}`.

**2. General readiness probe (serverless process + DB + Gemini key):**

```bash
curl -sS -D- "https://mechanic-rag.vercel.app/api/health"
```
*Expected:* HTTP 200, `{"status":"ready","mode":"readiness","checks":{"postgres":true,"ollama":false}}`.

**3. Vehicle catalog probe (a real Postgres query executes):**

```bash
curl -sS -D- "https://mechanic-rag.vercel.app/api/vehicles"
```
*Expected:* HTTP 200, `{"vehicles":["fixture:honda-s2000-demo"]}`.

**4. End-to-end cited Ask probe (hybrid retrieval, RRF, section dedup, Gemini generation, citations):**

```bash
curl -sS -D- --max-time 90 -X POST "https://mechanic-rag.vercel.app/api/ask" \
  -H "content-type: application/json" \
  -d '{"vehicle_id":"fixture:honda-s2000-demo","question":"What is the oil drain plug torque?"}'
```
*Expected:* HTTP 200 with `outcome: "answered"` (or `outcome: "degraded"` with at least one citation), plus a citations array with real document locators.

### Keep-alive vs. Ask smoke — what each actually proves

The external keep-alive hits `GET /api/health?mode=db` regularly (via a Cloudflare Worker + GitHub Action).

- **Why it exists:** Supabase Free auto-pauses compute after prolonged inactivity — the root cause of an earlier outage (see [the incident write-up](./incidents/2026-08-supabase-pause.md)). The probe issues a lightweight `SELECT 1` through the hardened connection pool, registering store activity and keeping compute warm.
- A green keep-alive proves database compute reachability (`SELECT 1`) — not that the Gemini model is available, or that cited Ask actually returns valid answers.
- A passing Ask smoke probe proves end-to-end RAG functionality: embedding generation, hybrid vector + Postgres lexical retrieval, RRF fusion, section deduplication, Gemini generation, and citation formatting.
- An Ask failure doesn't necessarily mean the database paused (e.g. it could be Gemini quota exhaustion); conversely, a passing keep-alive doesn't guarantee Ask is functional. The two signals together give real visibility that neither gives alone.

### Running the Production Ask smoke probe yourself

```bash
python3 scripts/checks/prod_ask_smoke.py
```

Standard library only (`urllib.request`, `json`, `argparse`). Scores the response against the [Ask monitor policy](#ask-monitor-policy) table above, and exits 0 on a pass or a degraded pass, or 1 on failure.

**Via GitHub Actions (`workflow_dispatch`):**
1. Go to the [CI workflow](https://github.com/Alpha-W0lf/mechanic_rag/actions/workflows/ci.yml) on GitHub.
2. With dispatch access (or in your own fork with network egress), select **Run workflow**, keep the default `ask_url`, and trigger it.
3. The `prod_ask_smoke` job runs `prod_ask_smoke.py` and records pass/degraded-pass/fail directly in the public Actions log.

### Why on-demand instead of scheduled

- **GitHub's dormant-repo policy:** GitHub Actions automatically disables scheduled (`cron`) workflows on repositories with no commit activity for 60 days. A scheduled probe would silently stop running on an inactive public clone.
- **Quota preservation:** a scheduled cron in every public clone would burn unauthenticated Gemini free-tier quota (~1K embedding requests/day) and Supabase Free compute unnecessarily.
- **A dedicated private monitor already exists:** the scheduled synthetic monitor runs once daily (12:03 PM America/Chicago) in a separate, private operations repo, where alerts and deduplicated issues are actively triaged.

**To wire up scheduled public smoke in your own fork or deployment (optional):** add a `schedule` trigger to `.github/workflows/ci.yml`:
```yaml
on:
  pull_request:
  push:
    branches: [ main ]
  workflow_dispatch:
    inputs:
      ask_url:
        description: "Ask endpoint URL to probe for smoke check"
        required: false
        default: "https://mechanic-rag.vercel.app/api/ask"
  schedule:
    - cron: '0 12 * * *'  # 12:00 UTC daily smoke check
```
And update the job condition to:
```yaml
  if: github.event_name == 'workflow_dispatch' || github.event_name == 'schedule'
```

### Operational boundaries

Storefront screenshots of the same fixture question live under [`docs/assets/demo/`](assets/demo/) — they show cited Ask in the UI, not a schedule.

**How the last-success line above stays current:** after each private daily run (pass, fail, or degraded pass), the operator updates the owner-attested row. There's no SLO or HA claim made from that update — an owner-attested pass is not the same thing as a public keep-alive `SELECT 1`, and this document says so rather than blurring the two.

**Genuinely unknown from a public clone:** the exact private-run timestamp and its Actions URL, whether the last owner-attested pass was the scheduled 12:03 PM run or a manual dispatch, and the keep-alive Worker/Action itself (also private, with no public badge).

## Public Ask abuse shield

`POST /api/ask` is unauthenticated. Every successful pass spends Gemini free-tier quota (`gemini-embedding-001`'s ~1K requests/day is the binding constraint) and Supabase Free capacity. The shield is app-level Postgres logic — not a paid WAF.

**This is distinct from the degraded-response path above.** A Gemini 429 encountered *after* retrieval has already started can still return HTTP 200 `outcome: "degraded"` with `error_class: "rate_limited"`. The abuse shield itself is a **pre-Ask** HTTP 429 with the same public error JSON plus a `Retry-After` header — no answer generated, no embedding call made at all.

### Ceilings (fixed UTC windows)

| Knob | Env var | Default | Protects against |
|---|---|---|---|
| Per hashed IP / minute | `ASK_RATE_LIMIT_PER_MINUTE` | 10 | Burst traffic / scripts |
| Per hashed IP / UTC day | `ASK_RATE_LIMIT_PER_DAY` | 100 | A single client grinding the endpoint |
| Global / UTC day | `ASK_RATE_LIMIT_GLOBAL_DAY` | 800 | The ~1K/day embedding quota — this stays safely under it |

Change a ceiling by setting the env var on Vercel and redeploying. A non-positive or non-numeric value falls back to the default. The once-daily synthetic Ask monitor is well under every ceiling; there's no IP allowlist.

**Admission order:** increment the client-minute bucket, then the client-day bucket, then the global bucket. A client-limit denial does not increment the global bucket — otherwise, ~800 denied 10/min bursts from a single IP would 429 everyone else until UTC midnight, without even spending any real Gemini quota. A minute-level denial also skips the client-day increment, so a rejected burst doesn't burn into the 100/day budget. The global bucket only increments for requests that both client-level checks already admitted.

### Identity and storage

- The client key is `HMAC-SHA256(salt, ip)` — a raw IP is never stored. Table: `ask_rate_buckets(bucket_id, hit_count, expires_at)` in `db/migrations/003_ask_rate_limit.sql`. Row-level security is enabled with no policies, and the `anon`/`authenticated` roles are revoked where they exist. The app itself connects as the table owner via `DATABASE_URL` and bypasses RLS entirely.
- The salt is set via an environment variable on Vercel. If unset, the process falls back to a built-in default salt and logs a warning — hashes still aren't raw IPs either way, but a unique salt is the better practice.
- IP is read from the first present header in order (a platform-specific header, then a generic real-IP header, then the standard forwarded-for header). A missing IP shares a single hashed "unknown" bucket. A spoofed forwarded-for header could in principle split one client across multiple per-client buckets; the global cap is the real backstop against that.

### Fail-open, deliberately

If the rate-limit table is missing (a migration not yet applied) or the limiter query itself errors, the shield **allows** the Ask through and logs a fail-open warning event.

Why fail-open: applying the Production migration is an operator-owned, reviewed action — a missing table or a limiter-database hiccup must never turn the whole demo into a 429 outage, and must not fail the once-daily monitor either. The cost of that choice is a window where abuse could still spend real Gemini quota until the table exists or the store recovers. Ask itself still fails closed on genuine database or Gemini errors — this fail-open behavior is scoped to the rate limiter only.

### Security residuals, stated plainly

- **The fail-open limiter is itself a residual risk:** it deliberately fails open on store errors specifically to avoid false-positive demo outages, which means an adversary hitting the endpoint during a database outage could consume Gemini free-tier quota. There is no paid WAF or external DDoS shield here.
- **SSL residual:** serverless database connections use `ssl: { rejectUnauthorized: false }` (the `sslmode=require` equivalent). Traffic is encrypted in transit, but server CA verification is omitted in the serverless runtime.
- **Salt privacy:** the rate-limit salt is hashed together with client IPs and never logged or exposed — only a presence/missing-salt warning is ever logged, never the value.

### Local Compose

The limiter uses the same `DATABASE_URL`/pool as everything else. A fresh Compose volume loads the rate-limit migration automatically on first boot; an existing volume needs `./scripts/migrate.sh`. To disable the limiter entirely for local development (no store calls at all): set `ASK_RATE_LIMIT_DISABLED=1` in `web/.env.local`.

### Why not an in-memory counter or Vercel's Hobby WAF alone

Per-isolate memory counters aren't shared across Vercel's serverless isolates, so a script could simply bypass them. Vercel Hobby's built-in WAF includes exactly one rate-limit rule, on a fixed 10-second-to-10-minute window, keyed only on IP/JA4 — no daily window, and no concept of a global embedding-quota budget. Neither is a substitute for the app-level shield above.

## Supabase Data API lock

Supabase's PostgREST layer exposes every `public` table to the project's `anon`/`authenticated` keys unless row-level security is on and/or those roles are explicitly revoked. Before this lock was applied, Production's `vehicles`, `documents`, `chunks`, `index_state`, and `chunk_image_embeddings` tables had RLS off and `anon` could freely `SELECT` from them (verified directly, 2026-09-23). The rate-limit table above was already locked down separately.

**The actual product path never touches any of this.** Next.js talks to Postgres directly via `pg` + `DATABASE_URL`. Ingest talks to it via `psycopg` and the same URL. Neither ever goes through PostgREST or a Supabase client library. Postgres table owners bypass RLS unless `FORCE ROW LEVEL SECURITY` is set — this migration deliberately does not force it, on the assumption that the `DATABASE_URL` role owns (or is superuser for) the tables it created. That assumption is worth confirming with the verification query below before applying this on Production.

An earlier set of Supabase-client ingest/deploy scripts were removed entirely; product ingest is `mecharag ingest` / `mecharag embed-images` via `psycopg` + `DATABASE_URL` only.

The migration also revokes Supabase's default grant behavior for future tables created by the same role, so a later `CREATE TABLE` doesn't silently inherit public access again.

### Applying it (operator-owned)

On Production: apply `db/migrations/004_lock_data_api.sql` yourself, after review — the exact SQL is in that file. On local Compose or an existing volume:

```bash
# Compose must be up. DATABASE_URL defaults to localhost:5433.
psql "${DATABASE_URL:-postgres://mechanic:mechanic@localhost:5433/mechanic_rag}" \
  -v ON_ERROR_STOP=1 -f db/migrations/004_lock_data_api.sql
# Re-run: must be a no-op (exit 0).
psql "${DATABASE_URL:-postgres://mechanic:mechanic@localhost:5433/mechanic_rag}" \
  -v ON_ERROR_STOP=1 -f db/migrations/004_lock_data_api.sql
```

Compose mounts all migrations in filename order on first boot for a fresh volume; an existing volume uses `./scripts/migrate.sh` instead (this skips anything marked as a draft). This migration is idempotent, and Compose has no `anon`/`authenticated` roles to begin with, so the revoke step there is simply skipped.

### Verification (run on Production after applying)

Lists every public base table with its RLS flags, its owner versus the currently connected role, and whether `anon` still has any table privileges. Expected after a correct apply: `relrowsecurity` true, `relforcerowsecurity` false, and all `anon_*` privilege checks false (or `NULL` if the `anon` role doesn't exist at all). `current_user` should match the table's `owner` — that's the owner-bypass assumption this whole approach relies on.

```sql
SELECT
  c.relname AS table_name,
  c.relrowsecurity,
  c.relforcerowsecurity,
  pg_get_userbyid(c.relowner) AS owner,
  current_user,
  current_user = pg_get_userbyid(c.relowner) AS connected_is_owner,
  CASE WHEN EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'anon')
       THEN has_table_privilege('anon', c.oid, 'SELECT') END AS anon_select,
  CASE WHEN EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'anon')
       THEN has_table_privilege('anon', c.oid, 'INSERT') END AS anon_insert,
  CASE WHEN EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'anon')
       THEN has_table_privilege('anon', c.oid, 'UPDATE') END AS anon_update,
  CASE WHEN EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'anon')
       THEN has_table_privilege('anon', c.oid, 'DELETE') END AS anon_delete
FROM pg_class c
JOIN pg_namespace n ON n.oid = c.relnamespace
WHERE n.nspname = 'public'
  AND c.relkind = 'r'
ORDER BY 1;
```

## PrivateGold S2000 ingest runbook

Operator guide for ingesting the personal-garage Honda S2000 private corpus into Production Supabase (free tier).

### Constraints

1. **Binding embedder:** Production queries use `gemini-embedding-001` @ 768. Ingest must use the same Gemini embedding provider, not the local Ollama/`nomic` one — mixing them would create a vector-space mismatch.
2. **Free-tier embedding quota bottleneck:** the Gemini embeddings free tier allows roughly 1,000 requests/day. Ingesting the full S2000 corpus (~2,488 units) takes roughly 3 calendar days, or a staged per-family run.
3. **Text only:** the default ingest processes text units only. Don't run the image-embedding path or upload the (273MB) image asset set — free Supabase storage comfortably fits text + embeddings alone (well under 30MB).
4. **Secrets:** ingest credentials are read from a local environment or a password manager — never committed to git.

### Staged ingest commands

Run from the repo root, with the private Gold root, embedding provider, and credentials set in your shell environment first:

```bash
export MECHANIC_PRIVATE_GOLD_ROOT=/path/to/your/private/gold/root
export MECHANIC_EMBEDDING_PROVIDER=gemini
export EMBEDDING_MODEL=gemini-embedding-001
export EMBEDDING_DIM=768
export GEMINI_API_KEY=...       # Supabase / Vercel Gemini project key
export DATABASE_URL=...         # Supabase connection string (pooler session mode)

# Stage 1: Owner's manual (~276 units, fits in a single day's quota)
.venv/bin/python -m mecharag ingest --source private-gold \
  --root "$MECHANIC_PRIVATE_GOLD_ROOT" \
  --vehicle-id cat:2003-honda-s2000 \
  --doc-family owners_manual

# Stage 2: Wiring diagrams (~255 units)
.venv/bin/python -m mecharag ingest --source private-gold \
  --root "$MECHANIC_PRIVATE_GOLD_ROOT" \
  --vehicle-id cat:2003-honda-s2000 \
  --doc-family wiring

# Stage 3: Service manual (~1,957 units; resumable across days -- idempotent hash check skips anything already ingested)
.venv/bin/python -m mecharag ingest --source private-gold \
  --root "$MECHANIC_PRIVATE_GOLD_ROOT" \
  --vehicle-id cat:2003-honda-s2000 \
  --doc-family service_manual
```

### Post-ingest smoke verification

```bash
# Verify the vehicle is listed
curl -sS https://mechanic-rag.vercel.app/api/vehicles | jq .
# Expect "cat:2003-honda-s2000" in the response array

# Smoke queries on brakes, rear differential, and engine displacement
VID=cat:2003-honda-s2000
for q in \
  "What is the front brake pad inspection procedure?" \
  "What fluid does the rear differential use?" \
  "What is the engine displacement / F20C specification?"
do
  curl -sS -X POST https://mechanic-rag.vercel.app/api/ask \
    -H 'content-type: application/json' \
    -d "{\"vehicle_id\":\"$VID\",\"question\":\"$q\"}" | jq '{outcome,n:(.citations|length),answer:(.answer[:180])}'
done
```

Expected result: `outcome: "answered"` with at least one citation for each smoke topic.

### Rollback plan

```sql
DELETE FROM chunks WHERE vehicle_id = 'cat:2003-honda-s2000';
DELETE FROM documents WHERE vehicle_id = 'cat:2003-honda-s2000';
DELETE FROM vehicles WHERE vehicle_id = 'cat:2003-honda-s2000';
```

Deleting the `cat:2003-honda-s2000` rows instantly restores fixture-only catalog behavior in both the UI and the API. No code rollback or git history change is needed.
