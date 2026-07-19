# Ready-check note — Mechanic Guide 14 Soft Adjust live PrivateGold pilot (pass 163)

**Date:** 2026-07-19  
**Repo:** `mechanic_rag`  
**Stage:** Ready check before code  
**Guide:** `docs/dev_guides/2026-07-19_dev_guide_14_soft_adjust_live_present_only_private_gold_pilot.md` (Write Met `274a14c`)  
**Handoff:** `second_brain/docs/2026-07-19_spoke_mechanic_ready_guide14_pass163_handoff.md`  
**Locks:** **A** (live Soft Adjust pilot) · **L1** (hybrid) · **B1** (receipt→`gold_status`)  
**Prereqs:** Guide 13 Review Pass `845528f` · Prioritize `8974653`  
**Tom authorize:** Ready checks + next steps; no Ford 1–2 weeks  

## Call

**READY (Go) for Implement** under locks **A / L1 / B1**. **Do not Implement in this stage.** Tom authorized Ready-checks; hub may chain Implement after this Ready Go.

Implement (when started) ships thin B1 mapper (`present_only_receipt.json` → `gold_status.json` with `friend_publish_eligible=false`), Soft Adjust-loads live Vehicle emit `cat__2017-f-150` when present, keeps Guide 13 synthetic Soft Adjust CI green, updates honesty docs — **not** dual-product Done / friend Review Met / Ford / Guide 15.

### Implement readiness

| Track | Score | Why not 10 |
|-------|-------|------------|
| Guide 14 Soft Adjust live local present-only PrivateGold pilot | **8.8 / 10** | (1) Live pack is **large** (verified: 3 docs; service_manual alone **1086** units) — Implement must prefer `PrivateGoldSource.load_all` / load attestation for Met; full Compose/Ollama upsert may be slow or env-gapped (guide allows). (2) Soft residual: gold root = parent `out/live` vs release-dir sidecar — **Implement preference: write `gold_status.json` into the release dir** (`cat__2017-f-150/`) for clearest single-vehicle pilot. (3) Mapper CLI entry (`python -m` vs `scripts/`) sketched only — pick smallest. (4) Cross-repo sibling path to gitignored `second_brain/.../out/live` — L1 covers prune/missing. |

**Overall:** **8.8 / 10** · **Go**

**Not inflated:** A/L1/B1 Tom-authorized; Guide 13 Soft Adjust live (`require_soft_adjust_status`); live emit + receipt verified this Ready; checklist unchecked; Ford / rclone / Done / Guide 15 out.

### Alignment (guide ↔ live truth)

| Check | Status |
|-------|--------|
| Locks A / L1 / B1 | **Aligned** |
| Guide 13 Soft Adjust policy | **Verified** — `require_soft_adjust_status` + friend reject |
| Live emit path | **Verified** — `…/out/live/cat__2017-f-150/` has manifest + `present_only_receipt.json` |
| Receipt fields | **Verified** — `vehicle_id=cat:2017-f-150`, `complete_library=false` |
| Manifest Soft Adjust identity | **Verified** — `cat:` + `private_oem` |
| `receipt_to_gold_status` module | **Absent** — expected pre-Implement |
| Guide 13 synthetic suite | **Green** — 17 passed (present_only + gold_status subset this Ready) |
| Dual-product Done / Ford / rclone / Guide 15 | **Out** |
| Checklist unchecked | **Correct** for Ready |

### Evidence attached this Ready-check

| Item | Result |
|------|--------|
| Write Met | `274a14c` |
| HEAD (pre-Ready commit) | `274a14c` |
| Guide 13 Soft Adjust | Live — friend reject + status require |
| Live emit | Present; 3 docs; SM units=1086 |
| Mapper | Not built yet (correct) |

### Blast radius / rollback

**Blast:** New thin `receipt_to_gold_status` (+ tests/CLI), live pilot attestation, thin ARCHITECTURE/GETTING_STARTED — **not** Guide 13 Soft Adjust policy rewrite, ranking, LICENSE, §9, Vehicle assemble reopen, friend rclone, Guide 15.

**Rollback:** Revert Guide 14 mapper/docs; Guide 13 Soft Adjust remains Met.

### Edge cases (guide covers)

- Live emit missing → L1 mapper + synthetic CI still Met  
- Bad/missing receipt → mapper fail closed  
- Missing `gold_status` → Soft Adjust fail closed  
- Hand-set `friend_publish_eligible=true` → Soft Adjust reject  
- Drive URL root → forbidden  

### Refinements still required before Implement?

**None blocking.** Soft Implement preferences (not Ready No-Go):

1. Prefer **release-dir** `gold_status.json` for the `2017-f-150` pilot.  
2. Prefer **load attestation** (≥1 doc) over full DB upsert for Met unless Compose/Ollama comfortably up.  
3. Mapper tests use **fixture receipt only** — never commit live OEM into `mechanic_rag`.

### Explicit non-claims (this stage)

- No Implement started  
- No Ford PTS / friend rclone / CE invent  
- No dual-product Done · No Guide 15 Write  
- No friend Soft Adjust Review Met  

### QUALITY_STANDARD §5

Assumptions listed; spoke stayed in Ready slice; blast ≥2 angles; edges planned; numeric score + why not 10; no scope creep; verification plan in guide.

### Stop

Ready DoD Met (**Go 8.8/10**). Under Tom authorize + A/L1/B1, Implement may start on a dedicated Implement stage/handoff — **do not** silent-code from Ready alone.
