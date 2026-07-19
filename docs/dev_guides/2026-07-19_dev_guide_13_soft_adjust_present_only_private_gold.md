# Dev Guide 13 Soft Adjust — present-only local PrivateGold ingest

**Date:** 2026-07-19  
**Repo:** `mechanic_rag`  
**Work item:** Guide 13 Soft Adjust — allow **local** `cat:` / `private_oem` PrivateGold ingest when `gold_status.json` honesty says present-only / incomplete  
**Stage that authored this:** Write-dev-guide (pass 163)  
**Status:** **Implement Met** (Soft Adjust synthetic present-only; not dual-product Done)  
**Prerequisite:** Guide 12 Review Pass (`e336f7d`); Vehicle Soft Adjust #7 Review Pass (`005560b`); Ready Go `f3f75e9`  
**Handoff (Write):** `second_brain/docs/2026-07-19_spoke_mechanic_write_guide13_pass163_handoff.md`  
**Handoff (Implement):** `second_brain/docs/2026-07-19_spoke_mechanic_implement_guide13_pass163_handoff.md`  
**Prioritize context:** Guide 12 Soft Adjust follow-on; hub morning no-Ford path  

**Tom / hub locks (pass 163 — do not reopen):**

| Pin | Lock |
|-----|------|
| Shape | Soft Adjust PrivateGoldSource for **local** present-only Gold (`cat:` / `private_oem`) + `gold_status` honesty |
| Met identity | **Synthetic** `cat:` + `private_oem` Contract 7.2 tree under tmp/private root — **no OEM bytes in git**; **no** Ford PTS |
| Status | Require `gold_status.json` when ingesting non-`fixture:` (fail closed if missing/invalid) |
| Friend / Drive | **Not** friend rclone; **not** live Drive Soft Adjust Review Met; GD2 local root only |
| Dual-product Done | **Forbidden claim** |
| Guide 12 | **Do not reopen** — fixture multi-vehicle path stays Met |

---

## Objective

Close the Guide 11/12 Soft Adjust follow-on **without** waiting on Ford or zero-gap friend Gold:

1. Soft Adjust `PrivateGoldSource` so `cat:` + `private_oem` documents are accepted **only** when a valid `gold_status.json` is present and honesty fields say incomplete / present-only (not friend-publish ready).  
2. Keep Guide 11/12 **fixture:** path unchanged (sidecar still optional for `fixture:` packs).  
3. Prove Met on a **synthetic** present-only pack staged outside git (tmp / gitignored) — same Contract 7.2 shape, fake `cat:` id, synthetic text.  
4. Thin honesty docs: Guide 13 Met ≠ dual-product Done ≠ live Drive Soft Adjust Review ≠ friend zero-gap publish.  
5. **Stop.** No Ford PTS; no rclone; no Guide 12 reopen; no CE invent.

**Success signal (after Implement):**  
- `fixture:` ingest (Guide 11/12) still works without requiring sidecar.  
- Synthetic `cat:`/`private_oem` pack under `MECHANIC_PRIVATE_GOLD_ROOT` with `gold_status` (`zero_gap=false`, `friend_publish_eligible=false`, `present_only=true`) ingests ≥1 document.  
- Same pack **without** sidecar → fail closed.  
- Drive URL root still forbidden.  
- Docs cannot honestly claim dual-product Done or friend Soft Adjust Review Met.

**This Write does not Implement.**

---

## Learning notes (interview-portable)

1. **Policy Soft Adjust vs schema fork** — Rights/identity gates change at the adapter boundary; Contract 7.2 fields stay stable.  
2. **Status as authorization** — Incomplete Gold may be indexed for private use; friend publish remains a **separate** gate (`friend_publish_eligible` iff `zero_gap` — Soft Adjust #4 / #7).  
3. **Synthetic stand-in** — Prove policy code with non-OEM bytes so Met is not blocked on subscription capture.  
4. **Fail closed on missing honesty** — Non-fixture without sidecar is more dangerous than fixture without sidecar.

---

## References (paths only)

- `mechanic_rag/docs/dev_guides/2026-07-18_dev_guide_11_private_gold_source.md` (Soft Adjust follow-on)
- `mechanic_rag/docs/dev_guides/2026-07-19_dev_guide_12_status_aware_multi_vehicle_private_gold.md` (sidecar S1)
- `mechanic_rag/mecharag/private_gold_source.py` / `gold_status.py` / `ingest_cmd.py`
- `mechanic_rag/scripts/validate/validate_manifest.py` (`--profile library`)
- `second_brain/docs/dev_guides/2026-07-19_dev_guide_08_soft_adjust_07_fleet_gold_gap_registry.md` (`friend_publish_eligible` / `zero_gap`)
- `second_brain/docs/2026-07-19_vehicle_review_impl_soft_adjust_07_gap_registry.md` (Review Pass `005560b`)
- `second_brain/docs/workflow_os/rails/QUALITY_STANDARD.md`

---

## Architecture constraints (binding)

1. **Soft Adjust only** — extend Guide 11/12 modules; do not fork Contract 7.2 schema.  
2. **GD2** — local Gold root only; never Drive / rclone / OAuth.  
3. **Fixture path preserved** — `fixture:` + synthetic/redistributable still Met without requiring sidecar.  
4. **Non-fixture requires status** — any `cat:` or `private_oem` document → require root (or release) `gold_status.json`.  
5. **Honesty gates for Soft Adjust Met** — sidecar must include `present_only=true` **or** `zero_gap=false`; `friend_publish_eligible` must be **false** (or omitted → treat as false). Reject `friend_publish_eligible=true` unless `zero_gap=true` (and still **do not** claim friend Drive Review Met in Guide 13 DoD).  
6. **No OEM in git** — Met pack is synthetic text + synthetic `cat:` id under tmp/gitignored root.  
7. **No dual-product Done / Ford / friend publish claims.**  
8. Prefer ≤300 lines/file (hard max 400).

---

## Soft pins (binding for Ready / Implement)

| Pin | Locked default |
|-----|----------------|
| Trigger | Soft Adjust enforcement when any loaded doc has `vehicle_id` `^cat:` **or** `rights_class=private_oem` |
| Sidecar required | For Soft Adjust path: at least one valid `gold_status.json` (root preferred, else release dir) — **fail closed** if missing |
| Sidecar fields | Reuse Guide 12 keys + **`friend_publish_eligible`** (bool). Met pack: `zero_gap=false`, `present_only=true`, `complete_library=false`, `friend_publish_eligible=false` |
| Fixture path | Unchanged from Guide 11/12 (N1); sidecar optional |
| Met vehicle | Recommend `cat:demo-synthetic-f150` + `rights_class=private_oem` + synthetic `.txt` (adapt program `vehicle_rag_gold` shape; recompute hashes) |
| CLI | Reuse `--source private-gold` / `MECHANIC_PRIVATE_GOLD_ROOT` — optional env `MECHANIC_PRIVATE_GOLD_ALLOW_PRESENT_ONLY=1` **only if** needed to opt-in Soft Adjust; prefer **automatic** when non-fixture docs + valid sidecar (pin: **automatic**) |
| Library validate | Still `validate_manifest --profile library` (allows `cat:` / `private_oem`) |
| Logs | INFO honesty: Soft Adjust present-only ingest; `zero_gap` / `friend_publish_eligible`; ≠ dual-product Done |
| Docs | Thin ARCHITECTURE / GETTING_STARTED: Soft Adjust local present-only Met on synthetic; live OEM / Drive Review / friend publish still out |
| Forbidden | OEM in git; Ford PTS; rclone; Guide 12 reopen; CE invent; Done claim |

### Example Met sidecar

```json
{
  "schema_hint": "mechanic_gold_status/v1",
  "zero_gap": false,
  "publishable": false,
  "present_only": true,
  "complete_library": false,
  "friend_publish_eligible": false,
  "vehicle_ids": ["cat:demo-synthetic-f150"],
  "notes": "Guide 13 Soft Adjust synthetic present-only — not dual-product Done; not friend publish"
}
```

---

## Locked decisions (do not reopen)

| Decision | Lock |
|----------|------|
| Soft Adjust shape | Local present-only + status-required for non-fixture |
| Met | Synthetic `cat:` / `private_oem` (no OEM in git) |
| Friend / Drive Review | Out of Met |
| Guide 12 | Closed — do not reopen |

---

## Acceptance criteria (Implement Met)

- [x] Soft Adjust: `cat:` / `private_oem` accepted when valid `gold_status` present with present-only / incomplete honesty  
- [x] Non-fixture **without** sidecar → fail closed  
- [x] `fixture:` Guide 11/12 path unchanged (sidecar optional)  
- [x] Met: ingest ≥1 synthetic `cat:` document from staged tmp pack (unit-test attestation)  
- [x] `friend_publish_eligible=true` rejected on Soft Adjust path (Ready preference; even with `zero_gap=true`)  
- [x] Drive URL root still forbidden  
- [x] Public fail-closed / FixtureSource unchanged  
- [x] Thin honesty docs; no dual-product Done / friend Soft Adjust Review Met / Ford claim  
- [x] Targeted tests green; no Guide 12 regressions  

---

## Ordered step checklist

### Phase A — Anchor

- [x] **A1.** Confirm Guide 12 Review Pass + Soft Adjust #7 Review Pass refs.  
- [x] **A2.** Confirm current N1 reject of `cat:` / `private_oem` in `private_gold_source.py`.  
- [x] **A3.** Confirm `gold_status.py` collect/load API from Guide 12.  

### Phase B — Soft Adjust policy

- [x] **B1.** Split identity gate: fixture N1 vs Soft Adjust present-only (require status).  
- [x] **B2.** Enforce sidecar required for non-fixture; validate honesty fields.  
- [x] **B3.** Reject `friend_publish_eligible=true` on Soft Adjust path (Ready preference).  
- [x] **B4.** INFO honesty log on Soft Adjust ingest.  

### Phase C — Synthetic Met pack

- [x] **C1.** Stage synthetic `cat:` / `private_oem` Contract 7.2 pack + `gold_status` under tmp (no OEM).  
- [x] **C2.** Validate with library profile (via PrivateGoldSource load).  
- [x] **C3.** Prove ingest ≥1 doc (unit load); prove missing-sidecar fail closed.  

### Phase D — Prove + honesty

- [x] **D1.** Tests: Soft Adjust happy; missing sidecar fail; fixture path regression; friend flag; Drive URL still fail.  
- [x] **D2.** Thin ARCHITECTURE / GETTING_STARTED Soft Adjust honesty.  
- [x] **D3.** Grep: no dual-product Done; no friend Soft Adjust Review Met; no Ford/OEM-in-git claim.  

### Phase E — Stop

- [x] **E1.** No Guide 12 reopen; no rclone; no CE invent.  
- [x] **E2.** Stop at Implement DoD Met — Ready-for Review.  

---

## Verification / Definition of Done

```bash
# From mechanic_rag/
# 1) Fixture path still works (Guide 11/12) — optional sidecar
# ... existing private-gold fixture: pack ...

# 2) Soft Adjust Met (synthetic present-only) — unit-test attestation
# pytest stages cat: pack under tmp_path (no OEM in git)

# 3) Fail closed without sidecar — covered by tests

# 4) Tests
pytest tests/test_private_gold_source.py tests/test_gold_status.py tests/test_private_gold_present_only.py -q
# Evidence: 25 passed

# 5) Public unchanged
python3 scripts/checks/public_fail_closed.py fixtures

# 6) Honesty
rg -n 'Guide 13|present-only|friend_publish_eligible|dual-product|Soft Adjust' \
  docs/ARCHITECTURE.md GETTING_STARTED.md docs/VISION.md
# Must NOT claim: dual-product Done; friend Drive Soft Adjust Review Met; Ford required for Met
```

**DoD (Write):** This guide authored with Soft Adjust pins; steps/DoD/blast/edges; **no** Implement.  
**DoD (Ready):** Pins locked; synthetic Met path clear.  
**DoD (Implement):** Phases A–E Met; verification green; synthetic Soft Adjust Met without Ford/OEM in git.

---

## Blast radius and risks

| Risk | Angle | Mitigation |
|------|-------|------------|
| Accidental OEM in git | Legal | Synthetic Met only; gitignore private roots |
| Friend publish confusion | Honesty | `friend_publish_eligible=false` required for Soft Adjust Met; docs ban Done claim |
| Breaking fixture path | Regression | Keep N1 optional-sidecar path; tests |
| Silent Soft Adjust without status | Trust | Fail closed if non-fixture and no sidecar |
| Scope into rclone / Ford | Process | Explicit Out |

**Blast radius:** `private_gold_source.py`, `gold_status.py` (field checks), `ingest_cmd.py` logs, new tests, thin ARCHITECTURE/GETTING_STARTED — **not** ranking, LICENSE, §9, Guide 12 Met reopen, Vehicle Soft Adjust #7 code.

### Rollback

Revert Guide 13 Soft Adjust commits; Guide 11/12 fixture behavior remains.

---

## Edge-case handling

| Case | Behavior |
|------|----------|
| `fixture:` only, no sidecar | Proceed (Guide 11/12) |
| `cat:` / `private_oem`, no sidecar | Fail closed |
| Sidecar invalid JSON | Fail closed |
| `friend_publish_eligible=true` + `zero_gap=false` | Fail closed (inconsistent) |
| `friend_publish_eligible=true` + `zero_gap=true` | Allowed by policy Soft Adjust but **out of Guide 13 Met** (live zero-gap / friend path later) — pin: **reject in Guide 13 Met tests**; optional allow in code with honesty log if Implement prefers smaller gate — **Write pin: reject for Guide 13 Met** to avoid Done drift |
| Mixed fixture + cat in one root | Soft Adjust rules apply to cat docs; fixture docs still N1; whole ingest requires status because non-fixture present |
| Drive URL root | Still forbidden |
| Real MacBook OEM Gold later | Same Soft Adjust code path; **not** Met requirement this guide |

---

## Explicitly out of Met

- Ford PTS / Torque F1  
- Friend rclone / Soft Adjust #4 live republish  
- Dual-product Done  
- Guide 12 reopen  
- Claiming Vehicle Soft Adjust #7 Phase D pilot as Mechanic Met dependency beyond “Review Pass exists”

---

## Stop conditions

- Write: this guide complete; handoff Results filled; no Implement.  
- Ready (later): score + evidence; Tom authorized Ready-checks.  
- Implement (later): Phases A–E; synthetic Soft Adjust Met only.

---

## Ready for Ready-check?

**Write Met** → Ready Go `f3f75e9` → **Implement Met** this pass. Next: Review implementation.
