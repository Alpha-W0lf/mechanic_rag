# Security policy

## Reporting a vulnerability

Prefer GitHub private vulnerability reporting when this repository has it enabled (Security tab → **Report a vulnerability**).

If that path is not available, open a public GitHub issue. Describe the problem without secrets: no tokens, API keys, passwords, connection strings, or credentials.

Do not paste secrets from this demo or from any other system.

## Scope

**In scope**

- This repository (`Alpha-W0lf/mechanic_rag`)
- The public fixture demo at [mechanic-rag.vercel.app](https://mechanic-rag.vercel.app)

**Out of scope**

- Secrets or credentials from other systems — do not submit them here
- Issues that are only about someone else's infrastructure

## Production

The hosted demo uses free-tier Vercel, Supabase, and Gemini. It is a fixture demo (synthetic service docs), not a paid production shop tool.

## Security residual (free-tier)

This project operates within perpetual free-tier ceilings without paid HA or WAF appliances. Documented architectural residuals:

1. **Fail-open rate limiter:** `POST /api/ask` rate limiting uses application-level Postgres buckets (`ask_rate_buckets`). If the table is missing or the store errors, the limiter deliberately fails open (`warning: fail_open`) so that temporary store glitches do not convert into a complete public demo outage or fail the daily probe. The residual risk is that abusive traffic during a store outage could spend Gemini embedding quota up to daily provider limits. Paid external WAF / DDoS mitigation is not deployed on this tier.
2. **Postgres TLS without CA verification:** Hosted serverless connections (`web/src/server/db.ts`) configure Node `pg` with `ssl: { rejectUnauthorized: false }` (`sslmode=require` equivalent). Traffic is encrypted in transit to hosted Supabase, but server certificates are not pinned against a custom CA bundle inside serverless functions.
3. **Secret hygiene:** IP hashing uses `HMAC-SHA256(ASK_RATE_LIMIT_SALT, ip)`. Salt values are never logged, printed, or returned in diagnostic outputs (presence-only logging). Raw IPs are never stored in the database.
