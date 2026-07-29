# Context: Mechanic RAG — personal garage private corpus (orientation + locks)

**Date:** 2026-07-25  
**Repo:** `mechanic_rag` (hub awareness: friend Drive library stays a **separate** program)  
**Mode last used:** multi-repo  
**Stage this pass:** Prioritize next work (dual-program mid-Ram) — living prioritize section updated  
**Lens:** Senior AI eng (RAG grounding) + backend (HTTP contract) + portfolio honesty  

### Declare

| Item | Value |
|------|-------|
| Will write | Living prioritize / readiness (this file) |
| Will **not** | M1 Implement · friend Drive into Mechanic · live LEMON |

**Related (parallel, unchanged):** Friend shop Drive Gold — separate initiative.

---

## Problem

Wire Mechanic’s **private** RAG corpus to Tom’s **owned personal fleet**, storing curated manuals **locally on MacBook disk**, emitting **full** service/owners (and wiring/connectors where present) into Contract 7.2 RAG Gold — not cherry-picked page subsets for the corpus, and not registration/paperwork.

---

## Contract 7.2 / PrivateGoldSource discipline (plain English)

**Contract 7.2** = local validating manifest + **text** page/section units (not Drive PDFs as the DB).  
**`PrivateGoldSource`** = Mechanic loader of that local Gold root (rejects Drive URLs — GD2).

| Strong | Weak |
|--------|------|
| Curate → full-PDF text extract → Contract 7.2 → local Gold → ingest | Point Mechanic at Drive / raw PDFs / paperwork |

**Chunking note (same page):** Including the **full manual** in the corpus still means Mechanic **chunks** text for retrieval later. That is not “only indexing selected pages.” Corpus completeness ≠ retrieval unit size.

---

## Locked decisions (Tom 2026-07-25)

| Decision | Locked value |
|----------|--------------|
| Private Mechanic corpus | **Personal garage only** (owned vehicles) |
| Friend shop Drive Gold | **Separate, unchanged** |
| Portfolio v1 modality | **M0 text-first** (fixtures public; private text Gold → ingest/ask) |
| Multimodal M1→M3 | **Roadmap only** — each stage own guide/DoD; portfolio-viable claims; join on stable page locators — **not** v1 DoD |
| Storage | **Local MacBook disk** (gitignored / outside repo); Drive = copy source only |
| Corpus completeness | **Full available** service + owners (+ wiring/connectors when present) — **all pages** of included PDFs |
| Excluded file classes | Registration, title, CARFAX, permits, incomplete `.crdownload`, friend README/ledger JSON as body text |
| Aftermarket accessory docs (Victron, etc.) | **Exclude** from v1 garage corpus (not OEM vehicle manuals) |
| Public fixtures | Unchanged |
| Private ingest shape | Contract 7.2 + `PrivateGoldSource` |
| YXZ generation filter | **Model years 2019–2023 only** — do not include YXZ manuals outside that range |
| Fleet scope for first emit guide | **All four** owned vehicles (not Triumph-only deferral) |

### Allowlist vehicles

| Vehicle | `vehicle_id` (proposed) | Source of curated PDFs |
|---------|-------------------------|-------------------------|
| 2003 Honda S2000 | `cat:2003-honda-s2000` | `gdrive:Vehicle Docs/2003 Honda S2000/` (manuals only) |
| 2015 Triumph Street Triple | `cat:2015-triumph-street-triple` | `gdrive:Vehicle Docs/2015 Triumph Street Triple/` |
| 2021 Yamaha YXZ1000R SS SE | `cat:2021-yamaha-yxz1000r-ss-se` | `gdrive:Vehicle Docs/2021 Yamama YXZ1000R SS SE/` (**2019–2023 only**) |
| 2016 Ford Transit 350 | `cat:2016-ford-transit-350` | Friend Gold `…/Ford PTS - PDF manuals/2016-transit/` **plus** owners from `Vehicle Docs/2016 Ford Transit 350/` |

### Explicitly excluded vehicles

- 2011 Mazda2 · 2009 Yamaha WR250X (no longer owned)

### YXZ include / exclude (evidence)

| File | In corpus? |
|------|------------|
| `YXZ1000R 2019_service manual.pdf` (~48 MiB) | **Include** |
| `YXZ1000R 2020-2023_service manual.pdf` (~41 MiB) | **Include** |
| `yamaha yxz1000et 2019_owners manual.pdf` (~9 MiB) | **Include** (generation-year owners; trim filename is `et` — applicability risk noted) |
| `YXZ1000R 2016_service manual.pdf` | **Exclude** |
| `YXZ1000R 2018_service manual.pdf` | **Exclude** |
| `YXZ1000R … 2017_…` (paddle / non-paddle) | **Exclude** |
| `YXZ1000R 2024_service manual.pdf` | **Exclude** |
| `yamaha yxz1000r ss_owners manual 2024.pdf` | **Exclude** |

### S2000 duplicate evidence

`2000-08 Honda S2000 Service Manual.pdf` and `Honda S2000 - Service Manual_2000 - 2008.pdf` share the **same MD5** (`a348d4cb…`) — keep **one** copy in bronze.

### Disk evidence (do not ignore)

- MacBook data volume ~**30 GiB free** (2026-07-25 check).  
- Transit `service_manual.pdf` alone ~**668 MiB**; full Transit 3-PDF Gold set ~**756 MiB**.  
- Emit must fail closed or warn if free space insufficient; do not assume headroom.

---

## Understanding check (Tom ↔ agent) — **same page**

| Topic | Understanding |
|-------|----------------|
| Full manuals | Yes — index **complete** included PDFs (all extractable pages), not a hand-picked subset of sections for the corpus |
| Paperwork | No — registration / CARFAX / permits / title junk out |
| Local disk | Yes — small fleet curated under a local root; Drive only to **copy** |
| All vehicles now | Yes — first emit **guide covers all four**; verification is per-vehicle but scope is fleet-wide |
| Friend library | Unchanged separate program |

**Not an adjustment:** this matches the prior recommendation, with YXZ year filter + fleet-wide first guide + Victron exclude made explicit.

---

## Prioritize order

### Closed (2026-07-25)

1. ~~Garage PDF → Contract 7.2 emit (all four)~~ **Review Pass**  
2. ~~`private-gold` ingest of garage Gold root~~ **Review Pass**  
3. ~~Thin ask attestation (Triumph)~~ **Review Pass**  

### Closed backlog (Rank 1–3) — **Met 2026-07-25**

Parallel program note: Friend Drive LEMON Ram **continue** may still run (~20 ZIPs left as of mid-evening). Mechanic **docs** stages do **not** fight that download; do **not** start heavy-truck batch-2 live download until Ram disk is clear.

| Rank | Work item | Status |
|------|-----------|--------|
| **1** | Multi-vehicle garage ask smoke | **Implement Met + Review Pass** |
| **2** | UI garage vehicle picker | **Implement Met + Review Pass** |
| **3** | Small garage golden-question set | **Implement Met + Review Pass** |

**Rank-1 Met vehicles (locked):** `cat:2003-honda-s2000` · `cat:2021-yamaha-yxz1000r-ss-se` · `cat:2016-ford-transit-350` (+ Triumph earlier)

### Next backlog — dual-program prioritize 2026-07-25 ~23:05

Hub SSOT: `second_brain/docs/2026-07-25_prioritize_dual_program_mid_ram_progress.md`

| Rank | Work item | Why next | Dependencies | Notes |
|------|-----------|----------|--------------|-------|
| **4** | **M1→M3 multimodal roadmap — Gather + Refine** | Shared locator/asset design across stages | Rank 1–3 Met | **Refine Met** — `docs/2026-07-25_mechanic_rag_multimodal_roadmap_m1_m3_context_summary.md` |
| **5** | **Write** separate M1 then M2 then M3 guides | Executable/design DoD per stage | Rank 4 Refine | **M1+M2+M3 guides written**; M1 guide Critical review Pass-with-nits (patched); Implement parked |
| Parked | M1–M3 **code** · CE/embed unfreeze · friend Drive into Mechanic · `mecharag ask` CLI | Separate authorize each | Do not sneak into guides |

**Overlooked / doc conflicts:**

- Older `api_contracts.md` `visual_assets` must not override VISION M0/M1 staging.  
- Friend Ram still active — no Mechanic live jobs that thrash disk.

---

## Emit + ingest (closed)

- Emit: **Review Pass**  
- Ingest: **Implement Met + Review Pass** (`docs/dev_guides/2026-07-25_dev_guide_personal_garage_private_gold_ingest.md`)  
- Live Gold: 13 docs / 4 vehicles / **13286** units  
- Indexed (`cat:`): 13 documents · **18243** chunks (re-verified Implement: S2000 3760 · Triumph 1886 · Transit 10315 · YXZ 2282)

```bash
uv run mecharag ingest --source private-gold --root "$HOME/var/mechanic_garage/gold"
```

---

## Ask attestation (Triumph + multi-vehicle — closed)

- Triumph: **Pass** — `answered`, **25 Nm**, 3 cites (`docs/2026-07-25_review_personal_garage_ask_attestation.md`)  
- Multi-vehicle: **Implement Met + Review Pass**  
  - S2000: `answered`, **33 lbf·ft (45 N·m)**, 3 cites  
  - YXZ: `answered`, crankcase **10 N·m**, 4 cites  
  - Transit: `answered`, **20 lb·ft (27 Nm)**, 7 cites  
- GETTING_STARTED: four garage curls present  

**Next (Mechanic backlog):**  
1. ~~Multi-vehicle ask smoke~~ **Met + Review Pass**  
2. ~~UI garage picker~~ **Met + Review Pass**  
3. ~~Garage goldens~~ **Met + Review Pass** (`evals/golden_garage_v1.json`; review `docs/2026-07-25_review_personal_garage_golden_eval.md`)  
4. **M1→M3 multimodal roadmap docs** — Gather+Refine Met; M1 guide Critical review **Pass-with-nits** (patched); **M1+M2+M3 guides written**. Implement parked.  
   - M1: `docs/dev_guides/2026-07-25_dev_guide_mechanic_m1_linked_visuals.md`  
   - M2: `docs/dev_guides/2026-07-26_dev_guide_mechanic_m2_multimodal_retrieve.md`  
   - M3: `docs/dev_guides/2026-07-26_dev_guide_mechanic_m3_vision_answers.md`  

Also parked: M1–M3 **code** · CE/embed unfreeze · friend Drive into Mechanic · `mecharag ask` CLI.

**Lock refresh (Tom 2026-07-26):** Guide review remediations locked (ask emits href when resolvable; GET render ≤8s). Next: friend-docs title-only cleanup Gather and/or M1 Ready when Implement desired.

---

## Honest readiness

- **Garage emit / ingest / Triumph ask / multi-vehicle ask / UI picker / garage goldens (thin v1):** Review Pass.  
- **Multimodal M1–M3 Implement:** Parked.  
- **Multimodal context Refine:** **Met** — Write readiness M1 **8.4** / M2 **6.8** / M3 **6.2**.  
- **CE lift / public freeze reopen:** Not Met / roadmap.

