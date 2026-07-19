# Prioritize — Mechanic next after CI modality Review Pass (pass 164)

**Date:** 2026-07-19  
**Repo:** `mechanic_rag`  
**Stage:** Prioritize next work  
**Mode:** spoke  
**Handoff:** `second_brain/docs/2026-07-19_spoke_mechanic_prioritize_after_ci_modality_pass164_handoff.md`  
**Just Met:** CI modality Review Pass `8ee6fbc` · Implement `43ffc4f` · GHA CI green  
**Tom locks:** Build doneness = **functional + deployed** · authorize next steps · Soft Adjust PrivateGold Guides 11–15 Met  

---

## Declare

| Item | Value |
|------|-------|
| Mode | spoke |
| Stage | Prioritize next work |
| Will write | This prioritize artifact + handoff Results |
| Will not | Implement · Guide 16 invent · friend Gold · Vehicle/LEMON · dual-product Done |

---

## Current truth (Mechanic)

| Layer | Status |
|-------|--------|
| Guides 01–10b | Met |
| Soft Adjust PrivateGold Guides 11–15 | **Met** (idle_ok for product plane after G15) |
| CI modality type conflict | **Review Pass** — `content_modality` split; GHA `pnpm run build` green |
| Vercel Production | **Not Met for deploy doneness** — build step OK on `43ffc4f`; promote failed: *Vulnerable version of Next.js detected* |
| Pinned Next today | `web/package.json` → **`next@15.4.6`** (+ `eslint-config-next@15.4.6`) |
| Security floor (known) | CVE-2026-44574 / GHSA-492v-c6pp-mqqv — patched **≥15.5.16** on 15.x (or ≥16.2.5 on 16.x) |
| Dual-product Done / friend / Ford | Forbidden / parked |

---

## Ordered recommendation (ONE next)

### 1. **NEXT (Write → Ready → Implement) — Soft Adjust: Next.js security bump + Vercel Production promote**

**What:** Smallest Soft Adjust to clear Vercel’s post-build vulnerability gate and restore **deployed** Production:

1. Bump `next` + `eslint-config-next` in `web/` from **15.4.6** → **≥15.5.16** on the 15.x line (prefer **latest 15.5.x** available at Implement, e.g. 15.5.20 if still current).  
2. Refresh lockfile (`pnpm install`); keep React 19.x as-is unless the bump forces a peer change.  
3. Prove locally: `pnpm run build` + targeted vitest (retrieval/ask Soft Adjust).  
4. Push; prove GHA CI green.  
5. Prove Vercel Production deploy **success** (not only build) for the bump commit — attestation in Implement note (deployment id / URL / status).  
6. Thin honesty: GETTING_STARTED / ARCHITECTURE only if version strings are claimed; no Guide 16 invent; no PrivateGold reopen.

**Why (build doneness):** Tom’s bar is **functional + deployed**. Modality Soft Adjust closed functional CI/build; Vercel Production promote is the remaining deploy blocker. Product Soft Adjust Guides 11–15 are already Met — inventing Guide 16 is lower leverage than clearing Production.

**Dependencies:**

| Dep | Status |
|-----|--------|
| CI modality Review Pass | **Met** (`8ee6fbc`) |
| Vercel project linked to `main` | **Present** (deployments observed) |
| Next patched floor | **≥15.5.16** (15.x) per GHSA-492v-c6pp-mqqv |
| Compose/Ollama / Soft Adjust ask HTTP | **Out of Met** for this Soft Adjust |

**Out of Met:** Guide 16 invent · dual-product Done · friend Gold · Vehicle/LEMON · Next 16 major jump (unless 15.x bump fails Vercel) · ranking/CE reopen · PrivateGold reopen.

**Proposed path:** `mechanic_rag/docs/dev_guides/2026-07-19_dev_guide_soft_adjust_next_vercel_production_bump_pass164.md`  
(or Ready note + Implement without a numbered Guide if hub prefers Soft Adjust-only — **prefer thin Soft Adjust guide** for DoD clarity).

---

### 2. Later — idle_ok for product Soft Adjust (Guides 11–15)

**What:** Reaffirm product-plane park until Vehicle `zero_gap` / Ford unpark.

**Why:** Still true for PrivateGold Done; does **not** satisfy Tom deploy doneness while Vercel Production fails.

**Deps:** Deploy Soft Adjust preferred first.

---

### 3. Later — optional Next 16.x major (only if 15.x insufficient)

**What:** Jump to ≥16.2.5 if Vercel still rejects latest 15.5.x.

**Why:** Escape hatch; larger blast radius (React/peer/tooling).

**Deps:** Soft Adjust #1 tried 15.x first.

---

### 4. Parked / out

| Item | Why parked |
|------|------------|
| Guide 16 invent / Soft Adjust golden suite / UI Soft Adjust | Product polish; not deploy blocker |
| Friend Soft Adjust Review Met / dual-product Done | Vehicle `zero_gap` |
| Ford PTS | Tom park |
| HTTP Soft Adjust ask env gap | Ops residual; not Production gate |

---

## Overlooked / doc conflicts

| Item | Note |
|------|------|
| GHA green ≠ Vercel Production Met | Review already documented; do not claim deployed until promote succeeds |
| `15.4.6` is in affected CVE range | Bump is security + deploy, not vanity |
| Historical Vercel slug `mechainic` | Cosmetic; out of Met |
| idle_ok after G15 | Still valid for **product** Soft Adjust; **overridden for deploy** by Tom functional+deployed bar |

---

## Open decisions (human)

### Decision 1 — Next slice shape

- **Plain title:** What should Mechanic do next after CI modality Pass?
- **Options:**  
  - **(A)** Soft Adjust **Next bump + Vercel Production promote** — **recommended**  
  - **(B)** **idle_ok** (park deploy residual)  
  - **(C)** Invent Guide 16 / product Soft Adjust  
- **Recommendation:** **(A)**  
- **Reasoning:** Matches Tom deploy doneness; modality Met left Production blocked by Next vuln gate; product Soft Adjust already Met.  
- **Tradeoffs:** A has dependency/version risk; B fails Tom’s deployed bar; C is scope theater.

### Decision 2 — Bump target line

- **Plain title:** Which Next line clears the gate?
- **Options:**  
  - **(N1)** Stay on **15.x** → bump to **≥15.5.16** (prefer latest 15.5.x) — **recommended**  
  - **(N2)** Jump to **16.x** ≥16.2.5 now  
  - **(N3)** Docs-only / ignore Vercel promote  
- **Recommendation:** **(N1)**  
- **Reasoning:** Smallest correct; matches advisory patched floor; keeps React 19 / App Router surface familiar. Escalate to N2 only if N1 still fails Vercel.  
- **Tradeoffs:** N1 may need a follow-up if Vercel wants newer; N2 larger blast; N3 fails deploy doneness.

### Decision 3 — Soft Adjust packaging

- **Plain title:** Write a thin Soft Adjust guide or Ready-note-only?
- **Options:** **(G1)** Thin Soft Adjust guide + Ready/Implement — recommended · **(G2)** Ready note only · **(G3)** Silent Implement  
- **Recommendation:** **(G1)**  
- **Reasoning:** DoD/verify/blast explicit for version bump; Tom authorized Ready-checks + next steps.  
- **Tradeoffs:** G1 one extra Write stage; G2 thinner audit trail; G3 violates Ready gate habit.

---

## Recommended default if Tom silent on locks

Treat **A + N1 + G1** as standing authorize for **Write Soft Adjust Next/Vercel Production bump**. Do not idle_ok while Production promote is red.

---

## Stop

Prioritize Met. **No Implement this stage.** Ready-for Write Soft Adjust under A/N1/G1 unless Tom locks otherwise.
