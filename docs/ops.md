# Ops notes

Scoring and operator policy for the hosted demo. The synthetic Ask monitor itself (JH-41) lives in a private ops repo and is not implemented here.

## CI (this repo)

GitHub Actions workflow: [`.github/workflows/ci.yml`](../.github/workflows/ci.yml). Two jobs on `ubuntu-latest`, in parallel, PR + push to `main`. Later steps in a job use `if: success() || failure()` so a lint failure still records typecheck/Vitest (and fail-closed still records pytest). The job stays red. No paid runners. No scheduled Production smoke here.

| Job | Gate | What a green run proves |
|---|---|---|
| `web` | `pnpm lint` (`next lint --max-warnings 0`) | ESLint is clean. Warnings and errors fail the gate (no `\|\| true`, no `continue-on-error`). |
| `web` | `pnpm typecheck` (`tsc --noEmit`) | TypeScript is clean under `web/tsconfig.json` (app + tests). Pre-existing test mock typing was fixed so this gate is honest — not silenced. Injectable env helpers take `NodeJS.Dict<string>` (type-only; same runtime). |
| `web` | `pnpm test` (`vitest run`) | Existing Vitest unit tests pass. |
| `web` | `pnpm build` | Next.js production compile succeeds. |
| `python` | `public_fail_closed.py fixtures` | Public `fixtures/` has no OEM PDFs, no `private_oem` / `private_gold` path tokens, no forbidden `rights_class`. Fail-closed. |
| `python` | `pytest -m "not integration and not slow"` | Fast unit tests for `mecharag/` + `scripts/` that need **no** network, Ollama, or Postgres. |

**Python pin:** `3.13` (same as [`docs/dev_setup.md`](dev_setup.md) / [`.python-version`](../.python-version)). `pyproject.toml` allows `>=3.11`. Dependencies are cached.

**Markers** (see `[tool.pytest.ini_options]` in `pyproject.toml`):

| Mark | Why it is out of this CI subset |
|---|---|
| `integration` | Needs the sibling `second_brain` program fixtures, a live Vehicle Gold emit, or a running Compose/Next/Ollama stack. Those trees are not in this public clone. |
| `slow` | OEM PDF corpus under gitignored `rag_input/`, or anything that would call network / Ollama / Postgres. |

Local full suite (when you have the sibling repo / live emit): `pytest` from repo root. Tests skip with a reason when those trees are absent; CI **deselects** them so a missing sibling is not a silent skip of an intended gate. `tests/test_parser.py` and `tests/test_chunking.py` are **collect-ignored** (legacy OEM PDF smokes; they import `google.genai` from the `legacy` extra).

**Not in this repo's CI (by design):**

- Full eval suite (`mecharag eval --golden evals/`).
- Production / hosted smoke (`POST /api/ask` against the live demo).
- A scheduled workflow. This clone is dormant by design; GitHub disables schedules on inactive repos.

**Cited-Ask monitor (JH-41)** lives in a private ops repo, not this one. It is a daily synthetic fixture Ask; failures and degraded results open GitHub issues. Do not add a schedule here to cover that. Scoring is in the Ask monitor policy section below. Local `/api/health` remains the clone readiness check.

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

## Ask monitor policy

A daily synthetic Ask monitor (JH-41, private ops repo) scores hosted Ask with this table and opens a GitHub issue on **fail**. This repository does not contain that workflow.

Score a hosted Ask probe as follows:

| Result | Score |
|---|---|
| `outcome: "answered"` (full generated answer) | **pass** |
| `outcome: "degraded"` with **≥1 citation** (generator or embedding) | **degraded pass** (warn) |
| HTTP error, `error_class` without a degraded body, or degraded with zero citations | **fail** |

A degraded 200 is still useful: extractive manual excerpts plus clickable citations. It is not a full Gemini answer and must not be scored as a silent pass.

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

### Local Compose

The limiter uses the same `DATABASE_URL` / pool. Fresh Compose volumes load `003_ask_rate_limit.sql` from `docker-entrypoint-initdb.d`. Existing volumes: `./scripts/migrate.sh`. To disable locally (no store calls): `ASK_RATE_LIMIT_DISABLED=1` in `web/.env.local`.

## Supabase Data API lock (JH-52)

Supabase PostgREST exposes every `public` table to the project's `anon` / `authenticated` keys unless RLS is on and/or those roles are revoked. Before this lock, Production `vehicles`, `documents`, `chunks`, `index_state`, and `chunk_image_embeddings` had RLS **off** and `anon` could `SELECT` (verified 2026-09-23 CT). `ask_rate_buckets` was already locked in `003_ask_rate_limit.sql`.

**Product path is unchanged.** Next.js uses `pg` + `DATABASE_URL` (`web/src/server/db.ts`). Ingest (`mecharag ingest`, `mecharag embed-images`) uses `psycopg` + the same URL. Neither talks to PostgREST or supabase-js. Postgres table owners bypass RLS unless `FORCE ROW LEVEL SECURITY` — this migration does **not** FORCE. Assumption: the `DATABASE_URL` role owns (or is superuser for) the public tables it created. Confirm with the snippet below before applying on Production.

Leftover `scripts/ingest/ingest.py` and `scripts/deploy/upload_assets.py` still call supabase-js with `SUPABASE_SERVICE_ROLE_KEY`. Those are **not** product paths (ARCHITECTURE: stale). `service_role` bypasses RLS; they would not break if someone still ran them. They are not used by Ask.

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

`docker-compose.yml` initdb currently mounts `001` and `003` only (pre-existing: `002` is also unmounted). Fresh volumes still need the `psql -f` above, or `./scripts/migrate.sh`. `004` is idempotent; Compose has no `anon`/`authenticated`, so the REVOKE block is skipped.

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
