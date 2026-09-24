# Ops notes

Short operational policy. Not a monitor implementation (that is a separate ticket).

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

Change a ceiling by setting the env var on Vercel and redeploying. Non-positive or non-numeric values fall back to the default. The 6-hourly synthetic Ask monitor is 4 requests/day from rotating IPs — well under every ceiling; no IP allowlist.

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

Why fail-open: Production apply is operator-owned after review; a missing table or limiter-DB hiccup must not turn the demo into a 429 outage (and must not fail the 6-hourly monitor). The cost is a window where abuse can still spend Gemini quota until the table exists or the store recovers. Ask itself still fails closed on real DB/Gemini errors.

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
