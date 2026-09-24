# Hosted demo outage — Supabase Free inactivity pause (JH-17)

**Status:** Historical incident note for reviewers. Not a product contract and not a restore runbook.  
**When:** Last known healthy deploy ~2026-08-25. External probes 2026-09-24 00:56–00:57 UTC.  
**Audience:** Recruiters and GitHub reviewers. No secrets, project refs, keys, or connection strings.

| Marker | Meaning |
|--------|---------|
| **Verified** | Observed in the 2026-09-24 public probes, this repo’s git history, or a merged PR. |
| **Unverified** | Plausible, but not observed from a public clone. |

This file is a cleaned rewrite of an earlier JH-17 RCA that was never merged. That draft branched from 2026-08-25 `main`, conflicts with current `docs/README.md`, and repeated a Supabase project identifier that `/api/vehicles` had echoed in raw driver text. The identifier is omitted here on purpose.

## What failed

**Verified (2026-09-24):** [mechanic-rag.vercel.app](https://mechanic-rag.vercel.app) served a 200 HTML shell (CDN cache HIT; age implied a last static deploy on 2026-08-25). Every path that opened Postgres failed.

| Request | Result |
|---------|--------|
| `GET /api/health` | Empty HTTP 500 — not the documented readiness JSON |
| `GET /api/health?mode=live` | 200 — process up, no database |
| `GET /api/vehicles` | 500; body was a raw pooler FATAL (tenant not found) plus a project ref |
| `POST /api/ask` with `vehicle_id` | 503 sanitized “upstream dependency” |

Ask validation still worked (`vehicle_id` required; camelCase rejected). The page could look up while the catalog and Ask were dead.

**Verified (git):** the application tree did not change in the outage window. Last `main` work on 2026-08-25 added Gemini serving and then went quiet. The in-repo weekly keep-alive Action was deleted that same day because this repo is intentionally dormant (GitHub disables schedules after inactivity). A homepage or liveness ping never opens Postgres.

## Failure class

**Lesson this repo now documents:** Supabase Free pauses compute after inactivity. A recruiter-facing URL on that SKU goes dark unless something regularly opens Postgres.

**What public probes showed (Verified):** the hosted database URL still targeted a Supabase pooler tenant the pooler no longer knew. Shared pooler hostnames resolved; the project API hostname and direct DB hostname were NXDOMAIN. That is not a Next.js regression, a wrong password (those FATALS look different), or a missing `vehicles` table (that error appears only after a successful login).

**Pause vs delete vs stale env ref (Unverified at investigation time):** the original RCA could not split those three without the owner dashboard. Later work in this repo — especially the external keep-alive against `GET /api/health?mode=db` (JH-29) — treats the recurring risk as free-tier inactivity pause. This note follows that framing and does not restate project refs.

A keep-alive cannot recreate a missing tenant. It can only run `SELECT 1` when connect still works.

## What was stale in the original RCA

Do not copy the August/September investigation as current architecture. As of later merged PRs on this repo (**Verified**):

- Hosted health no longer requires Ollama when `GEMINI_API_KEY` is set. `GET /api/health?mode=db` is a Postgres-only probe; connect failures must not escape as an empty 500 (JH-29).
- Architecture describes Production as Vercel Hobby + Supabase Free + Gemini (JH-40). The 2026-07 “cloud DB rejected” line is historical clone policy, not a description of the live URL.
- Hosted generator default is `gemma-4-26b-a4b-it` with retry/backoff (JH-39), not the August `gemini-3.6-flash` default.
- `/api/vehicles` leaking raw driver text was real in that investigation. Do not re-publish the leaked token.

## What landed after

| Ticket | What changed (Verified from merged PRs unless noted) |
|--------|------------------------------------------------------|
| JH-29 (#2) | Hosted health contract + `GET /api/health?mode=db`. External Cloudflare Worker + GitHub Actions hit that probe. |
| JH-36 / JH-39 (#3) | Free-tier Gemini serving; JH-39 is the backoff (exponential + jitter, max 4 attempts) and current default `gemma-4-26b-a4b-it`. JH-36 is not named in this repo’s git history. |
| JH-37 (#5) | Hosted `pg.Pool` max 2, 5s idle, SSL, Vercel `attachDatabasePool`. |
| JH-46 (#6) | Public `error_class` taxonomy; HTTP 200 `outcome: "degraded"` with extractive excerpts when generate/embed fail after retries and ≥1 citation exists. |
| JH-41 | Daily synthetic Ask monitor in a private ops repo (12:03 PM America/Chicago). Scores hosted Ask per [`ops.md`](../ops.md) and opens deduped GitHub issues on fail or degraded. Public last-success / stranger verify: [`ops.md` JH-66](../ops.md#public-ask-monitor-evidence-jh-66). |
| JH-42 (#8) | Per hashed-IP 10/min + 100/day and global 800/day Ask shield. Pre-Ask HTTP 429. Fail-open if the limiter table is missing. |
| JH-52 (#10) | RLS (no FORCE, no policies) + revoke `anon` / `authenticated` on public tables so PostgREST cannot read the demo corpus. App stays `pg` + `DATABASE_URL`. |

A green keep-alive is **DB reachable after idle**. It is not cited Ask. Monitor scoring: [`docs/ops.md`](../ops.md).

## What this file does not contain

No project refs, pooler usernames, connection strings, keys, or private-repo URLs.
