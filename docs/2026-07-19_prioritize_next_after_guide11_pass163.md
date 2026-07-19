# Prioritize — Mechanic next Guide after Guide 11 (pass 163)

**Date:** 2026-07-19  
**Repo:** `mechanic_rag`  
**Stage:** Prioritize next work  
**Mode:** spoke  
**Handoff:** `second_brain/docs/2026-07-19_spoke_mechanic_prioritize_next_after_g11_pass163_handoff.md`  
**Hub:** `second_brain/docs/2026-07-19_prioritize_morning_no_ford_gap_registry_pass163.md`  
**Guide 11:** Review Pass `5becff8` (Implement `b509ac0`)  
**Tom locks:** No Ford PTS ≥1–2 weeks · keep building · interview prep separate · authorize next steps  

---

## Declare

| Item | Value |
|------|-------|
| Mode | spoke |
| Stage | Prioritize next work |
| Will write | This prioritize artifact + handoff Results |
| Will not | Write/Implement Guide · live Soft Adjust Review Met claim · dual-product Done · Ford / Drive zero-gap wait |

---

## Current truth (Mechanic)

| Layer | Status |
|-------|--------|
| Guides 01–10b | Met / closed (fixtures-only flip, PolyForm-NC, freeze override honesty) |
| Guide 11 PrivateGoldSource | **Review Pass** — fixture-first N1 (`fixture:` under `MECHANIC_PRIVATE_GOLD_ROOT`) |
| Live Soft Adjust OEM ingest | **Parked / out of Met** (no zero-gap Drive Gold; Torque F1 parked) |
| Dual-product Done | **Not** claimable |
| Eval second vehicle / wiring | Deferred (ARCHITECTURE open cell) |
| Guide 11 Soft Adjust follow-on | Documented only: allow `cat:`/`private_oem` + present-only receipt sidecar later |

---

## Ordered recommendation (ONE next Guide)

### 1. **NEXT (Write next) — Guide 12: Status-aware multi-vehicle PrivateGold fixture corpus**

**What:** Grow PrivateGold **consumer** doneness on **fixture-first** Contract 7.2 packs under the private Gold root:

- Stage **≥2** `fixture:` vehicles (or one release with docs spanning ≥2 `vehicle_id`s) — reuse / extend program `vehicle_rag_gold` shapes; **no OEM bytes in git**.  
- Add **status-aware honesty**: optional sidecar (e.g. `gold_status.json` / completeness receipt) carrying fields such as `zero_gap`, `publishable`, `present_only` / `complete_library` — **not** a Contract 7.2 schema fork.  
- Ingest via existing `PrivateGoldSource` + `mecharag ingest --source private-gold`; prove ≥2 vehicles indexed (idempotent skip OK).  
- Surface honesty in logs + thin ARCHITECTURE/GETTING_STARTED: incomplete / `zero_gap=false` Gold is **first-class ingestable**, never marketed as dual-product Done.  
- Keep Guide 11 N1 Met gates for this Guide unless Tom locks Soft Adjust (Decision 2).

**Why (build doneness):** Guide 11 proved the adapter on **one** fixture vehicle. Dual-product consumer plane still thin without multi-vehicle proof + explicit incomplete-Gold honesty — both advance **build** without Ford, Drive zero-gap, or Soft Adjust Review Met. Matches hub morning item “Mechanic … fixture-first … status/`zero_gap` honesty.”

**Dependencies:**

| Dep | Status |
|-----|--------|
| Guide 11 Review Pass | **Met** (`5becff8`) |
| Contract 7.2 validators + program fixtures | **Met** |
| Vehicle Soft Adjust #7 gap registry | **Not required** for Guide 12 Met |
| Live zero-gap Drive Gold / Ford PTS | **Forbidden / parked** — out of Met |
| Soft Adjust live RAG Review | **Not required** — stays parked |

**Out of Met:** Live OEM / `cat:` / `private_oem` (unless Tom locks Soft Adjust variant) · dual-product Done · Drive ingest · ranking/CE reopen · claiming Soft Adjust Review Met.

**Proposed path:** `mechanic_rag/docs/dev_guides/2026-07-19_dev_guide_12_status_aware_multi_vehicle_private_gold.md`

---

### 2. Later — Guide 13 Soft Adjust: present-only / `zero_gap=false` live local Gold consume

**What:** Soft Adjust PrivateGoldSource to allow `cat:` + `private_oem` when a status sidecar says `present_only` / `zero_gap=false` / `publishable=false`; ingest from **local** MacBook Gold root (GD2) — **no** friend Drive publish Met; **no** dual-product Done.

**Why:** Closes Guide 11 Soft Adjust follow-on with honesty when incomplete OEM Gold exists locally.

**Deps:** Vehicle Soft Adjust #7 Met + local present-only rebuild under `1.7.0` (hub morning #1–#2); preferably Guide 12 sidecar shape landed so Soft Adjust reuses it.

**Out:** Friend live upload · Torque invent · claim Done.

---

### 3. Optional thin Align — cross-repo PrivateGold Status drift

**What:** Library architecture / stale notes still say Mechanic PrivateGoldSource **unbuilt** in places; Mechanic Guide 11 context “Problem” prose still reads pre-Implement.

**Why:** Trustworthy docs; not build capability.

**Deps:** Guide 11 Met (already). Can run as Align after Guide 12 or a thin Align slice — **do not** block Guide 12 Write.

---

### 4. Parked / out of this Prioritize

| Item | Why parked |
|------|------------|
| Live Soft Adjust Review Met / dual-product Done | Needs zero-gap Gold + hub unlock; Ford parked |
| Friend Drive republish | Soft Adjust #4 gate; `zero_gap=false` |
| Second-vehicle eval / wiring goldens | Build residual but lower leverage than multi-vehicle PrivateGold status plane |
| Ranking / CE reopen / freeze invent | Forbidden; freeze honesty retained |
| Interview walkthrough polish | Tom: interview prep **separate** |

---

## Overlooked / doc conflicts

| Item | Note |
|------|------|
| Guide 11 context “Problem” still describes PrivateGold as missing | Stale Gather prose — Align residual |
| `second_brain` vehicle library architecture still may say PrivateGoldSource unbuilt | Stale vs `5becff8` — hub Align |
| Hub notes that waited Soft Adjust #2–#4 for Mechanic live path | **Superseded:** Soft Adjust #1–#6 Met; unblock is Torque/waive — not Mechanic encoding |
| `multi_doc_family_manifest.json` is multi-**doc** same vehicle | Multi-**vehicle** pack still needed for Guide 12 Met (or two staged releases) |
| Status sidecar not in Contract 7.2 today | Intentional — optional sidecar; do not fork schema in Guide 12 |
| Present-only Soft Adjust before multi-vehicle fixtures | Tempting but **couples** to Vehicle #7 + local OEM bytes; worse under no-Ford lock |

---

## Open decisions (human)

### Decision 1 — Next Guide shape

- **Plain title:** What is the single next Mechanic Guide after Guide 11?
- **Options:**  
  - **(A)** Guide 12 status-aware **multi-vehicle fixture** PrivateGold (recommended)  
  - **(B)** Jump to Soft Adjust: consume local present-only OEM with `zero_gap=false` honesty first  
  - **(C)** Park Mechanic build until Vehicle Soft Adjust #7 + local rebuild  
- **Recommendation:** **(A)**  
- **Reasoning:** Max build progress under no-Ford / no zero-gap Drive; reuses Guide 11 adapter; lands status honesty before OEM Soft Adjust.  
- **Tradeoffs:** A delays live `cat:` demo; B needs local OEM Gold + Vehicle #7 and risks Done-claim drift; C idles Mechanic against Tom “keep building.”

### Decision 2 — Guide 12 Met identity

- **Plain title:** May Guide 12 Met include `cat:` / `private_oem`, or stay `fixture:` only?
- **Options:** **(N1)** fixture-only Met (extend Guide 11) · **(N2)** allow synthetic `cat:` + `private_oem` pack under private root · **(N3)** require live present-only pack  
- **Recommendation:** **(N1)** for Guide 12; Soft Adjust Guide 13 for N2/N3.  
- **Reasoning:** Keeps Met free of OEM bytes and Soft Adjust Review park; status sidecar works on fixtures too.  
- **Tradeoffs:** N1 weaker private-rights demo; N2 stronger shape without live OEM; N3 blocked on Ford/park.

### Decision 3 — Status sidecar shape

- **Plain title:** How does Mechanic learn `zero_gap` / incomplete honesty?
- **Options:** **(S1)** Optional JSON sidecar next to release (no schema fork) · **(S2)** Extend Contract 7.2 required fields · **(S3)** Logs-only (no persisted status)  
- **Recommendation:** **(S1)**  
- **Reasoning:** Matches Guide 11 Soft Adjust follow-on (“sidecar; not schema fork”); library can emit later without blocking Mechanic Write.  
- **Tradeoffs:** S1 soft contract; S2 slower / multi-repo; S3 weaker interview/demo proof.

---

## Recommended default if Tom silent on locks

Treat **A + N1 + S1** as standing authorize for **Write Guide 12** (hub may chain Write under “next steps”). Soft Adjust present-only remains **Guide 13** after Vehicle #7.

---

## Stop

Prioritize Met. **No Write / Implement this stage.** Ready-for Write Guide 12 under A/N1/S1 unless Tom locks otherwise.
