# Ops notes

Scoring and operator policy for the hosted demo. The synthetic Ask monitor itself (JH-41) lives in a private ops repo and is not implemented here.

## Free-tier ceiling & durability residual (JH-48.9)

Production is Vercel Hobby + Supabase Free + Gemini API free tier. Platform pause/delete and free-tier quota remain residual risks: a paused or deleted tenant, or a Gemini/Supabase quota exhaustion, can take the public demo down even when this repo is green. The external keep-alive (`GET /api/health?mode=db`) and the daily cited-Ask monitor (JH-41, private ops repo) mitigate inactivity pause and surface Ask failures; they are not high availability and this demo has no SLO.

`POST /api/ask` exports `maxDuration = 60` (Next.js App Router) so Vercel Hobby cannot leave Ask running past the same 60s generate/embed budget already used by `OLLAMA_TIMEOUT_MS`.

### Durability target & residual risk posture

- **Target dimension:** Durability 8.5 → 8.7–9.0 (JH-48.9).
- **Parallel ×4 durability mitigations (Verified):**
  1. **Inactivity keep-alive (`GET /api/health?mode=db`, JH-29):** External Cloudflare Worker + GitHub Actions keep Supabase Free active with lightweight `SELECT 1` queries to prevent the 7-day inactivity pause that caused the JH-17 incident.
  2. **Generator backoff & retry (JH-39):** Hosted Gemini generator retries transient HTTP 429 / 503 errors with exponential backoff and jitter up to 4 attempts (`MAX_GEN_ATTEMPTS = 4`).
  3. **Extractive degraded fallback (JH-46):** When Gemini generation or embedding fails after retries, `POST /api/ask` returns HTTP 200 with `outcome: "degraded"` and verbatim manual excerpts with citations rather than an unhandled 500.
  4. **Postgres-backed abuse shield (JH-42):** Fixed UTC windows (per-IP 10/min, 100/day; global 800/day) protect against burst abuse and Gemini embedding quota (~1K RPD) exhaustion.
  - Additionally, the private daily synthetic Ask monitor (JH-41, 12:03 PM America/Chicago) proactively verifies cited-Ask health and opens deduped GitHub issues on failures.
- **Remaining dock — platform pause/delete class (honest residual):**
  - The remaining durability dock is the platform pause/delete class inherent to free-tier hosting:
    - Supabase Free compute auto-pause after prolonged inactivity or project deletion per Supabase retention policies.
    - Vercel Hobby deployment deactivation, rate limits, or project pause.
    - Provider free-tier quota reset or policy modifications.
  - **Evidence vs. HA:** Public evidence (keep-alive probe logs, live smoke checks, reproducible stranger curls) can raise confidence that the system is currently operational, durable, and architecturally resilient, but **evidence cannot create High Availability (HA)**.
  - **Paid HA is strictly forbidden:** No paid multi-region Postgres replication, no Supabase Pro, no Vercel Pro, and no paid APM/monitoring services.
  - **No SLO/HA claim:** We do not claim any SLO, SLA, or 99.9% uptime. Downtime due to platform pause or deletion remains an honest, unavoidable free-tier residual risk.

## CI (this repo)

GitHub Actions workflow: [`.github/workflows/ci.yml`](../.github/workflows/ci.yml). Two jobs on `ubuntu-latest`, in parallel, PR + push to `main`, plus an on-demand `workflow_dispatch` Production Ask smoke probe (`prod_ask_smoke`). Later steps in a job use `if: success() || failure()` so a lint failure still records typecheck/Vitest (and fail-closed still records pytest). The job stays red. No paid runners. No scheduled Production smoke here.

| Job | Gate | What a green run proves |
|---|---|---|
| `web` | `pnpm lint` (`next lint --max-warnings 0`) | ESLint is clean. Warnings and errors fail the gate (no `\|\| true`, no `continue-on-error`). |
| `web` | `pnpm typecheck` (`tsc --noEmit`) | TypeScript is clean under `web/tsconfig.json` (app + tests). Pre-existing test mock typing was fixed so this gate is honest — not silenced. Injectable env helpers take `NodeJS.Dict<string>` (type-only; same runtime). |
| `web` | `pnpm test` (`vitest run`) | Existing Vitest unit tests pass. |
| `web` | `pnpm build` | Next.js production compile succeeds. |
| `python` | `public_fail_closed.py fixtures` | Public `fixtures/` has no OEM PDFs, no `private_oem` / `private_gold` path tokens, no forbidden `rights_class`. Fail-closed. |
| `python` | `pytest -m "not integration and not slow"` | Fast unit tests for `mecharag/` + `scripts/` that need **no** network, Ollama, or Postgres. |
| `prod_ask_smoke` (`workflow_dispatch` only) | `prod_ask_smoke.py` | Live Production cited-Ask probe against `https://mechanic-rag.vercel.app/api/ask`. Proves Production Ask health on demand without spending free-tier quota on every push/PR. Badge: [![Production Ask Smoke](https://github.com/Alpha-W0lf/mechanic_rag/actions/workflows/ci.yml/badge.svg?event=workflow_dispatch)](https://github.com/Alpha-W0lf/mechanic_rag/actions/workflows/ci.yml). |

**Python pin:** `3.13` (same as [`docs/dev_setup.md`](dev_setup.md) / [`.python-version`](../.python-version)). `pyproject.toml` allows `>=3.11`. Dependencies are cached.

**Markers** (see `[tool.pytest.ini_options]` in `pyproject.toml`):

| Mark | Why it is out of this CI subset |
|---|---|
| `integration` | Needs the sibling `second_brain` program fixtures, a live Vehicle Gold emit, or a running Compose/Next/Ollama stack. Those trees are not in this public clone. |
| `slow` | OEM PDF corpus under gitignored `rag_input/`, or anything that would call network / Ollama / Postgres. |

Local full suite (when you have the sibling repo / live emit): `pytest` from repo root. Tests skip with a reason when those trees are absent; CI **deselects** them so a missing sibling is not a silent skip of an intended gate. `tests/test_parser.py` and `tests/test_chunking.py` are **collect-ignored** (legacy OEM PDF smokes; they import `google.genai` from the `legacy` extra).

**Not in this repo's CI (by design):**

- Full eval suite (`mecharag eval --golden evals/`).
- Scheduled Production / hosted smoke. This clone is dormant by design; GitHub disables schedules on inactive repos, and daily scheduled monitoring (JH-41) runs in a private ops repo. To test Production Ask health manually, dispatch the `prod_ask_smoke` job via `workflow_dispatch` or run `python scripts/checks/prod_ask_smoke.py`.

**Cited-Ask monitor (JH-41)** lives in a private ops repo, not this repo. It is the scheduled fixture Ask probe (once daily at 12:03 PM America/Chicago). Failures and degraded results open deduped GitHub issues. Do not add a schedule here to cover that. Scoring is in the Ask monitor policy section below. Public evidence pack and stranger verify steps: [Public evidence pack & Ask-monitor (JH-66 / JH-48.6 / JH-48.9)](#public-ask-monitor-evidence-jh-66). Local `/api/health` remains the clone readiness check.

## Degraded Ask response (JH-46)

`POST /api/ask` returns **HTTP 200** `outcome: "degraded"` in two cases (both require ≥1 citation):

1. Hosted Gemini **generate** fails after its retry budget → `error_class` is `generator_unavailable` (or `rate_limited` on 429).
2. **Embed** fails (hosted Gemini quota / local Ollama embed down) and lexical retrieval still hits → `error_class` is `embedding_unavailable` (or `rate_limited` on 429). Never `generator_unavailable`.

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

`error_class` on a degraded body is one of `generator_unavailable` | `embedding_unavailable` | `rate_limited`. No `degraded: true` flag — `outcome` is the discriminator. Database failures stay HTTP 503 `error_class: "database_unavailable"` (not degraded). Zero retrieved chunks (including embed-fail + empty lexical) stay `insufficient_evidence`.

**Citation labels (JH-53).** Labels are assigned once at context assembly. The response `citations` array is the referenced subset with those original labels (it may be sparse, e.g. `"1"` and `"3"`). Unknown `[n]` markers are stripped from `answer` and never appear as cards. Extractive degrade uses the same rule: skipped empty rows keep original labels. The UI links answer `[n]` to `#citation-n` only when that label is in `citations`.

## Ask log fields (JH-50)

Every Ask that enters `handleAsk` emits exactly one `event:ask` JSON stdout line. It is **not** gated by `MECHANIC_DIAGNOSTICS` (that flag still gates only the public response `diagnostics` object). Typical fields: `outcome`, `generator_model`, `embedding_model`, `ce_skip_reason`, retrieval counts, per-stage ms (`embed_ms`, `vector_ms`, `lexical_ms`, `gen_ms`, `total_ms`), `gen_attempts` (Gemini generate tries, 1–4), and `error_class` when the Ask degraded or failed.

When `ce_skip_reason` is set, `ce_n` / `ce_k` / `ce_ranked_chunk_ids` are omitted. Chunk-id lists are capped at the first 10 plus a `*_n` count. `clip_query_unavailable` / `image_channel_disabled` (channel never ran) are omitted from the line; `image_degrade_reason=hosted_image_channel_disabled` is kept so the hosted Gemini CLIP skip is explicit. Those fields also stay when CLIP actually ran.

**Abuse-shield 429s emit a minimal line** (`outcome: rate_limited`, `error_class: rate_limited`, `limit: client_minute|client_day|global_day`) from `POST /api/ask` before `handleAsk`. No IP, salt, or bucket hash. Gemini 429s that reach `handleAsk` still log as `outcome: degraded` (or `dependency_error`) with `error_class: rate_limited`.

## Ask monitor policy

A daily synthetic Ask monitor (JH-41, a private ops repo; 12:03 PM America/Chicago) scores hosted Ask with this table and opens a deduped GitHub issue on **fail** or **degraded pass**. This repository does not contain that workflow.

Score a hosted Ask probe as follows:

| Result | Score |
|---|---|
| `outcome: "answered"` (full generated answer) | **pass** |
| `outcome: "degraded"` with **≥1 citation** (generator or embedding) | **degraded pass** (warn) |
| HTTP error, `error_class` without a degraded body, or degraded with zero citations | **fail** |

A degraded 200 is still useful: extractive manual excerpts plus clickable citations. It is not a full Gemini answer and must not be scored as a silent pass.

<a id="public-ask-monitor-evidence-jh-66"></a>
<a id="public-ask-monitor-evidence-jh-66--jh-486"></a>
<a id="public-evidence-pack-jh-489"></a>
## Public evidence pack & Ask-monitor (JH-66 / JH-48.6 / JH-48.9)

The daily scheduled monitor (JH-41) lives in a private ops repo and is not visible to public clones. This repository has no scheduled Production smoke (see [CI](#ci-this-repo)), but provides an on-demand Production Ask smoke probe via `workflow_dispatch` (JH-48.4) in [`.github/workflows/ci.yml`](../.github/workflows/ci.yml).

**Public workflow badges:**
- **CI (all pushes & PRs):** [![CI](https://github.com/Alpha-W0lf/mechanic_rag/actions/workflows/ci.yml/badge.svg)](https://github.com/Alpha-W0lf/mechanic_rag/actions/workflows/ci.yml) — proves web lint, typecheck, Vitest, build, Python fail-closed, and fast unit tests.
- **Production Ask Smoke (`workflow_dispatch` on-demand):** [![Production Ask Smoke](https://github.com/Alpha-W0lf/mechanic_rag/actions/workflows/ci.yml/badge.svg?event=workflow_dispatch)](https://github.com/Alpha-W0lf/mechanic_rag/actions/workflows/ci.yml) — reflects manual on-demand smoke probe runs testing live `POST https://mechanic-rag.vercel.app/api/ask`. (Note: GitHub returns `no status` until the workflow is manually dispatched on `main` via `workflow_dispatch`).

Do **not** invent private-repo badge URLs for the daily monitor; a stranger gets a 404.

### Dated public evidence signals

| Signal | When | Result / Score | What a stranger can check |
|---|---|---|---|
| **Database keep-alive probe (`GET /api/health?mode=db`)** | **2026-09-24 19:47:53 UTC** (JH-48.9) | **ready** (`status: "ready"`, `checks.postgres: true`) | Curl `GET /api/health?mode=db` below (proves Postgres is awake & reachable after idle; prevents inactivity auto-pause) |
| **Readiness probe (`GET /api/health`)** | **2026-09-24 19:47:52 UTC** (JH-48.9) | **ready** (`status: "ready"`, `checks: { postgres: true, ollama: false }`) | Curl `GET /api/health` below (Next.js serverless execution + DB reachable + Gemini key present) |
| **Vehicle catalog probe (`GET /api/vehicles`)** | **2026-09-24 19:47:56 UTC** (JH-48.9) | **200 OK** (`["fixture:honda-s2000-demo"]`) | Curl `GET /api/vehicles` below (proves Postgres query execution against `vehicles` table) |
| **Public smoke check (`prod_ask_smoke.py`)** | **2026-09-24 19:48:03 UTC** (JH-48.9) | **pass** (`outcome: "answered"`, 2 citations, ~2.0s) | Reproduce via `prod_ask_smoke.py`, GitHub Actions `workflow_dispatch`, or Ask curl below |
| **One-shot public cited-Ask probe (`POST /api/ask`)** | **2026-09-24 19:48:03 UTC** (JH-48.9) | **pass** (`outcome: "answered"`, 2 citations: `[1], [3]`) | Direct curl below (proves hybrid vector + FTS retrieval, RRF fusion, section dedup, Gemini generation, citation links) |
| Last private monitor run (**owner-attested**) | Passing as of **2026-09-24** (JH-66 / JH-41) | **pass** (owner) | **Unknown** from a public clone — the Actions run is not public |

### Live evidence snapshots (verbatim public responses)

**Keep-alive probe snapshot (`GET /api/health?mode=db`):**

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

**Live cited-Ask probe snapshot (`POST /api/ask`):**

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

Any stranger can verify each layer of the hosted architecture directly without secrets, tokens, or repo settings:

**1. Database keep-alive probe (verifies Postgres is awake & prevents pause):**

```bash
curl -sS -D- "https://mechanic-rag.vercel.app/api/health?mode=db"
```
*Expected:* HTTP 200 `{"status":"ready","mode":"db","checks":{"postgres":true}}`.

**2. General readiness probe (verifies serverless process + DB + Gemini key):**

```bash
curl -sS -D- "https://mechanic-rag.vercel.app/api/health"
```
*Expected:* HTTP 200 `{"status":"ready","mode":"readiness","checks":{"postgres":true,"ollama":false}}`.

**3. Vehicle catalog probe (verifies Postgres query execution):**

```bash
curl -sS -D- "https://mechanic-rag.vercel.app/api/vehicles"
```
*Expected:* HTTP 200 `{"vehicles":["fixture:honda-s2000-demo"]}`.

**4. End-to-end cited Ask probe (verifies hybrid retrieval, RRF, section dedup, Gemini generation, and citations):**

```bash
curl -sS -D- --max-time 90 -X POST "https://mechanic-rag.vercel.app/api/ask" \
  -H "content-type: application/json" \
  -d '{"vehicle_id":"fixture:honda-s2000-demo","question":"What is the oil drain plug torque?"}'
```
*Expected:* HTTP 200 with `outcome: "answered"` (or `outcome: "degraded"` with ≥1 citation) and citations array with document locators.

### Keep-alive last-success details & operational context

The external keep-alive mechanism hits `GET /api/health?mode=db` regularly (via Cloudflare Worker + GitHub Actions).
- **Why keep-alive exists:** Supabase Free auto-pauses compute instances after prolonged inactivity (the root cause of the historical JH-17 outage). The keep-alive probe issues a lightweight `SELECT 1` through the hardened `pg.Pool`, registering store activity and keeping compute warm.
- **Keep-alive vs. Ask smoke:**
  - A green keep-alive proves **database compute reachability** (`SELECT 1`), not that the Gemini model is available or that cited Ask returned valid answers.
  - A passing Ask smoke probe proves **end-to-end RAG functionality** (embedding generation, hybrid vector similarity + Postgres lexical FTS, RRF fusion, section deduplication, Gemini generation, citation formatting).
  - An Ask failure does not necessarily mean the database paused (e.g. Gemini quota exhaustion); conversely, a passing keep-alive does not assure Ask is functional. Together, both signals provide comprehensive visibility.

### Production Ask Smoke path (JH-48.4)

Alternatively, run the smoke probe script locally or via GitHub Actions `workflow_dispatch`:

```bash
python3 scripts/checks/prod_ask_smoke.py
```

Standard library only (`urllib.request`, `json`, `argparse`). Evaluates the response against the Ask monitor policy table and exits 0 on pass / degraded pass, or 1 on failure.

**How to run via GitHub Actions (`workflow_dispatch`):**
1. Go to the [CI Workflow](https://github.com/Alpha-W0lf/mechanic_rag/actions/workflows/ci.yml) on GitHub.
2. If you have repo dispatch access (or in your own fork with network egress), select **Run workflow**, keep the default `ask_url`, and trigger the run.
3. The `prod_ask_smoke` job executes `prod_ask_smoke.py` and records pass / degraded pass / fail directly in public Actions logs.

### Public smoke scheduling note (why on-demand vs. scheduled)

- **Why this public repo uses on-demand `workflow_dispatch`:**
  1. *GitHub dormant repo policy:* GitHub Actions automatically disables scheduled workflows (`cron`) on repositories with no commit activity after 60 days. An automated cron would silently stop running on an inactive public clone.
  2. *Quota preservation:* Automated cron runs in public clones would consume unauthenticated Gemini free-tier quota (~1K embedding RPD) and Supabase Free compute unnecessarily.
  3. *Dedicated private monitor (JH-41):* The scheduled synthetic monitor runs once daily at 12:03 PM America/Chicago in a separate private operations repository where maintainer alerts and deduplicated GitHub issues are actively processed.
- **How to wire scheduled public smoke in a fork or deployment (optional):**
  If you are running your own deployment and wish to enable an automated daily smoke check in GitHub Actions, add a `schedule` trigger to `.github/workflows/ci.yml`:
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

### Operational boundaries & residual reminder

Storefront screenshots of the same fixture question live under [`docs/assets/demo/`](assets/demo/) — they show cited Ask in the UI, not the schedule. *(Note for repo owners: if archiving operator-run evidence, store screenshots under `docs/assets/ops/` with private org tokens, internal repo names, and runner IDs redacted; never invent fake screenshots or publish private monitor URLs).*

**How the last-success line stays current.** After a private daily pass (or a fail / degraded pass), the operator updates the owner-attested row above. Do not claim an SLO or HA. A green probe here is not a keep-alive `SELECT 1`.

**Unknown (from a public clone):** exact private run timestamp and Actions URL; whether the last owner-attested pass was the 12:03 PM America/Chicago schedule or a manual dispatch; keep-alive Worker / Actions (also private — no public badge).

## Public Ask abuse shield (JH-42)

`POST /api/ask` is unauthenticated. Every successful pass spends Gemini free-tier quota (`gemini-embedding-001` ~1K RPD is the binding constraint) and Supabase Free capacity. The shield is **app-level Postgres**, not a paid WAF.

**Do not confuse with JH-46.** A Gemini 429 after retrieval can still return HTTP 200 `outcome: "degraded"` + `error_class: "rate_limited"`. The abuse shield is a **pre-Ask** HTTP **429** with the same public error JSON and a `Retry-After` header — no answer, no embed.

### Ceilings (UTC fixed windows)

| Knob | Env | Default | Protects |
|---|---|---|---|
| Per hashed IP / minute | `ASK_RATE_LIMIT_PER_MINUTE` | **10** | Burst / script |
| Per hashed IP / UTC day | `ASK_RATE_LIMIT_PER_DAY` | **100** | Single-client grind |
| Global / UTC day | `ASK_RATE_LIMIT_GLOBAL_DAY` | **800** | Embedding RPD (~1K). Stay below 1K |

Change a ceiling by setting the env var on Vercel and redeploying. Non-positive or non-numeric values fall back to the default. The once-daily synthetic Ask monitor (12:03 PM America/Chicago) is well under every ceiling; no IP allowlist.

**Admission order.** Increment client minute, then client day, then global. A client-limit deny does **not** increment the global bucket — otherwise ~800 denied 10/min bursts from one IP would 429 everyone until UTC midnight without spending Gemini quota. A minute deny also skips the client-day increment (a rejected burst must not burn the 100/day budget). Global is incremented only for requests both client checks admitted.

### Identity and storage

- Client key = `HMAC-SHA256(ASK_RATE_LIMIT_SALT, ip)`. Never store a raw IP. Table: `ask_rate_buckets(bucket_id, hit_count, expires_at)` in `db/migrations/003_ask_rate_limit.sql`. RLS is enabled with no policies; `anon`/`authenticated` are revoked when those roles exist (PostgREST). The app connects as the table owner via `DATABASE_URL` and bypasses RLS.
- Set `ASK_RATE_LIMIT_SALT` on Vercel (any long random string). If unset, the process uses a built-in fallback salt and logs `warning: missing_salt`. Hashes are still not raw IPs, but operators should set a unique salt.
- IP headers (first value): `x-vercel-forwarded-for`, then `x-real-ip`, then `x-forwarded-for`. Missing IP shares the hashed `unknown` bucket. A spoofed `x-forwarded-for` hop can split per-client buckets; the **global** cap is the quota backstop.

### Fail-open (deliberate)

If `ask_rate_buckets` is missing (migration not applied yet) or the limiter query errors, the shield **allows** the Ask and logs:

```json
{"event":"ask_rate_limit","warning":"fail_open","reason":"undefined_table"|"store_error"}
```

Why fail-open: Production apply is operator-owned after review; a missing table or limiter-DB hiccup must not turn the demo into a 429 outage (and must not fail the once-daily monitor). The cost is a window where abuse can still spend Gemini quota until the table exists or the store recovers. Ask itself still fails closed on real DB/Gemini errors.

### Security residual (free-tier)

- **Fail-open limiter residual:** The Postgres-backed rate limiter deliberately fails open on store errors to avoid false-positive demo outages; an adversary hitting the endpoint during a database outage could consume Gemini free-tier embedding quota. No paid WAF or external DDoS shield is used.
- **SSL residual (rejectUnauthorized: false):** Serverless database connections in `web/src/server/db.ts` use `ssl: { rejectUnauthorized: false }` (`sslmode=require` equivalent). Connection traffic is encrypted in transit, but server CA verification is omitted in the serverless runtime.
- **Salt privacy:** `ASK_RATE_LIMIT_SALT` is hashed with client IPs and never logged or exposed (presence-only / missing-salt warnings only).

### Local Compose

The limiter uses the same `DATABASE_URL` / pool. Fresh Compose volumes load `003_ask_rate_limit.sql` from `docker-entrypoint-initdb.d`. Existing volumes: `./scripts/migrate.sh`. To disable locally (no store calls): `ASK_RATE_LIMIT_DISABLED=1` in `web/.env.local`.

## Supabase Data API lock (JH-52)

Supabase PostgREST exposes every `public` table to the project's `anon` / `authenticated` keys unless RLS is on and/or those roles are revoked. Before this lock, Production `vehicles`, `documents`, `chunks`, `index_state`, and `chunk_image_embeddings` had RLS **off** and `anon` could `SELECT` (verified 2026-09-23 CT). `ask_rate_buckets` was already locked in `003_ask_rate_limit.sql`.

**Product path is unchanged.** Next.js uses `pg` + `DATABASE_URL` (`web/src/server/db.ts`). Ingest (`mecharag ingest`, `mecharag embed-images`) uses `psycopg` + the same URL. Neither talks to PostgREST or supabase-js. Postgres table owners bypass RLS unless `FORCE ROW LEVEL SECURITY` — this migration does **not** FORCE. Assumption: the `DATABASE_URL` role owns (or is superuser for) the public tables it created. Confirm with the snippet below before applying on Production.

Retired supabase-js ingest/deploy scripts (`scripts/ingest/ingest.py`, `scripts/deploy/upload_assets.py`) were removed (JH-47). Product ingest is `mecharag ingest` / `mecharag embed-images` via `psycopg` + `DATABASE_URL`.

`004_lock_data_api.sql` also `ALTER DEFAULT PRIVILEGES … REVOKE` from `anon`/`authenticated` (same role gate) so a later `CREATE TABLE` by the applying role does not inherit Supabase's default GRANT. That revoke is scoped to objects created by `current_user` after apply.

### Apply (operator-owned)

Production: apply `db/migrations/004_lock_data_api.sql` yourself after review (exact SQL is in that file and in the JH-52 PR). Local Compose / existing volume:

```bash
# Compose must be up. DATABASE_URL defaults to localhost:5433.
psql "${DATABASE_URL:-postgres://mechanic:mechanic@localhost:5433/mechanic_rag}" \
  -v ON_ERROR_STOP=1 -f db/migrations/004_lock_data_api.sql
# Re-run: must be a no-op (exit 0).
psql "${DATABASE_URL:-postgres://mechanic:mechanic@localhost:5433/mechanic_rag}" \
  -v ON_ERROR_STOP=1 -f db/migrations/004_lock_data_api.sql
```

`docker-compose.yml` initdb mounts `001`–`004` in filename order (JH-47). Fresh volumes apply them on first boot. Existing volumes: `./scripts/migrate.sh` (skips `*DRAFT*`; planning drafts moved to `docs/drafts/` in JH-48.8). `004` is idempotent; Compose has no `anon`/`authenticated`, so the REVOKE block is skipped.

### Verification SQL (run on Production after apply)

Lists every public base table: RLS flags, owner vs the connected role, and whether `anon` still has table privileges. Expected after apply: `relrowsecurity` true, `relforcerowsecurity` false, `anon_select`/`anon_insert`/`anon_update`/`anon_delete` false (or NULL if the `anon` role is absent). `current_user` should match `owner` (or be a superuser) — that is the owner-bypass assumption.

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

### Why not in-memory or Hobby WAF alone

Per-isolate memory counters are not shared across Vercel Fluid isolates, so a script can bypass them. Hobby WAF includes **1** rate-limit rule, fixed window **10s–10min**, keys IP/JA4 only — no daily window and no global embedding budget. See the JH-42 PR for doc URLs.
