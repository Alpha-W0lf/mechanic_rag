> **ARCHIVED** — moved under Workflow OS documentation sprawl reform.
> Do not treat this file as living SSOT.
> Living successor: `docs/VISION.md` · `docs/ARCHITECTURE.md` · living guides under `docs/dev_guides/`
> Batch: `2026-08_sprawl_c2c_mechanic_stage_notes`
> Date: 2026-08-13
# Ready-check note — Soft Adjust Next/Vercel Production bump (pass 164b)

**Date:** 2026-07-19  
**Repo:** `mechanic_rag`  
**Stage:** Ready check before code  
**Guide:** `docs/dev_guides/2026-07-19_dev_guide_soft_adjust_next_vercel_production_bump_pass164.md` (Write Met `a96dd12`)  
**Handoff:** `second_brain/docs/2026-07-19_spoke_mechanic_ready_next_vercel_bump_pass164b_handoff.md`  
**Locks:** **A** (Next + Vercel Production Soft Adjust) · **N1** (15.x ≥15.5.16, prefer latest 15.5.x) · **G1** (this Soft Adjust guide)  
**Prereqs:** CI modality Review Pass `8ee6fbc` · Prioritize `3ceff7a`  
**Tom authorize:** Ready checks + next steps  

## Call

**READY (Go) for Implement** under locks **A / N1 / G1**. **Do not Implement in this stage.** Tom authorized Ready-checks; hub may chain Implement after this Ready Go.

Implement (when started) bumps `next` + `eslint-config-next` from **15.4.6** → **≥15.5.16** (prefer latest 15.5.x, Ready snapshot **15.5.20**), proves local + GHA `pnpm run build`, attests **Vercel Production `state=success`** — not Guide 16 / PrivateGold reopen / silent Next 16.

### Implement readiness

| Track | Score | Why not 10 |
|-------|-------|------------|
| Soft Adjust Next/Vercel Production bump | **9.0 / 10** | (1) **Vercel outcome unknown until after bump** — guide correctly stops for human N2 if latest 15.5.x still vuln-gated; residual risk cannot be retired at Ready. (2) Soft: 15.4→15.5 may force small compile/peer fixes — blast limited but not zero. (3) Soft Implement command: bump **`next` as dependency** and **`eslint-config-next` as devDependency** (guide’s single `pnpm add … -D` line would wrongly demote `next` — use lockstep versions without `-D` on `next`). (4) Soft: exact patch may move past Write’s 15.5.20 — use Implement-time latest ≥15.5.16. |

**Overall:** **9.0 / 10** · **Go**

**Not inflated:** A/N1/G1 Tom-authorized; Write Met; current pin **15.4.6** verified; floor ≥15.5.16 + npm **15.5.20** verified; React 19 peers OK for 15.5.20; CI workflow builds `web/`; checklist unchecked; invent ban held.

---

## Alignment (guide ↔ live truth)

| Check | Status |
|-------|--------|
| Locks A / N1 / G1 | **Aligned** |
| Write Met | **Verified** — `a96dd12` |
| Current versions | **Verified** — `next@15.4.6` · `eslint-config-next@15.4.6` · `react@19.1.0` |
| Security floor | **Verified** — ≥15.5.16 (GHSA-492v-c6pp-mqqv); prefer 15.5.20 available |
| Peer React | **OK** — `next@15.5.20` accepts `react@^19` |
| CI path | **Verified** — `.github/workflows/ci.yml` → `web/` `pnpm run build` |
| Vercel Met definition | **Clear** — Production deployment `state=success` for bump SHA |
| Next 16 | **Out of first Met** — escalate only if N1 fails |
| Checklist unchecked | **Correct** for Ready |

---

## Soft Implement preferences (not Ready No-Go)

1. Target **latest 15.5.x ≥15.5.16** at Implement time (snapshot: **15.5.20**).  
2. Bump: `pnpm add next@15.5.20` and `pnpm add -D eslint-config-next@15.5.20` (or equivalent) — **do not** move `next` into `devDependencies`.  
3. Attest Vercel Production via `gh api …/deployments` + statuses (or dashboard) — require **success**, not build-complete-then-fail.  
4. If still vuln-gated on latest 15.5.x → document + stop for N2; **no** silent Next 16.

---

## Blast radius / rollback

**Blast:** `web/package.json` + `web/pnpm-lock.yaml` (+ forced compile fixes only). Not Soft Adjust PrivateGold, ask schema, ranking/CE, Guide 16.

**Rollback:** Revert bump commit; Production may remain vuln-blocked until re-bumped.

### Explicit non-claims (this stage)

- No Implement started  
- No Guide 16 · No dual-product Done · No friend/Ford · No Next 16 Met  

### QUALITY_STANDARD §5

Assumptions listed; spoke stayed in Ready slice; blast ≥2 angles; edges planned; numeric score + why not 10; no scope creep; verification plan in guide.

### Stop

Ready DoD Met (**Go 9.0/10**). Under Tom authorize + A/N1/G1, Implement may start on a dedicated Implement stage/handoff — **do not** silent-code from Ready alone.
