> **ARCHIVED** — moved under Workflow OS documentation sprawl reform.
> Do not treat this file as living SSOT.
> Living successor: `docs/VISION.md` · `docs/ARCHITECTURE.md` · living guides under `docs/dev_guides/`
> Batch: `2026-08_sprawl_c2c_mechanic_stage_notes`
> Date: 2026-08-13
# Prioritize — Mechanic next after Guide 13 Pass (pass 163)

**Date:** 2026-07-19  
**Repo:** `mechanic_rag`  
**Stage:** Prioritize next work  
**Mode:** spoke  
**Handoff:** `second_brain/docs/2026-07-19_spoke_mechanic_prioritize_after_g13_pass163_handoff.md`  
**Guide 13:** Review Pass `845528f` (Implement `4f1db07`)  
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
| Guides 01–10b | Met / closed |
| Guide 11 PrivateGoldSource | Review Pass — fixture-first |
| Guide 12 multi-vehicle + `gold_status` | Review Pass |
| Guide 13 Soft Adjust synthetic present-only | **Review Pass** — `cat:`/`private_oem` + required `gold_status`; rejects `friend_publish_eligible=true` |
| Live Soft Adjust OEM / friend Drive Review | **Not** Met · **not** dual-product Done |
| Vehicle live RAG Gold emit | **Exists** (gitignored): `second_brain/.../vehicle_rag_gold_assembly/out/live/cat__2017-f-150/` — `cat:2017-f-150` / `private_oem` + `present_only_receipt.json` (`complete_library: false`) |
| Soft Adjust #7 | Align Met — gap registry; friend publish still blocked on `zero_gap` |

---

## Ordered recommendation (ONE next Guide)

### 1. **NEXT (Write next) — Guide 14 Soft Adjust: live local present-only PrivateGold pilot**

**What:** Close the **library emit → Mechanic Soft Adjust ingest** loop without Ford PTS or friend Drive:

1. **Bridge:** Map Vehicle `present_only_receipt.json` → Mechanic `gold_status.json` (`zero_gap=false`, `present_only=true`, `complete_library=false`, `friend_publish_eligible=false`, `vehicle_ids` from receipt). Thin helper / one-shot script under Mechanic (or docs recipe) — **no** Contract 7.2 fork.  
2. **Point** `MECHANIC_PRIVATE_GOLD_ROOT` at Vehicle live emit root (parent of `cat__2017-f-150/` **or** the release dir with root sidecar) — **GD2 local only**; never Drive.  
3. **Prove** Soft Adjust ingest ≥1 `cat:2017-f-150` document from existing live emit (Compose/Ollama when up; unit attestation if env gap).  
4. **Honesty:** Guide 14 Met ≠ dual-product Done ≠ friend Soft Adjust Review Met ≠ zero-gap publish.  
5. **CI:** Keep Guide 13 synthetic tests green; do **not** commit OEM live bytes into `mechanic_rag` git.

**Why (build doneness):** Guide 13 proved Soft Adjust policy on **synthetic** packs. The highest-leverage no-Ford next step is consuming the **already-emitted** Vehicle live RAG Gold (`assemble_live_rag_gold` Soft Adjust Met) so PrivateGold is real end-to-end on MacBook Gold — matching hub “local present-only Soft Adjust pilot using Vehicle `out/live`.”

**Dependencies:**

| Dep | Status |
|-----|--------|
| Guide 13 Review Pass | **Met** (`845528f`) |
| Vehicle Soft Adjust live RAG Gold emit | **Met** — `out/live/cat__2017-f-150/` present on disk (verified this Prioritize) |
| Soft Adjust #7 Align | **Met** — honesty ref only; not friend publish |
| Ford PTS / Torque F1 | **Forbidden / parked** |
| Friend rclone / zero-gap Drive | **Out** |

**Out of Met:** Dual-product Done · friend publish · Drive ingest · ranking/CE reopen · requiring fleet 258 · invent Soft Adjust #8 · committing OEM to git.

**Proposed path:** `mechanic_rag/docs/dev_guides/2026-07-19_dev_guide_14_soft_adjust_live_present_only_private_gold_pilot.md`

---

### 2. Later — Guide 15: PrivateGold ask / eval plane for Soft Adjust `cat:`

**What:** After live (or synthetic) Soft Adjust ingest, prove `/api/ask` or thin eval path for a Soft Adjust `vehicle_id` with honesty that citations may be incomplete Gold.

**Why:** Closes consumer **query** doneness; still not dual-product Done.

**Deps:** Guide 14 Met preferred (live index); Guide 13 synthetic pack can stub if live skipped.

---

### 3. Optional thin Align — PrivateGold context “Problem” stale Gather prose

**What:** `docs/2026-07-18_private_gold_source_context_summary.md` Problem section still reads pre-Implement.

**Why:** Doc trust; not build capability.

**Deps:** None. Do **not** block Guide 14 Write.

---

### 4. Parked / out of this Prioritize

| Item | Why parked |
|------|------------|
| Dual-product Done / friend Soft Adjust Review Met | Needs `zero_gap` + hub unlock |
| Friend Drive republish | Soft Adjust #4 gate |
| Ford PTS / Torque F1 | Tom 1–2 week park |
| Second-vehicle / wiring eval goldens | Lower leverage than live Soft Adjust pilot |
| Ranking / CE reopen | Forbidden |
| Interview walkthrough polish | Tom: separate |

---

## Overlooked / doc conflicts

| Item | Note |
|------|------|
| Live emit **already on disk** | `vehicle_rag_gold_assembly/out/live/cat__2017-f-150/` + receipt — do not wait for Vehicle Mode B expand to start Mechanic Guide 14 |
| Receipt ≠ `gold_status` | Vehicle emits `present_only_receipt.json`; Mechanic Soft Adjust requires `gold_status.json` — **bridge is the Guide 14 work**, not a schema fork |
| Soft Adjust #7 ledgers vs RAG Gold emit | Different trees (`out/live` assemble Gold vs completeness ledgers) — Guide 14 consumes **RAG Gold emit**, not Mode B assemble PDFs |
| Context summary Problem prose | Stale Gather — Align residual |
| ARCHITECTURE “live Soft Adjust OEM ingest” open cell | Soft Adjust **synthetic** Met; live pilot is Guide 14 — update honesty after Implement |
| Temptation to claim Done after live ingest | Forbidden — `friend_publish_eligible` stays false; incomplete Gold |

---

## Open decisions (human)

### Decision 1 — Next Guide shape

- **Plain title:** What is the single next Mechanic Guide after Guide 13?
- **Options:**  
  - **(A)** Guide 14 Soft Adjust **live local** present-only PrivateGold pilot (Vehicle `out/live` emit + receipt→`gold_status` bridge) — recommended  
  - **(B)** Jump to PrivateGold **ask/eval** plane on synthetic Soft Adjust only  
  - **(C)** Park Mechanic until Vehicle F-150 Mode B→A cohort expand finishes  
- **Recommendation:** **(A)**  
- **Reasoning:** Live emit already exists; closes emit→ingest loop under no-Ford; matches handoff preference.  
- **Tradeoffs:** A needs disk/env for live ingest (Compose/Ollama gap OK with attestation); B skips real Gold; C idles Mechanic against “keep building.”

### Decision 2 — Guide 14 Met identity

- **Plain title:** Must Met require live MacBook Gold, or is hybrid OK?
- **Options:** **(L1)** Hybrid — live pilot when `out/live` present + CI keeps Guide 13 synthetic · **(L2)** Live-only Met (fail if emit missing) · **(L3)** Synthetic-only (skip live)  
- **Recommendation:** **(L1)**  
- **Reasoning:** Emit verified present now; CI must stay OEM-free; L2 flakes if emit pruned; L3 wastes the live asset.  
- **Tradeoffs:** L1 two proof paths; L2 stronger but brittle; L3 no build advance vs Guide 13.

### Decision 3 — Status bridge shape

- **Plain title:** How does Mechanic get Soft Adjust `gold_status` for live emit?
- **Options:** **(B1)** Thin mapper: `present_only_receipt.json` → `gold_status.json` (recommended) · **(B2)** Hand-author sidecar only · **(B3)** Soft Adjust Mechanic to accept receipt basename as alias  
- **Recommendation:** **(B1)**  
- **Reasoning:** Smallest correct bridge; keeps Guide 13 Soft Adjust API stable; no schema fork.  
- **Tradeoffs:** B1 one helper; B2 operator error-prone; B3 expands adapter surface for little gain.

---

## Recommended default if Tom silent on locks

Treat **A + L1 + B1** as standing authorize for **Write Guide 14**. Dual-product Done remains forbidden.

---

## Stop

Prioritize Met. **No Write / Implement this stage.** Ready-for Write Guide 14 under A/L1/B1 unless Tom locks otherwise.
