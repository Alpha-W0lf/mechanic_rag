> **ARCHIVED** — moved under Workflow OS documentation sprawl reform.
> Do not treat this file as living SSOT.
> Living successor: `docs/dev_guides/2026-07-19_dev_guide_12_status_aware_multi_vehicle_private_gold.md` · `docs/VISION.md` · `docs/ARCHITECTURE.md`
> Batch: `2026-08_sprawl_c2a_mechanic_guide_stage_notes`
> Date: 2026-08-13

# Ready-check note — Mechanic Guide 12 multi-vehicle PrivateGold (pass 163)

**Date:** 2026-07-19  
**Repo:** `mechanic_rag`  
**Stage:** Ready check before code  
**Guide:** `docs/dev_guides/2026-07-19_dev_guide_12_status_aware_multi_vehicle_private_gold.md` (Write Met `110a12b`)  
**Prioritize:** `docs/2026-07-19_prioritize_next_after_guide11_pass163.md` (`35ffa92`)  
**Handoff:** `second_brain/docs/2026-07-19_spoke_mechanic_ready_guide12_pass163_handoff.md`  
**Locks:** **A** (multi-vehicle fixture corpus) · **N1** (`fixture:` only) · **S1** (optional `gold_status.json` sidecar)

## Call

**READY (Go) for Implement** under locks **A / N1 / S1**. **Do not Implement in this stage.** Tom authorized Ready-checks + next steps; hub may chain Implement after this Ready Go.

Implement (when started) stages ≥2 distinct `fixture:` vehicles under private Gold root, loads optional incomplete-status sidecar, reuses Guide 11 `PrivateGoldSource` / `private-gold` CLI, proves multi-vehicle Met + honesty logs/docs. Guide 13 Soft Adjust / Ford / Vehicle Soft Adjust #7 / dual-product Done stay out.

### Implement readiness

| Track | Score | Why not 10 |
|-------|-------|------------|
| Guide 12 status-aware multi-vehicle PrivateGold fixtures | **9.0 / 10** | (1) Program `vehicle_rag_gold/valid/` is still **single-vehicle** (`fixture:demo-s2000-ap1` only — verified this Ready); multi-vehicle pack must be **staged at Implement** (P1 two dirs or P2 one release). (2) Soft pin allows root-level **and/or** per-release sidecar — Implement should prefer **root then release** (log both if present); slight precedence residual. (3) Second vehicle id `fixture:demo-miata-nb` is recommended but not pre-built — synthetic adapt + hash recompute at Implement. (4) Full Compose/Ollama ingest may hit env gap — guide allows unit-test attestation. |

**Not inflated:** A/N1/S1 Tom-authorized; Guide 11 adapter **live** (`private_gold_source.py`); guide pins/phases/DoD/blast/edges explicit; checklist unchecked; Guide 13 Soft Adjust out; no OEM/Ford wait.

### Alignment (guide ↔ live truth)

| Check | Status |
|-------|--------|
| Locks A / N1 / S1 | **Aligned** |
| Guide 11 adapter prerequisite | **Verified** — `mecharag/private_gold_source.py` present; N1 reject `cat:`/`private_oem` |
| `gold_status.py` | **Absent** — expected pre-Implement |
| Program fixtures multi-vehicle | **Not present** — Implement must stage (called out in guide A2) |
| `multi_doc_family_manifest` | **Same** `vehicle_id` twice — insufficient alone (guide edge) |
| Guide 13 Soft Adjust / Ford / #7 | **Out of Met** |
| Checklist unchecked | **Correct** for Ready |
| Public flip / freeze / LICENSE | **Leave alone** |

### Evidence attached this Ready-check

| Item | Result |
|------|--------|
| Write Met | `110a12b` |
| HEAD | `110a12b` |
| Guide 11 adapter | Present; discover + N1 gates intact |
| Program valid vids | `minimal` / `multi_doc` → only `fixture:demo-s2000-ap1` |
| Sidecar module | Not built yet (correct) |

### Blast radius / rollback

**Blast:** `private_gold_source.py` and/or new `gold_status.py`, ingest log lines, tests, thin ARCHITECTURE/GETTING_STARTED — **not** ranking, LICENSE, §9, Drive, Guide 13 Soft Adjust.

**Rollback:** Revert Guide 12 commits; Guide 11 single-vehicle path remains.

### Edge cases (guide covers)

- One vehicle only → fail Met  
- Sidecar missing → OK  
- Sidecar invalid JSON → fail closed  
- `zero_gap=false` → ingest proceeds + honesty  
- `gold_status.json` basename skipped in discover  
- `cat:` / `private_oem` → reject (N1)  

### Refinements still required before Implement?

**None blocking.** Soft Implement preference (not a Ready No-Go): sidecar load order **root `gold_status.json` then per-release**; Met staging use **P1** (two dirs) for clearest distinct-vehicle proof.

### Explicit non-claims (this stage)

- No Implement started  
- No Guide 13 Soft Adjust  
- No Ford PTS / Vehicle Soft Adjust #7 wait  
- No dual-product Done · No CE lift invent · No Drive ingest  

### QUALITY_STANDARD §5

Assumptions listed; spoke stayed in Ready slice; blast ≥2 angles; edges planned; numeric score + why not 10; no scope creep.

### Stop

Ready DoD Met (**Go 9.0/10**). Under Tom authorize + A/N1/S1, Implement may start on a dedicated Implement stage/handoff — **do not** silent-code from Ready alone.
