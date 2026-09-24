# RCA — hosted Mechanic demo outage (2026-09-23/24)

**Status:** Historical / ops investigation. Not a product contract. Not a runbook that strangers must follow.  
**Scope:** Root-cause analysis only. No production fix in this change.  
**Audience:** Owner (Tom) deciding the restore approach. Safe for a public repo: no secrets, no interview strategy.  
**Probes:** 2026-09-24 00:56–00:57 UTC from an external Linux host.  
**Backlog id:** JH-17.

Markers used below:

| Marker | Meaning |
|--------|---------|
| **Verified** | Observed in this investigation (HTTP/DNS/git/source). |
| **Unverified** | Plausible, but not observed from this environment. |
| **Unknown** | Requires owner dashboard / private hub access. |

---

## 1. Executive answer

The static Next.js shell is still serving. Every path that needs Postgres is not.

**Definitive failure class (Verified):** the hosted app’s `DATABASE_URL` still points at Supabase pooler user `postgres.npliiuigpenkrqaewtdf`. The shared pooler accepts TCP, then returns Postgres `FATAL: (ENOTFOUND) tenant/user postgres.npliiuigpenkrqaewtdf not found`. Independently, the project API host `npliiuigpenkrqaewtdf.supabase.co` and direct DB host `db.npliiuigpenkrqaewtdf.supabase.co` are **NXDOMAIN** on public resolvers (1.1.1.1, 8.8.8.8).

That is **not** a Next.js regression, a wrong password, or a missing `vehicles` table. Those classes produce different errors (see §5).

**Most consistent subclass:** the Supabase project that Vercel still targets has been **deprovisioned or DNS-unpublished**. Owner dashboard is required to split:

1. **Deleted project** (official Supabase behavior: project URL gone, DNS cleaned up).
2. **Paused project whose public DNS was never republished** (community reports exist; dashboard would still show the ref).
3. **Stale project ref left in Vercel** after the 2026-08-24 rename / credential-refresh (old tenant gone, new tenant never written to Production env).

Keep-alive cannot fix this class. Pinging the app URL does not recreate a tenant.

---

## 2. Live symptoms (Verified)

Probed `https://mechanic-rag.vercel.app` on 2026-09-24 00:56–00:57 UTC.

| Request | Status | Body / notes |
|---------|--------|----------------|
| `GET /` | **200** | HTML shell. `x-vercel-cache: HIT`, `age: 2581452` (~29.9 days). `x-nextjs-prerender: 1`. Inferred last cache/deploy ≈ **2026-08-25 03:53 UTC** — minutes after the last `main` commit. |
| `GET /api/health` | **500** | Empty body (`content-length: 0`). `x-vercel-cache: MISS`. ~600 ms. Not the documented readiness JSON. |
| `GET /api/health?mode=live` | **200** | `{"status":"ok","mode":"liveness"}` — process is up. |
| `GET /api/vehicles` | **500** | `{"error":"(ENOTFOUND) tenant/user postgres.npliiuigpenkrqaewtdf not found"}` |
| `POST /api/ask` `{}` | **400** | `vehicle_id is required` (validation; no DB). |
| `POST /api/ask` `{"query":"…"}` | **400** | stub `{ query }` is retired. |
| `POST /api/ask` `{"vehicleId":"…","question":"…"}` | **400** | `vehicle_id is required` — camelCase is **not** accepted. |
| `POST /api/ask` `{"vehicle_id":"fixture:honda-s2000-demo","question":"What is the oil drain plug torque?"}` | **503** | `{"error":"Upstream dependency failure (database or internal)"}` |

UI consequence (Verified in source): `web/src/app/page.tsx` loads `/api/vehicles` on mount, surfaces the raw error as a “Vehicle list warning”, and still allows Ask against the hardcoded default `fixture:honda-s2000-demo`. Ask then fails 503. The page looks “up”; the product path is not.

README (Verified): root `README.md` still advertises a working live demo. That claim is **currently false**.

---

## 3. Timeline — what changed since it worked

All timestamps UTC unless noted. Git author dates are from `main` at `8eb5d59`.

| When | What | Marker |
|------|------|--------|
| 2026-08-01 | Public storefront / fixtures packaging on `main`. Architecture docs still describe **Compose Postgres only** and list hosted cloud DB as rejected. | Verified (git + `docs/ARCHITECTURE.md`) |
| 2026-08-24 22:40 | `bcd5174` — README live-demo link + weekly GitHub Action `demo-keepalive.yml` hitting `GET /api/health`. Commit message: any HTTP status is fine; intent is a Postgres round-trip to stay inside the free-tier ~7-day pause window. | Verified |
| 2026-08-24 22:51 | `c2e9b74` — empty commit: “trigger production redeploy after **project rename**”. | Verified (empty tree); **Unknown** whether Vercel project, Supabase project, or both. |
| 2026-08-24 23:00 | `f038438` — empty commit: “redeploy with database env configured”. | Verified |
| 2026-08-25 00:49 | `72cdce9` — **delete** `.github/workflows/demo-keepalive.yml`. Reason in commit: this repo is intentionally dormant; GitHub disables scheduled workflows after 60 days of inactivity; ping moved to the private hub repo at **daily** frequency. | Verified in this repo. Hub workflow contents: **Unknown** (private repo, 404 from this agent). |
| 2026-08-25 01:05 | `0735187` — empty commit: “pick up refreshed database credentials”. Matches historical owner note that DB password / Vercel env had to be reset. | Verified (empty tree). New password value: **not inspected** (and must not be). |
| 2026-08-25 01:15 | `82dc07a` — empty commit: “clear env-change redeploy notice”. | Verified |
| 2026-08-25 01:39–02:15 | Extractive lexical fallback, then Gemini hosted embeddings + generation when `GEMINI_API_KEY` is set. | Verified |
| 2026-08-25 02:24–03:29 | Gemini model default `gemini-3.6-flash`, live-vs-local README table, recorded demo GIF, docs honesty lines. Last commit `8eb5d59` at 03:29. | Verified |
| ~2026-08-25 03:53 | Last inferred Vercel static deploy (CDN `age` ≈ 29.9 days on 2026-09-24 00:57). | Verified (header math) |
| ~2026-08-25 | Gemini generative path + extractive fallback reported live. | **Unverified** here; consistent with commits + owner prior ops. |
| ~2026-09-01 (approx.) | If no real Postgres traffic after Aug 25, free-tier inactivity pause becomes eligible (~7 days). | **Unverified** date. Policy **Verified** from current Supabase free-tier pausing docs. |
| 2026-09-23/24 CT | External probes: shell 200, API DB paths failing with tenant-not-found / 500 / 503. | Verified |
| 2026-09-24 00:57 UTC | Project API + direct DB hostnames NXDOMAIN. Shared regional pooler hostnames still resolve. | Verified |

No commits and no evidence of a Vercel redeploy after 2026-08-25. The **application build did not change** in the outage window. The **dependency behind `DATABASE_URL` did**.

---

## 4. How the hosted path actually talks to Postgres

### 4.1 Env and client (Verified)

`web/src/server/db.ts` builds a `pg` `Pool` from `process.env.DATABASE_URL`, falling back to Compose `postgres://mechanic:mechanic@localhost:5433/mechanic_rag`. Timeout default `DB_TIMEOUT_MS=5000` (health readiness uses 3000).

There is no `supabase-js` client on the ask/vehicles/health path. Hosted mode is “Vercel serverless + `pg` + a Postgres URL”. Local clone mode is Compose on host port **5433**.

`.env.example` documents only the Compose URL. Production URL shape is **Unknown** (must not be copied into git). The live error proves the Production URL uses Supabase pooler username form `postgres.<project-ref>` with ref `npliiuigpenkrqaewtdf`.

### 4.2 Catalog — `GET /api/vehicles`

`listAskableVehicles()` runs:

```sql
SELECT vehicle_id FROM vehicles
WHERE vehicle_id LIKE 'fixture:%' OR vehicle_id LIKE 'cat:%'
```

On throw, `web/src/app/api/vehicles/route.ts` returns **500** and **`err.message` verbatim**. That is why the public JSON contains the pooler FATAL (and the project ref).

### 4.3 Health — `GET /api/health`

Documented contract (`docs/ARCHITECTURE.md` §9.1): liveness `?mode=live` → 200; readiness (default) checks Postgres + Ollama; not ready → non-200 JSON.

Live default health is **500 empty**, not `503 {"status":"not_ready",…}`. Cause (Verified in source):

```39:51:web/src/server/db.ts
export async function checkPostgres(timeoutMs = 3000): Promise<boolean> {
  const client = await getPool().connect();
  try {
    const timer = new Promise<never>((_, reject) =>
      setTimeout(() => reject(new Error('db timeout')), timeoutMs),
    );
    await Promise.race([client.query('SELECT 1'), timer]);
    return true;
  } catch {
    return false;
  } finally {
    client.release();
  }
}
```

`Pool.connect()` is **outside** the `try`. A pooler FATAL / DNS-style connect error throws out of `checkPostgres`. The health route has no `try/catch`. Next/Vercel then returns an empty 500.

Even when Postgres works, default readiness also requires **Ollama** (`checkOllama` → `127.0.0.1:11434` unless `OLLAMA_BASE_URL` is set). Hosted demo uses Gemini, not Ollama. So a healthy hosted DB would still yield **503 not_ready** (`postgres: true`, `ollama: false`) unless someone pointed Ollama at a reachable URL. The original keep-alive comment (“any status is fine”) was written around this.

`?mode=live` does **not** touch Postgres. A keep-alive that only hits liveness or the static `/` cannot prevent a free-tier pause.

### 4.4 Ask — `POST /api/ask`

Canonical field names (Verified): `vehicle_id`, `question`. Contract schema: `contracts/ask_request.schema.json`. UI sends snake_case. `vehicleId` is rejected with 400 before any DB call.

First DB call in `handleAsk` is `vehicleExists` (`SELECT 1 FROM vehicles …`). Connect/query failure is caught and mapped to **503** `Upstream dependency failure (database or internal)` — sanitized, unlike `/api/vehicles`.

If the DB were up and embeddings failed, ask degrades to lexical extractive answers (Aug 25). That degrade **never runs** when `vehicles` cannot be queried.

`docs/api_contracts.md` (Aug 2025) is stale and omits `vehicle_id`. Architecture already marks it non-authoritative.

### 4.5 Schema and fixture ingest (Verified)

Authority: `db/migrations/001_init.sql` (`vehicles`, `documents`, `chunks` + pgvector 768, `index_state`). `supabase/**` and `db/schema.sql` are obsolete per Architecture.

Ingest: `mecharag ingest --source fixtures` → `mecharag/ingest_cmd.py` → `mecharag/db_upsert.py` (transactional upsert of vehicle + document + chunks). Fixture id: `fixture:honda-s2000-demo` (`fixtures/honda_s2000_demo/`).

A **new or empty** restored database will not serve the demo until migrations + fixture ingest run against the **same** `DATABASE_URL` the app uses. That is a later failure class; we are not there yet.

### 4.6 Keep-alive as implemented (Verified in this repo; hub Unknown)

Removed workflow (exact body from `bcd5174`):

```yaml
# Mondays 14:00 UTC — intended to stay inside the 7-day pause window
curl -s -o /dev/null -w "%{http_code}" --max-time 30 \
  https://mechanic-rag.vercel.app/api/health || true
# Any status is fine — the goal is a Postgres round-trip, not readiness=200.
```

What that ping can do:

- If it hits **default** `/api/health` and `connect()` succeeds, `SELECT 1` runs even when the response is 503 (Ollama). That **can** count as DB activity.
- If `connect()` throws (today’s class), health is 500 empty. **No SQL.** Does not unpause or recreate a tenant.
- If a worker/action only hits `/` or `?mode=live`, it never touches Postgres. The static `/` is a 30-day CDN HIT.

Cloudflare Worker `mechanic-keepalive` is **not in this repository**. Whether it exists, what URL it hits, and whether it still runs: **Unknown**.

Private hub daily Action: **Unknown** (repo not readable from this agent). Even if it still curls `/api/health` daily, it cannot restore a missing tenant.

---

## 5. Hypothesis verdicts

| Hypothesis | Verdict | Evidence |
|------------|---------|----------|
| Tenant `npliiuigpenkrqaewtdf` paused / deleted / renamed / credentials rotated out from under Vercel | **Partially verified.** Live app still uses that ref. Pooler says tenant not found. API + `db.` hosts are NXDOMAIN. **Pause vs delete vs stale-ref** needs the Supabase dashboard. | Live JSON + DNS + Aug 24 empty “rename” / “refreshed credentials” commits |
| Keep-alive (CF Worker / hub Action) only pings the app URL and cannot prevent pause **or** tenant deletion | **Verified** for deletion. **Verified in design** for pause: homepage / liveness do not query Postgres; a successful default `/api/health` *can* query Postgres but cannot resume a paused project. Hub/CF implementation: **Unknown**. | Source + removed workflow + live 500 on health |
| Schema/fixtures missing after restore (prior “missing `vehicles` relation”) | **Rejected as current class.** Missing relation is `relation "vehicles" does not exist` after a successful login. We never get a SQL session. May reappear **after** a restore of an empty project. | Live error string + `listAskableVehicles` SQL |
| Vercel `DATABASE_URL` / pooler URL drift | **Possible subclass, not proven.** Wrong pooler region/`aws-N` also yields tenant-not-found. That usually still leaves `<ref>.supabase.co` resolvable. NXDOMAIN argues the ref itself is gone or unpublished, not merely the wrong `aws-0` vs `aws-1` host. | Public Supavisor behavior + our NXDOMAIN |
| Free-tier brittleness: demo depends on always-on external DB with no durable SLO | **Verified as architecture.** README sells a live demo; Architecture still says Compose-only / hosted cloud DB rejected; keep-alive was moved out of this dormant repo; no in-repo monitor, no paid SKU, no failover. | README vs Architecture vs git |
| App code broke in September | **Rejected.** Last deploy ≈ last Aug 25 commit. Validation and liveness still match source. | CDN age + git + live 400/200 contracts |
| Wrong DB password | **Rejected as current class.** Typical FATAL is password authentication failed. API hostname would still resolve. | Error taxonomy + NXDOMAIN |
| Node could not resolve the **pooler hostname** | **Rejected.** Shared `*.pooler.supabase.com` names resolve. The `(ENOTFOUND)` token is the **Supavisor tenant lookup** code inside a Postgres FATAL, not `getaddrinfo` of the TCP host. | Live 600 ms 500 + public pooler DNS |
| Gemini / Ollama / CE caused the outage | **Rejected as primary.** Vehicles list never calls those providers. | `listAskableVehicles` |

---

## 6. Discriminating pause vs deleted vs bad host vs password vs missing schema

What we can say without dashboards:

| Class | What we would see | This outage |
|-------|-------------------|-------------|
| **Wrong password** | Fast FATAL `password authentication failed`. `<ref>.supabase.co` still resolves. REST often `401` missing API key. | No |
| **Wrong pooler cluster / region** | Fast FATAL tenant/user not found. **`<ref>.supabase.co` usually still resolves.** | Tenant-not-found yes; NXDOMAIN argues against “project healthy, wrong `aws-N`” |
| **Paused compute, DNS intact** | Dashboard shows Paused. API host often still resolves; REST may be paused/5xx; pooler may also say tenant not found. | API host **does not** resolve — weaker fit, not impossible if pause unpublished DNS |
| **Deleted / deprovisioned project** | Official: project URL inaccessible; DNS cleaned up (up to 24h). Pooler tenant gone. Vercel env unchanged. | **Best fit to public evidence** |
| **Stale ref in Vercel** (new project created, old ref left in env) | Same public signals as deleted old ref. Dashboard shows a *different* live project. | **Unknown** — owner must compare dashboard refs to the live error ref |
| **Missing schema** | Connect + auth succeed; `relation "vehicles" does not exist`. | No |
| **App / Next crash unrelated to DB** | Health liveness would likely fail too; vehicles error would not be a pooler FATAL. | No |

**Owner-only discriminator (do not invent credentials):**

1. Open [Supabase Dashboard](https://supabase.com/dashboard) → organization project list.
2. Search project ref `npliiuigpenkrqaewtdf` (also check recently deleted / paused).
3. Record one of: **Active / Paused / Missing**. That single observation splits the subclass.
4. If a *different* project is the intended demo, compare its ref to the live `/api/vehicles` error. Do not paste passwords or full `DATABASE_URL`s into tickets.

Public REST check we ran: `https://npliiuigpenkrqaewtdf.supabase.co` does not resolve, so we cannot use “401 vs paused page” as a discriminator.

---

## 7. Brittleness assessment (portfolio honesty)

This is a senior-engineer portfolio demo whose **front door is a URL**. The failure mode is not subtle ranking drift. It is “page loads, product 500s.”

What keeps breaking this:

1. **No durable store SLO.** Free-tier Supabase pauses after ~7 days of low DB activity and can later be deleted; restore window is documented as up to 1 year while paused, **not** after delete. The demo has no paid SKU, no second region, no local snapshot in Vercel.
2. **Keep-alive is the wrong control for the failure class.** At best it is a best-effort `SELECT 1` through an HTTP hop. It cannot resume pause, cannot recreate a tenant, cannot repair schema, cannot update Vercel env. GitHub will disable schedules on this repo after 60 days of inactivity — that is why the Action was moved. The hub/CF implementations are not reviewable from this clone.
3. **Health contract does not match hosted reality.** Readiness requires Ollama. Hosted path uses Gemini. `checkPostgres` throws before returning `false`. Keep-alive authors already treated “any status” as success, so a red 500 looks the same as a useful 503.
4. **Error surfaces are inconsistent.** Vehicles leaks infrastructure text (project ref). Ask sanitizes to 503. Health is empty 500. Reviewers see a broken picker and a generic ask failure, not one coherent “store down” state.
5. **Docs disagree with the deploy.** Architecture: Compose only, hosted cloud DB rejected. README: live Vercel demo with Gemini. That split is how env, keep-alive, and pause policy escaped the documented system.
6. **Restore is not idempotent from git.** Schema lives in `db/migrations/`; corpus lives in `mecharag ingest`. A new empty project is a blank Postgres. There is no in-repo “deploy demo” job that migrates + ingests + smoke-tests Production.
7. **Credential/env is a hidden moving part.** Aug 24 required empty commits to force Vercel to pick up DB env. Password rotation and project rename are operator memory, not a checked-in contract.
8. **Static CDN success hides API failure.** 30-day cache HIT on `/` is healthy HTML over a dead store. Recruiter clicks look like a working app until the dropdown warning.

This is acceptable as a **local clone** story. It is a weak SLO for a **linked live demo**.

---

## 8. Options to restore (Tom decides; no code in this PR)

### Option A — Resume / reuse the existing project if it still exists

**When:** Dashboard shows `npliiuigpenkrqaewtdf` as Paused (or Active with broken DNS).

Steps (operator): Resume if paused; copy **current** Connect → Session or Transaction pooler string; compare host + user (not password) to Vercel Production `DATABASE_URL`; update env + redeploy if the pooler host/`aws-N` changed; `GET /api/vehicles` must return `fixture:honda-s2000-demo` before claiming restore.

**Tradeoffs:** Fastest if data is intact. Still free-tier. Pause can recur in ~7 days. DNS-after-resume bugs are documented in the wild.

### Option B — New free project + migrate + ingest + re-point Vercel

**When:** Ref is missing / deleted, or resume is unclean.

Steps: Create project; apply `db/migrations/` (001 + 002 as needed); `mecharag ingest --source fixtures` with hosted embedding settings matching the live column (`gemini-embedding-001` @ 768 if that is still the Production corpus); set Vercel `DATABASE_URL` from the **dashboard** string (do not reuse a guessed `aws-0-…` host); redeploy; smoke vehicles + ask.

**Tradeoffs:** Clean ref. **Fixture re-embed required** if the old vectors are gone. Same pause risk. Easy to get tenant-not-found again by guessing the pooler cluster.

### Option C — Durable hosted store (recommended if the README keeps a live URL)

Replace free-tier pauseable compute with an always-on SKU (Supabase Pro, Neon paid, or other always-on Postgres Tom already trusts). Pair with:

- Health that matches hosted dependencies (Postgres + Gemini, not Ollama).
- `checkPostgres` that cannot throw past the route.
- Vehicles/ask errors that do not leak pooler internals.
- An automated smoke (vehicles contains fixture; ask 200 `answered` or honest `insufficient_evidence`) on a schedule that **alerts**, not a curl that ignores status.
- README honesty: if the demo is down, the link says so.

**Tradeoffs:** Cost and a real env contract. Stops the “works in August, 500 in September” loop. Still needs migrations + ingest on first provision.

**Not recommended:** A vibe patch that makes `/api/health` always 200 or stubs `/api/vehicles` without a store. That hides the failure class.

**Interim honesty (can ship without a store):** README live-demo line marked unavailable until A/B/C is done. That is a docs honesty fix, not a restore.

---

## 9. Recommended next step (TDD / context → owner-approved fix)

Do **not** implement until Tom picks A, B, or C and answers §12.

### 9.1 Characterization tests first (no Production credentials)

1. **Connect-error taxonomy** around `getPool().connect()` / `checkPostgres`:
   - pooler FATAL tenant-not-found → readiness `false`, HTTP **503 JSON**, no throw, no raw FATAL in `/api/vehicles`.
   - password authentication failed → same wrapper, different internal reason.
   - `relation "vehicles" does not exist` → distinct class (schema), not “tenant missing”.
2. **Ask validation** (already true; keep pinned): `vehicleId` ≠ `vehicle_id`; `{query}` retired; happy path uses `vehicle_id`.
3. **Hosted readiness:** when Gemini is the serving path, readiness must not require Ollama. Local Compose path may still check both.

### 9.2 After owner restore (integration / live smoke)

4. `GET /api/vehicles` → 200 and includes `fixture:honda-s2000-demo`.
5. `POST /api/ask` with that vehicle + the oil-drain-plug question → 200 and `outcome` is `answered` (or documented extractive), with ≥1 citation.
6. `GET /api/health` default → 200 readiness JSON **or** 503 with `checks.postgres` boolean, never empty 500.
7. Repeat 4–6 after a cold interval if keep-alive remains part of the design.

### 9.3 Fix approach once Tom picks

| Pick | Code/docs change | Ops change |
|------|------------------|------------|
| A | Optional: health/error hygiene from 9.1 so the next pause is diagnosable. | Resume + env verify + vehicles smoke. |
| B | Same hygiene. Do not commit the new URL. | New project, migrate, ingest, env, smoke. |
| C | Hygiene + hosted health + alert smoke. README SLO sentence. | Paid/always-on provision. |

Keep the public clone path on Compose. Do not make strangers depend on Supabase.

---

## 10. Acceptance criteria for the eventual fix (JH-17)

Align the later implementation PR to all of the following:

1. **Product path:** `https://mechanic-rag.vercel.app` can select `fixture:honda-s2000-demo` from `/api/vehicles` (200) and complete an ask with citations (200, not 503).
2. **Failure class closed:** live `/api/vehicles` no longer returns tenant-not-found for the configured Production URL. If the store is down, responses are a single coherent non-200 JSON class — not empty 500 + leaked FATAL.
3. **Health matches host:** default `/api/health` does not 500 on connect failure; hosted readiness does not demand Ollama.
4. **README is true:** live-demo sentence is accurate (working **or** explicitly unavailable).
5. **Ask contract:** request field remains `vehicle_id` (document if any alias is added).
6. **Durability decision recorded:** A (pause-prone resume), B (new free project), or C (always-on). Keep-alive alone is not an SLO.
7. **No secrets** in git or PR text. Fixture ingest + migrations documented as the restore path for empty DBs.
8. **No merge/deploy of a fake-200.**

---

## 11. Operator checklist for Tom (dashboards only)

Do these in order. Stop when the subclass is known.

**Supabase**

1. Dashboard → find ref `npliiuigpenkrqaewtdf`.
2. Write down: Active / Paused / Missing. If Missing, list any other Mechanic project refs (do not paste connection strings).
3. If Paused: Resume. Wait until Healthy. Re-check `dig npliiuigpenkrqaewtdf.supabase.co A` — must not stay NXDOMAIN.
4. Connect → copy pooler **host**, **port**, **user** (user should look like `postgres.<ref>`). Compare to Vercel Production `DATABASE_URL` host/user only.
5. Optional: Table Editor → does `vehicles` exist and contain `fixture:honda-s2000-demo`? If the project is empty, that is the schema/fixture class from prior Aug notes — run migrations + `mecharag ingest --source fixtures` against that URL locally. Do not commit the URL.
6. Check owner email for pause warning / pause confirmation / deletion mail since ~2026-08-25.

**Vercel**

7. Project for `mechanic-rag.vercel.app` → Settings → Environment Variables → Production `DATABASE_URL` present? Host/user match dashboard? `GEMINI_API_KEY` still set? (Yes/no only.)
8. Deployments: latest Production timestamp. Expect ~2026-08-25 unless someone deployed outside git.
9. After any env change: Redeploy Production (Aug 24 used empty commits for this; the dashboard Redeploy is enough).

**Keep-alive (private hub / Cloudflare)**

10. Confirm whether the daily Action and `mechanic-keepalive` Worker still exist, which URL they hit (`/` vs `/api/health` vs `/api/health?mode=live`), and last success time. **Unknown** to this investigation.

**Smoke (public, no secrets)**

11. `curl -sS -D- https://mechanic-rag.vercel.app/api/vehicles`
12. `curl -sS https://mechanic-rag.vercel.app/api/health`
13. `curl -sS -X POST https://mechanic-rag.vercel.app/api/ask -H 'content-type: application/json' -d '{"vehicle_id":"fixture:honda-s2000-demo","question":"What is the oil drain plug torque?"}'`

---

## 12. Open questions for Tom

1. In the Supabase org, is `npliiuigpenkrqaewtdf` **Active, Paused, or gone**?
2. Did “project rename” on 2026-08-24 create a **new** Supabase project (new ref) while Vercel kept the old URL?
3. After the password refresh, was Production env updated on all environments (Production vs Preview)?
4. What does the hub daily Action actually curl, and when did it last run?
5. Does the Cloudflare Worker still exist, and does it hit a route that opens Postgres?
6. Any pause/deletion emails since Aug 25?
7. Is the README live URL a **must-keep** recruiter door (then prefer Option C), or is local clone enough (then A/B or an honesty line is enough)?
8. If the project is deleted, is there a downloadable backup, or is fixture re-ingest the recovery plan?
9. Should `/api/vehicles` stop returning raw driver messages even before restore? (Hygiene-only; does not bring the demo back.)
10. JH-17 written AC — confirm or amend §10. The issue body was not in this public repo.

---

## 13. What this investigation did not do

- No Production env read, no password use, no `psql` to the pooler.
- No change to Vercel, Supabase, Cloudflare, or the hub repo.
- No implementation, merge, or deploy.
- Factory issue pages were not readable from this agent (tool error). Private hub repo was 404.

---

## 14. Source map

| Path | Role |
|------|------|
| `web/src/server/db.ts` | `DATABASE_URL` pool; `checkPostgres` throw-on-connect |
| `web/src/app/api/vehicles/route.ts` | 500 + raw `err.message` |
| `web/src/app/api/health/route.ts` | liveness vs readiness; no connect-error guard |
| `web/src/app/api/ask/route.ts` + `web/src/server/ask.ts` | validation; 503 on DB failure |
| `web/src/server/ask_request.ts` | `vehicle_id` only |
| `web/src/server/retrievers.ts` | `listAskableVehicles` / `vehicleExists` |
| `web/src/server/providers.ts` | Gemini if `GEMINI_API_KEY` |
| `web/src/app/page.tsx` | client fetch; default fixture id |
| `db/migrations/001_init.sql` | schema authority |
| `mecharag/ingest_cmd.py`, `mecharag/db_upsert.py` | fixture restore path |
| `.env.example` | local Compose URL only |
| `README.md` | live-demo claim (currently false) |
| `docs/ARCHITECTURE.md` | Compose-only / hosted DB rejected |
| git `bcd5174`, `72cdce9` | keep-alive add + relocate |
