> **ARCHIVED** — moved under Workflow OS documentation sprawl reform.
> Do not treat this file as living SSOT.
> Living successor: `docs/VISION.md` · `docs/ARCHITECTURE.md` · living guides under `docs/dev_guides/`
> Batch: `2026-08_sprawl_c2c_mechanic_stage_notes`
> Date: 2026-08-13
# Prioritize — Mechanic next after Guide 14 Pass (pass 163)

**Date:** 2026-07-19  
**Repo:** `mechanic_rag`  
**Stage:** Prioritize next work  
**Mode:** spoke  
**Handoff:** `second_brain/docs/2026-07-19_spoke_mechanic_prioritize_after_g14_pass163_handoff.md`  
**Guide 14:** Review Pass `c4254b3` (Implement `3695d84`)  
**Tom locks:** No Ford PTS ≥1–2 weeks · keep building · authorize next steps · agree recommendations  

---

## Declare

| Item | Value |
|------|-------|
| Mode | spoke |
| Stage | Prioritize next work |
| Will write | This prioritize artifact + handoff Results |
| Will not | Write/Implement Guide · dual-product Done · Ford / friend zero-gap Drive · CE invent |

---

## Current truth (Mechanic)

| Layer | Status |
|-------|--------|
| Guides 01–10b | Met / closed (fixtures ask/eval plane live for `fixture:`) |
| Guide 11–12 PrivateGold | Review Pass — fixture multi-vehicle + `gold_status` |
| Guide 13 Soft Adjust synthetic | Review Pass — `cat:`/`private_oem` + required `gold_status` |
| Guide 14 Soft Adjust live pilot | **Review Pass** — receipt→`gold_status`; live `cat:2017-f-150` Soft Adjust **load attestation** (not full DB upsert Met) |
| Ask / eval plane for Soft Adjust `cat:` | **Not Met** — `/api/ask` still proven on fixture vehicles; Soft Adjust Gold not closed through query |
| Dual-product Done / friend Review Met | **Forbidden** |
| Ford PTS | Parked 1–2 weeks |

---

## Ordered recommendation (ONE next Guide)

### 1. **NEXT (Write next) — Guide 15 Soft Adjust: PrivateGold ask / eval plane for Soft Adjust `cat:`**

**What:** Close the **consumer query** loop for Soft Adjust PrivateGold without Ford or friend zero-gap:

1. **Ingest (Soft Adjust):** Index a **synthetic** Soft Adjust pack (`cat:` + `private_oem` + `gold_status` — Guide 13 shape) into local Postgres when Compose/Ollama up — **or** reuse already-indexed Soft Adjust docs if present.  
2. **Ask Soft Adjust:** Prove `POST /api/ask` with Soft Adjust `vehicle_id` (recommend `cat:demo-synthetic-f150` for Met) returns a contract-valid response (answer and/or insufficient-evidence) scoped to that vehicle — **no** cross-vehicle leak.  
3. **Honesty:** Incomplete / present-only Gold may yield thin citations or insufficient-evidence — log Soft Adjust honesty; **≠** dual-product Done ≠ friend Soft Adjust Review Met.  
4. **Optional thin eval:** One Soft Adjust golden (or retrieval-only smoke) when env up; unit/contract tests remain Met if HTTP env gap (same pattern as prior Guides).  
5. **L1 CI:** Keep Guide 13–14 Soft Adjust unit tests green; no OEM in git; no Guide 14 reopen.

**Why (build doneness):** Guide 11–14 closed **ingest/policy** for PrivateGold Soft Adjust. ARCHITECTURE still lists Soft Adjust ask/query as open relative to fixture ask path. Guide 15 advances **build** by proving Soft Adjust Gold is queryable — higher leverage than more live PrivateGold load polish (Guide 14 Met already attested load; full live upsert is ops/cost, not the missing product plane). Matches handoff preference: Guide 15 ask/eval Soft Adjust over more live PrivateGold.

**Dependencies:**

| Dep | Status |
|-----|--------|
| Guide 13 Soft Adjust policy | **Met** (`845528f`) |
| Guide 14 live pilot | **Met** (`c4254b3`) — honesty ref; **not** required for Guide 15 Met if synthetic Soft Adjust ingest used |
| `/api/ask` + vehicle scoping | **Met** for fixtures |
| Compose Postgres + Ollama | Env for live ask Met; unit/contract attestation OK if gap |
| Ford / friend zero-gap | **Out** |

**Out of Met:** Dual-product Done · friend rclone · Ford PTS · CE invent · requiring live `cat:2017-f-150` full corpus upsert · Guide 14 reopen · claiming Soft Adjust Review Met for friend publish.

**Proposed path:** `mechanic_rag/docs/dev_guides/2026-07-19_dev_guide_15_soft_adjust_private_gold_ask_eval.md`

---

### 2. Later — Soft Adjust live corpus upsert / multi-vehicle Soft Adjust ask

**What:** Full `mecharag ingest --source private-gold` of live `cat:2017-f-150` (large pack) + optional ask against live id.

**Why:** Stronger demo; expensive / env-heavy; not the missing plane after Guide 14 attestation.

**Deps:** Guide 15 preferred first; disk/DB/Ollama budget.

---

### 3. Optional thin Align — PrivateGold context “Problem” + ARCHITECTURE deferred cells

**What:** Stale Gather “Problem” prose; ARCHITECTURE open-table cells still saying “live Soft Adjust OEM ingest” where Guide 14 pilot already Met.

**Why:** Doc trust; not build capability.

**Deps:** None. Do **not** block Guide 15 Write.

---

### 4. Parked / out of this Prioritize

| Item | Why parked |
|------|------------|
| Dual-product Done / friend Soft Adjust Review Met | Needs `zero_gap` + hub unlock |
| Friend Drive republish | Soft Adjust #4 gate |
| Ford PTS / Torque F1 | Tom 1–2 week park |
| Second-vehicle / wiring fixture evals | Lower leverage than Soft Adjust ask plane |
| Ranking / CE reopen | Forbidden |
| Interview walkthrough polish | Tom: separate |

---

## Overlooked / doc conflicts

| Item | Note |
|------|------|
| Guide 14 Met ≠ full live upsert | Sample Soft Adjust load attested; do not treat “live Soft Adjust OEM ingest” open cell as “Guide 14 unfinished” — Guide 15 is ask plane |
| Ask already requires `vehicle_id` | Soft Adjust Met is proving **indexed Soft Adjust vehicle** + honesty, not inventing a new ask schema |
| Temptation to require live F-150 ask for Met | Couples to huge corpus upsert; prefer synthetic Soft Adjust for Guide 15 Met (Q1) |
| Context “Problem” still pre-Implement | Align residual — not Guide 15 blocker |
| Dual-product Done after Soft Adjust ask | Forbidden — incomplete Gold honesty remains |

---

## Open decisions (human)

### Decision 1 — Next Guide shape

- **Plain title:** What is the single next Mechanic Guide after Guide 14?
- **Options:**  
  - **(A)** Guide 15 Soft Adjust **PrivateGold ask / eval** plane — recommended  
  - **(B)** More live PrivateGold (full upsert / multi-vehicle Soft Adjust ingest) first  
  - **(C)** Thin Align only (park build)  
- **Recommendation:** **(A)**  
- **Reasoning:** Closes missing query doneness; handoff prefers ask/eval Soft Adjust; Guide 14 already Met live pilot attestation.  
- **Tradeoffs:** A needs Compose/ask env for strongest Met (unit attestation fallback OK); B is ops-heavy without closing ask; C idles against “keep building.”

### Decision 2 — Guide 15 Met identity

- **Plain title:** Which Soft Adjust vehicle proves ask Met?
- **Options:** **(Q1)** Synthetic Soft Adjust `cat:demo-synthetic-f150` (Guide 13 shape) ingest + ask — recommended · **(Q2)** Require live `cat:2017-f-150` ask · **(Q3)** Contract/unit tests only (no HTTP ask)  
- **Recommendation:** **(Q1)**  
- **Reasoning:** CI-safe; no OEM in git; no giant upsert; still Soft Adjust `cat:`/`private_oem` + `gold_status`.  
- **Tradeoffs:** Q1 weaker live demo; Q2 blocked on cost/env; Q3 thinner product proof.

### Decision 3 — Eval depth

- **Plain title:** How deep is Guide 15 eval Met?
- **Options:** **(E1)** Ask smoke + honesty docs (+ optional retrieval-only) — recommended · **(E2)** Full Soft Adjust golden suite (n≥N) · **(E3)** UI vehicle-selector Soft Adjust packaging  
- **Recommendation:** **(E1)**  
- **Reasoning:** Smallest correct close of query plane; E2/E3 expand scope without unblocking dual-product Done.  
- **Tradeoffs:** E1 thinner interview story; E2 slower; E3 frontend scope.

---

## Recommended default if Tom silent on locks

Treat **A + Q1 + E1** as standing authorize for **Write Guide 15**. Dual-product Done remains forbidden.

---

## Stop

Prioritize Met. **No Write / Implement this stage.** Ready-for Write Guide 15 under A/Q1/E1 unless Tom locks otherwise.
