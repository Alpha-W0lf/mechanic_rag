# Implement note — Soft Adjust Next/Vercel Production bump (pass 164b)

**Date:** 2026-07-19  
**Repo:** `mechanic_rag`  
**Guide:** `docs/dev_guides/2026-07-19_dev_guide_soft_adjust_next_vercel_production_bump_pass164.md`  
**Ready:** Go 9.0/10 `244f22b`  
**Locks:** A / N1 / G1  

## Versions landed

| Package | From | To |
|---------|------|-----|
| `next` (dependency) | 15.4.6 | **15.5.20** |
| `eslint-config-next` (devDependency) | 15.4.6 | **15.5.20** |

`next` remains a production dependency (not demoted to `-D`).

## Local verify

| Check | Result |
|-------|--------|
| `pnpm run build` | **Pass** — Next.js 15.5.20 compile + typecheck |
| Targeted vitest | **Pass** — 19 tests (ranking + Soft Adjust ask + ablation) |

## CI / Vercel

| Check | Result |
|-------|--------|
| GHA CI | **success** — https://github.com/Alpha-W0lf/mechanic_rag/actions/runs/29708023598 on `95ca4d7` |
| Vercel Production | **success** — deployment `5515177537` · SHA `95ca4d7` · “Deployment has completed” |

## Out of scope held

No Guide 16 · No PrivateGold reopen · No Next 16 · No Done claim
