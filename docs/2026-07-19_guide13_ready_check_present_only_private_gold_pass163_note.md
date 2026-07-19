# Ready-check note — Mechanic Guide 13 Soft Adjust present-only PrivateGold (pass 163)

**Date:** 2026-07-19  
**Repo:** `mechanic_rag`  
**Stage:** Ready check before code  
**Guide:** `docs/dev_guides/2026-07-19_dev_guide_13_soft_adjust_present_only_private_gold.md` (Write Met `085b55f`)  
**Handoff:** `second_brain/docs/2026-07-19_spoke_mechanic_ready_guide13_pass163_handoff.md`  
**Prereqs:** Guide 12 Review Pass `e336f7d` · Vehicle Soft Adjust #7 Review Pass `005560b`  
**Tom authorize:** Ready checks + next steps; no Ford 1–2 weeks  

## Call

**READY (Go) for Implement** — Soft Adjust local present-only PrivateGold. **Do not Implement in this stage.** Tom authorized Ready-checks; hub may chain Implement after this Ready Go.

Implement (when started) Soft Adjusts `PrivateGoldSource` so synthetic `cat:` / `private_oem` packs ingest only with valid `gold_status` honesty (`zero_gap=false`, `present_only=true`, `friend_publish_eligible=false`); keeps Guide 11/12 `fixture:` path unchanged; proves Met without Ford / OEM in git / dual-product Done.

### Implement readiness

| Track | Score | Why not 10 |
|-------|-------|------------|
| Guide 13 Soft Adjust present-only local PrivateGold | **8.9 / 10** | (1) Synthetic Met pack (`cat:demo-synthetic-f150` + `private_oem` + sidecar) is **not pre-built** — Implement must adapt program `vehicle_rag_gold` shape under tmp/gitignored root and recompute hashes. (2) Soft residual on `friend_publish_eligible=true` + `zero_gap=true`: Met tests must reject / not claim; architecture allows policy Soft Adjust — **Implement preference: reject in Soft Adjust code for Guide 13** (friend path out of Met; avoids Done drift). (3) `gold_status.honesty_log_message` does not yet emit `friend_publish_eligible` — extend at Implement. (4) Full Compose/Ollama ingest may hit env gap — unit-test attestation OK (same as Guides 11/12). |

**Overall:** **8.9 / 10** · **Go**

**Not inflated:** Write pins clear; N1 reject still live (verified); library profile already allows `cat:` / `private_oem`; Guide 12 sidecar API live; checklist unchecked; Ford / rclone / Done / Guide 12 reopen out.

### Alignment (guide ↔ live truth)

| Check | Status |
|-------|--------|
| Soft Adjust shape (local + status-required non-fixture) | **Aligned** in guide |
| N1 still rejects `cat:` / `private_oem` | **Verified** — `private_gold_source._enforce_n1_met` |
| `gold_status.py` collect/load | **Verified** — optional today; Soft Adjust must require when non-fixture present |
| Library validate allows `cat:` | **Verified** — `validate_manifest` library profile |
| Fixture path (sidecar optional) | **Preserved** by guide pins |
| Dual-product Done / Ford / rclone / Guide 12 reopen | **Out** |
| Checklist unchecked | **Correct** for Ready |
| Public fail-closed / FixtureSource | **Leave alone** |

### Evidence attached this Ready-check

| Item | Result |
|------|--------|
| Write Met | `085b55f` |
| HEAD (pre-Ready commit) | `085b55f` |
| Guide 12 Review | `e336f7d` |
| Soft Adjust #7 Review | `005560b` (honesty ref only) |
| N1 reject live | Present — Soft Adjust target |
| `friend_publish_eligible` in honesty log | **Absent** — Implement extend |

### Blast radius / rollback

**Blast:** `private_gold_source.py` (split N1 vs Soft Adjust), `gold_status.py` (required + `friend_publish_eligible` checks/log), `ingest_cmd.py` honesty INFO, new `tests/test_private_gold_present_only.py`, thin ARCHITECTURE/GETTING_STARTED — **not** ranking, LICENSE, §9, Guide 12 Met reopen, Vehicle Soft Adjust #7 code, Ford, rclone.

**Rollback:** Revert Guide 13 Soft Adjust commits; Guide 11/12 fixture behavior remains.

### Edge cases (guide covers)

- `fixture:` only, no sidecar → proceed  
- `cat:` / `private_oem`, no sidecar → fail closed  
- Invalid sidecar JSON → fail closed  
- `friend_publish_eligible=true` + `zero_gap=false` → fail closed  
- Mixed fixture + cat → status required for whole ingest  
- Drive URL root → still forbidden  

### Refinements still required before Implement?

**None blocking.** Soft Implement preferences (not Ready No-Go):

1. Reject `friend_publish_eligible=true` in Soft Adjust code for Guide 13 (even if `zero_gap=true`) — friend path out of Met.  
2. Extend honesty log with `friend_publish_eligible=…`.  
3. Stage Met pack under pytest `tmp_path` / gitignored tmp — never commit OEM or synthetic OEM-looking binaries.

### Explicit non-claims (this stage)

- No Implement started  
- No Ford PTS / friend rclone / CE invent  
- No dual-product Done · No Guide 12 reopen  
- No live Drive Soft Adjust Review Met  

### QUALITY_STANDARD §5

Assumptions listed; spoke stayed in Ready slice; blast ≥2 angles; edges planned; numeric score + why not 10; no scope creep; verification plan in guide.

### Stop

Ready DoD Met (**Go 8.9/10**). Under Tom authorize, Implement may start on a dedicated Implement stage/handoff — **do not** silent-code from Ready alone.
