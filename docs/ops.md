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

### Identity and storage

- Client key = `HMAC-SHA256(ASK_RATE_LIMIT_SALT, ip)`. Never store a raw IP. Table: `ask_rate_buckets(bucket_id, hit_count, expires_at)` in `db/migrations/003_ask_rate_limit.sql`.
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

### Why not in-memory or Hobby WAF alone

Per-isolate memory counters are not shared across Vercel Fluid isolates, so a script can bypass them. Hobby WAF includes **1** rate-limit rule, fixed window **10s–10min**, keys IP/JA4 only — no daily window and no global embedding budget. See the JH-42 PR for doc URLs.
