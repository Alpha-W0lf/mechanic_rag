# Soft Adjust — Next.js security bump + Vercel Production promote (pass 164)

**Date:** 2026-07-19  
**Repo:** `mechanic_rag`  
**Work item:** Soft Adjust — bump `next` / `eslint-config-next` to clear Vercel vulnerability gate; prove CI + **Vercel Production** deploy success  
**Stage that authored this:** Write-dev-guide (pass 164b)  
**Status:** **Implement Met** (`next@15.5.20`; GHA + Vercel Production success on `95ca4d7`)  
**Prerequisite:** CI modality Review Pass (`8ee6fbc`); Prioritize Met (`3ceff7a`) locks **A / N1 / G1**; Write Met `a96dd12`; Ready Go `244f22b`  
**Handoff (Write):** `second_brain/docs/2026-07-19_spoke_mechanic_write_next_vercel_bump_pass164b_handoff.md`  
**Handoff (Ready):** `second_brain/docs/2026-07-19_spoke_mechanic_ready_next_vercel_bump_pass164b_handoff.md`  
**Handoff (Implement):** `second_brain/docs/2026-07-19_spoke_mechanic_implement_next_vercel_bump_pass164b_handoff.md`  
**Ready note:** `docs/2026-07-19_ready_check_next_vercel_production_bump_pass164b_note.md`  
**Implement note:** `docs/2026-07-19_implement_next_vercel_production_bump_pass164b_note.md`  
**Prioritize:** `mechanic_rag/docs/2026-07-19_prioritize_next_after_ci_modality_pass164.md`  
**CI modality Review:** `docs/2026-07-19_review_ci_modality_type_conflict_pass164_note.md`  

**Tom / hub locks (pass 164 — do not reopen):**

| Pin | Lock |
|-----|------|
| Shape **(A)** | Soft Adjust **Next bump + Vercel Production promote** (deploy doneness) |
| Line **(N1)** | Stay on **15.x** → bump to **≥15.5.16** (prefer **latest 15.5.x** at Implement, e.g. **15.5.20** if still current) |
| Packaging **(G1)** | This thin Soft Adjust guide + Ready/Implement |
| Escalation | **Next 16.x ≥16.2.5** only if latest 15.5.x still fails Vercel Production promote |
| Product Soft Adjust | Guides 11–15 **closed** — do not reopen PrivateGold / ask Soft Adjust |
| Guide 16 / Done / friend / Ford | **Out** |

---

## Objective

Restore **deployed** Production doneness after CI modality Met:

1. Bump `web/package.json` `next` + `eslint-config-next` from **15.4.6** → **≥15.5.16** on 15.x (prefer latest 15.5.x).  
2. Refresh `web/pnpm-lock.yaml` via `pnpm install` in `web/`.  
3. Prove local `pnpm run build` + targeted vitest (retrieval + Soft Adjust ask + ablation).  
4. Push; prove GitHub Actions CI green (`pnpm run build`).  
5. Prove **Vercel Production deploy success** for the bump commit (state=success), not merely build-complete-then-fail.  
6. Stop. No Guide 16; no PrivateGold reopen; no Next 16 unless N1 fails.

**Success signal (after Implement):**  
- Locked Next version ≥15.5.16 (15.x) in `package.json` + lockfile.  
- Local + GHA build green.  
- Vercel Production deployment for bump SHA = **success** (attested).  
- Docs do not claim dual-product Done / friend Review Met.

**This Write does not Implement.**

---

## Learning notes (interview-portable)

1. **Build ≠ deploy** — CI compile success can coexist with a host promote gate (security policy).  
2. **Security floor as DoD** — Advisory patched versions are the minimum bar for Production, not optional polish.  
3. **Smallest line first** — Prefer patched minor/patch on the current major before a major framework jump.  
4. **Attest the promote** — Log deployment id / environment / state; “build finished” alone is insufficient.

---

## References (paths only)

- `mechanic_rag/docs/2026-07-19_prioritize_next_after_ci_modality_pass164.md`  
- `mechanic_rag/docs/2026-07-19_review_ci_modality_type_conflict_pass164_note.md`  
- `mechanic_rag/web/package.json` / `web/pnpm-lock.yaml`  
- `mechanic_rag/.github/workflows/ci.yml`  
- GHSA-492v-c6pp-mqqv / CVE-2026-44574 (Next middleware bypass; patched ≥15.5.16 on 15.x)  
- `second_brain/docs/workflow_os/rails/QUALITY_STANDARD.md`

---

## Architecture constraints (binding)

1. **N1 first** — 15.x ≥15.5.16 only at Met unless Vercel still rejects after latest 15.5.x.  
2. **Lockstep** — Bump `next` and `eslint-config-next` together.  
3. **No product reopen** — Do not change Soft Adjust PrivateGold, ask path, ranking, or CE.  
4. **No Guide 16 invent** — This Soft Adjust is deploy/security only.  
5. **React peers** — Keep React 19.x unless the bump forces a documented peer change (record if required).  
6. Prefer ≤300 lines for any new helper (none expected).

---

## Soft pins (binding for Ready / Implement)

| Pin | Locked default |
|-----|----------------|
| From | `next@15.4.6` · `eslint-config-next@15.4.6` |
| Floor | **≥15.5.16** |
| Prefer at Implement | Latest **15.5.x** on npm at Implement time (Write snapshot: **15.5.20** available) |
| Commands | `cd web && pnpm add next@<ver>` (dependency) + `pnpm add -D eslint-config-next@<ver>` (devDependency); refresh lockfile — **do not** demote `next` to `-D` |
| Local verify | `pnpm run build` + `npx vitest run` (ranking + Soft Adjust ask + ablation at minimum) |
| CI verify | GHA workflow success on bump commit |
| Vercel Met | Production deployment for bump SHA: **`state=success`** (gh api deployments/statuses or Vercel dashboard) |
| Fail cases | Still “Vulnerable version of Next.js” after bump → try latest 15.5.x; if still fail → document + escalate Decision N2 (16.x) — **out of first Met** |
| Docs | Thin version honesty only if claimed; no Done claim |
| Forbidden | Guide 16; PrivateGold reopen; friend/Ford; silent major jump to 16 without N1 evidence |

---

## Locked decisions (do not reopen)

| Decision | Lock |
|----------|------|
| Shape | **A** — Next + Vercel Production Soft Adjust |
| Line | **N1** — 15.x ≥15.5.16 |
| Packaging | **G1** — this Soft Adjust guide |
| Next 16 | Escape only if N1 fails Vercel |

---

## Acceptance criteria

- [x] `next` + `eslint-config-next` ≥15.5.16 (prefer latest 15.5.x) in `web/package.json` + lockfile  
- [x] Local `pnpm run build` green  
- [x] Targeted vitest green  
- [x] GHA CI green on bump commit  
- [x] Vercel Production deploy **success** attested for bump SHA  
- [x] No Guide 16 / PrivateGold / Done claim drift  

---

## Ordered step checklist

### Phase A — Anchor

- [x] **A1.** Confirm Prioritize A/N1/G1 + CI modality Pass.  
- [x] **A2.** Record current `next` / `eslint-config-next` versions.  
- [x] **A3.** Resolve target version: latest 15.5.x ≥15.5.16 at Implement time.  

### Phase B — Bump

- [x] **B1.** Bump both packages in `web/`; refresh lockfile.  
- [x] **B2.** Fix only compile/type errors forced by the bump (smallest).  
- [x] **B3.** No Soft Adjust PrivateGold / ranking / CE edits.  

### Phase C — Verify local + CI

- [x] **C1.** `pnpm run build` in `web/`.  
- [x] **C2.** Targeted vitest green.  
- [x] **C3.** Commit/push; wait for GHA CI success.  

### Phase D — Vercel Production

- [x] **D1.** Locate Production deployment for bump SHA.  
- [x] **D2.** Attest `state=success` (not failure with Next vuln message).  
- [x] **D3.** If still vuln-gated on latest 15.5.x → document gap; stop for human N2 lock (do not silent-jump to 16).  

### Phase E — Stop

- [x] **E1.** Thin docs only if needed; no Done claim.  
- [x] **E2.** Stop for Review after CI + Vercel attested.  

---

## Verification / Definition of Done

```bash
# From mechanic_rag/web/
pnpm add next@15.5.20                    # dependency (or latest 15.5.x ≥15.5.16)
pnpm add -D eslint-config-next@15.5.20   # devDependency (same version)
pnpm run build
npx vitest run src/lib/retrieval/__tests__/ranking.test.ts \
  src/server/__tests__/ask_soft_adjust_private_gold.test.ts \
  src/server/__tests__/ask_handle_ablation.test.ts

# After push — GHA CI success on bump SHA
# Vercel Production:
# gh api repos/Alpha-W0lf/mechanic_rag/deployments?per_page=5
# gh api repos/Alpha-W0lf/mechanic_rag/deployments/<id>/statuses
# Expect state=success for Production on bump SHA
```

**DoD (Write):** This Soft Adjust guide authored with A/N1/G1 pins; steps/DoD/blast/edges; **no** Implement.  
**DoD (Ready):** Pins locked; bump + Vercel Met path clear.  
**DoD (Implement):** Phases A–D Met; Vercel Production **success** attested; no Guide 16 / Done claim.

---

## Blast radius and risks

| Risk | Angle | Mitigation |
|------|-------|------------|
| Peer / breaking App Router changes in 15.5.x | Compatibility | Prefer latest patch on 15.5; fix only forced errors |
| Lockfile churn | Ops | Single `web/` install; review diff |
| Vercel still fails after 15.5.x | Process | Document; escalate N2 — no silent 16 |
| Scope into product Soft Adjust | Process | Explicit ban |
| Claiming deployed without promote success | Honesty | Require deployment status attestation |

**Blast radius:** `web/package.json` + `web/pnpm-lock.yaml` (+ forced compile fixes only) — **not** Soft Adjust PrivateGold, ask schema, ranking/CE, Guide 16.

### Rollback

Revert bump commit; Production may stay blocked on vuln gate until re-bumped.

---

## Edge-case handling

| Case | Behavior |
|------|----------|
| npm latest 15.5.x already > Write snapshot | Use Implement-time latest ≥15.5.16 |
| Build green, Vercel still “Vulnerable Next” | Confirm installed version in build log; retry latest 15.5.x; else stop for N2 |
| Peer dependency warning only | Prefer resolve without major React bump; record if forced |
| GHA green, Vercel delayed | Wait/poll deployment; DoD needs Production success |
| Historical `mechainic` Vercel slug | Cosmetic; out of Met |

---

## Explicitly out of Met

- Guide 16 invent  
- Soft Adjust PrivateGold reopen / dual-product Done  
- Friend rclone / Ford PTS / Vehicle / LEMON  
- Next 16 major as first attempt  
- HTTP Soft Adjust ask env gap close  

---

## Stop conditions

- Write: this guide complete; handoff Results filled; no Implement.  
- Ready (later): score + evidence; Tom authorized Ready-checks.  
- Implement (later): bump + CI + Vercel Production success under A/N1/G1.

---

## Ready for Review?

**Yes** — Implement Met under A/N1/G1. Vercel Production promote success attested. Review next.
