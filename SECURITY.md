# Security policy

## Reporting a vulnerability

Prefer GitHub private vulnerability reporting when this repository has it enabled (Security tab → **Report a vulnerability**).

If that path is not available, open a public GitHub issue. Describe the problem without secrets: no tokens, API keys, passwords, connection strings, or credentials.

Do not paste secrets from this demo or from any other system.

## Scope

**In scope**

- This repository (`Alpha-W0lf/mechanic_rag`)
- The public hosted demo at [mechanic-rag.vercel.app](https://mechanic-rag.vercel.app)

**Out of scope**

- Secrets or credentials from other systems — do not submit them here
- Issues that are only about someone else's infrastructure

## Production

The hosted demo (Vercel, Supabase, Gemini) answers from the complete Honda S2000 service manual, owner's manual and wiring diagrams (`cat:2003-honda-s2000`). The public clone and its fixture vehicle (`fixture:honda-s2000-demo`) use synthetic fixtures only.

## Design trade-offs

The hosted demo runs on free tiers. These choices trade some protection for availability or simplicity:

1. **Fail-open rate limiter:** `POST /api/ask` rate limiting uses application-level Postgres buckets (`ask_rate_buckets`). If the table is missing or the store errors, the limiter deliberately fails open (`warning: fail_open`) so that temporary store glitches do not convert into a complete public demo outage or fail the daily probe. The residual risk is that abusive traffic during a store outage could spend Gemini embedding quota up to daily provider limits. Paid external WAF / DDoS mitigation is not deployed on this tier.
2. **Postgres TLS without CA verification:** hosted connections (`web/src/server/db.ts`) use TLS with `ssl: { rejectUnauthorized: false }`, the `sslmode=require` equivalent. Traffic to Supabase is encrypted, but the server certificate is not checked, because Supabase's root CA is not in Node's default trust store inside the serverless function. Bundling that CA and setting `rejectUnauthorized: true` turns verification on.
3. **Secret hygiene:** IP hashing uses `HMAC-SHA256(ASK_RATE_LIMIT_SALT, ip)`. Salt values are never logged, printed, or returned in diagnostic outputs (presence-only logging). Raw IPs are never stored in the database.
