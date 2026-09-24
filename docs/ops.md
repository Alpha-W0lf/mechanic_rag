# Ops notes

Short operational policy. Not a monitor implementation (that is a separate ticket).

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

**Cited-Ask monitor lives in the hub.** [Alpha-W0lf/second_brain](https://github.com/Alpha-W0lf/second_brain) `.github/workflows/mechanic-ask-monitor.yml` (JH-41) is the scheduled fixture Ask probe (every 6 hours + `workflow_dispatch`). Do not add a schedule here to “cover” that. Local `/api/health` remains the clone readiness check.

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

### Why not in-memory or Hobby WAF alone

Per-isolate memory counters are not shared across Vercel Fluid isolates, so a script can bypass them. Hobby WAF includes **1** rate-limit rule, fixed window **10s–10min**, keys IP/JA4 only — no daily window and no global embedding budget. See the JH-42 PR for doc URLs.
