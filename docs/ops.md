# Ops notes

Scoring and operator policy for the hosted demo. The synthetic Ask monitor itself (JH-41) lives in a private ops repo and is not implemented here.

## Free-tier ceiling

Production is Vercel Hobby + Supabase Free + Gemini API free tier. Platform pause/delete and free-tier quota remain residual risks: a paused or deleted tenant, or a Gemini/Supabase quota exhaustion, can take the public demo down even when this repo is green. The external keep-alive (`GET /api/health?mode=db`) and the daily cited-Ask monitor (JH-41, private ops repo) mitigate inactivity pause and surface Ask failures; they are not high availability and this demo has no SLO.

`POST /api/ask` exports `maxDuration = 60` (Next.js App Router) so Vercel Hobby cannot leave Ask running past the same 60s generate/embed budget already used by `OLLAMA_TIMEOUT_MS`.

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

**Cited-Ask monitor (JH-41)** lives in a private ops repo, not this repo. It is the scheduled fixture Ask probe (once daily at 12:03 PM America/Chicago). Failures and degraded results open deduped GitHub issues. Do not add a schedule here to cover that. Scoring is in the Ask monitor policy section below. Public last-success and stranger verify steps: [Public Ask-monitor evidence (JH-66 / JH-48.6)](#public-ask-monitor-evidence-jh-66). Local `/api/health` remains the clone readiness check.

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
## Public Ask-monitor evidence (JH-66 / JH-48.6)

The daily scheduled monitor (JH-41) lives in a private ops repo and is not visible to public clones. This repository has no scheduled Production smoke (see [CI](#ci-this-repo)), but provides an on-demand Production Ask smoke probe via `workflow_dispatch` (JH-48.4) in [`.github/workflows/ci.yml`](../.github/workflows/ci.yml).

**Public workflow badges:**
- **CI (all pushes & PRs):** [![CI](https://github.com/Alpha-W0lf/mechanic_rag/actions/workflows/ci.yml/badge.svg)](https://github.com/Alpha-W0lf/mechanic_rag/actions/workflows/ci.yml) — proves web lint, typecheck, Vitest, build, Python fail-closed, and fast unit tests.
- **Production Ask Smoke (`workflow_dispatch` on-demand):** [![Production Ask Smoke](https://github.com/Alpha-W0lf/mechanic_rag/actions/workflows/ci.yml/badge.svg?event=workflow_dispatch)](https://github.com/Alpha-W0lf/mechanic_rag/actions/workflows/ci.yml) — reflects manual on-demand smoke probe runs testing live `POST https://mechanic-rag.vercel.app/api/ask`. (Note: GitHub returns `no status` until the workflow is manually dispatched on `main` via `workflow_dispatch`).

Do **not** invent private-repo badge URLs for the daily monitor; a stranger gets a 404.

| Signal | When | Score | What a stranger can check |
|---|---|---|---|
| Last private monitor run (**owner-attested**) | Passing as of **2026-09-24** (JH-66) | **pass** (owner) | **Unknown** from a public clone — the Actions run is not public |
| Last public smoke check (**owner-attested**) | **2026-09-24 19:21 UTC** (JH-48.6) | **pass** (`outcome: "answered"`, 2 citations) | Reproduce via `prod_ask_smoke.py`, GitHub Actions `workflow_dispatch`, or curl below |
| One-shot public cited-Ask probe | **2026-09-24 19:21:40 UTC** | **pass** (`outcome: "answered"`, 2 citations) | Repeat the curl below and score with the table above |

```json
{
  "probed_at": "2026-09-24T19:21:40Z",
  "url": "https://mechanic-rag.vercel.app/api/ask",
  "vehicle_id": "fixture:honda-s2000-demo",
  "question": "What is the oil drain plug torque?",
  "http_status": 200,
  "outcome": "answered",
  "citations_n": 2
}
```

**How a stranger verifies** (hosted Ask at probe time — **not** proof the daily job ran):

```bash
curl -sS -D- --max-time 90 -X POST "https://mechanic-rag.vercel.app/api/ask" \
  -H "content-type: application/json" \
  -d '{"vehicle_id":"fixture:honda-s2000-demo","question":"What is the oil drain plug torque?"}'
```

Alternatively, run the smoke probe script locally or via GitHub Actions `workflow_dispatch`:

```bash
python scripts/checks/prod_ask_smoke.py
```

**How to run via GitHub Actions (`workflow_dispatch`):**
1. Go to the [CI Workflow](https://github.com/Alpha-W0lf/mechanic_rag/actions/workflows/ci.yml) on GitHub.
2. If you have repo dispatch access (or in your own fork with network egress), select **Run workflow**, keep the default `ask_url`, and trigger the run.
3. The `prod_ask_smoke` job executes `prod_ask_smoke.py` and records pass / degraded pass / fail directly in public Actions logs.

Expect HTTP 200. Score `outcome` plus citations with the policy table. Storefront screenshots of the same fixture question live under [`docs/assets/demo/`](assets/demo/) — they show cited Ask in the UI, not the schedule. *(Note for repo owners: if archiving operator-run evidence, store screenshots under `docs/assets/ops/` with private org tokens, internal repo names, and runner IDs redacted; never invent fake screenshots or publish private monitor URLs).*

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
