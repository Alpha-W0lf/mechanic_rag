# Dev Guide 14 Soft Adjust — live local present-only PrivateGold pilot

**Date:** 2026-07-19  
**Repo:** `mechanic_rag` (+ read Vehicle live emit under `second_brain`)  
**Work item:** Guide 14 Soft Adjust — ingest **live** Vehicle RAG Gold emit (`cat:` / `private_oem`) via Guide 13 Soft Adjust after mapping `present_only_receipt.json` → `gold_status.json`  
**Stage that authored this:** Write-dev-guide (pass 163)  
**Status:** **Implement Met** (Soft Adjust live pilot; not dual-product Done)  
**Prerequisite:** Guide 13 Review Pass (`845528f`); Prioritize Met (`8974653`) locks **A / L1 / B1**; Ready Go `20cbd15`  
**Handoff (Write):** `second_brain/docs/2026-07-19_spoke_mechanic_write_guide14_pass163_handoff.md`  
**Handoff (Implement):** `second_brain/docs/2026-07-19_spoke_mechanic_implement_guide14_pass163_handoff.md`  
**Prioritize:** `mechanic_rag/docs/2026-07-19_prioritize_next_after_guide13_pass163.md`  

**Tom / hub locks (pass 163 — do not reopen):**

| Pin | Lock |
|-----|------|
| Shape **(A)** | Soft Adjust **live local** present-only PrivateGold pilot (Vehicle `out/live` emit → Mechanic Soft Adjust) |
| Met **(L1)** | **Hybrid** — live pilot DoD when emit present + CI keeps Guide 13 synthetic Soft Adjust green |
| Bridge **(B1)** | Thin mapper: `present_only_receipt.json` → `gold_status.json` (no Contract 7.2 fork) |
| Friend / Drive | **Not** friend rclone; **not** friend Soft Adjust Review Met; GD2 local only |
| Dual-product Done | **Forbidden claim** |
| Guide 13 / 15 | Guide 13 closed — do not reopen Soft Adjust policy; **no** Guide 15 Write this guide |

---

## Objective

Close the **library emit → Mechanic Soft Adjust ingest** loop without Ford PTS or friend zero-gap Drive:

1. **Bridge (B1):** Map Vehicle live `present_only_receipt.json` → Mechanic `gold_status.json` with Soft Adjust honesty (`zero_gap=false`, `present_only=true`, `complete_library=false`, `friend_publish_eligible=false`).  
2. **Point** `MECHANIC_PRIVATE_GOLD_ROOT` at the live emit root (local / gitignored) — never Drive.  
3. **Prove** Soft Adjust ingest of ≥1 document from live `cat:2017-f-150` / `private_oem` Contract 7.2 emit (Compose/Ollama when up; unit-test / load attestation if env gap).  
4. **L1:** Keep Guide 13 synthetic Soft Adjust tests green in CI; **never** commit OEM live bytes into `mechanic_rag` git.  
5. **Honesty:** Guide 14 Met ≠ dual-product Done ≠ friend Soft Adjust Review Met ≠ zero-gap publish.  
6. **Stop.** No Ford PTS; no rclone; no Guide 15; no CE invent.

**Success signal (after Implement):**  
- Mapper writes valid `gold_status.json` from live receipt (or fixture receipt in unit tests).  
- Live pack under private Gold root Soft Adjust-ingests ≥1 `cat:2017-f-150` document when emit present.  
- Missing `gold_status` still fail-closed (Guide 13).  
- Guide 13 synthetic tests still **25 passed** (or ≥ prior count).  
- Docs cannot claim dual-product Done / friend Review Met / Ford required for Met.

**This Write does not Implement.**

---

## Learning notes (interview-portable)

1. **Emit vs ingest ownership** — Library owns Contract 7.2 emit + present-only receipt; consumer owns Soft Adjust authorization (`gold_status`) and index writes.  
2. **Adapter / anti-corruption layer** — A thin mapper translates Vehicle receipt vocabulary into Mechanic Soft Adjust fields without forking either schema.  
3. **Hybrid Definition of Done** — Live pilot proves integration; synthetic CI proves policy regression without OEM in git.  
4. **Incomplete Gold is first-class** — Indexing present-only Gold is allowed; friend publish remains a separate gate (`friend_publish_eligible` iff `zero_gap`).

---

## References (paths only)

- `mechanic_rag/docs/dev_guides/2026-07-19_dev_guide_13_soft_adjust_present_only_private_gold.md` (Soft Adjust policy Met)  
- `mechanic_rag/mecharag/private_gold_source.py` / `gold_status.py` / `ingest_cmd.py`  
- `mechanic_rag/tests/test_private_gold_present_only.py` (synthetic Soft Adjust — L1 CI)  
- `second_brain/docs/dev_guides/2026-07-18_dev_guide_10_soft_adjust_live_rag_gold_emit.md`  
- `second_brain/docs/dev_guides/builders/vehicle_rag_gold_assembly/assemble_live_rag_gold.py`  
- **Live emit (gitignored, verified present at Prioritize/Write):**  
  `second_brain/docs/dev_guides/builders/vehicle_rag_gold_assembly/out/live/cat__2017-f-150/`  
  — `normalized_document_manifest.json` · `present_only_receipt.json` · text dirs  
- `second_brain/docs/workflow_os/rails/QUALITY_STANDARD.md`

---

## Architecture constraints (binding)

1. **Soft Adjust reuse** — Do **not** reopen Guide 13 Soft Adjust identity/status policy; only add B1 bridge + live pilot ops/proof.  
2. **GD2** — Local Gold root only; never Drive / rclone / OAuth.  
3. **B1 only** — Map receipt → `gold_status.json`; do **not** teach PrivateGoldSource to accept `present_only_receipt.json` as a status alias (B3 out).  
4. **No Contract 7.2 fork** — Receipt and `gold_status` stay sidecars.  
5. **No OEM in `mechanic_rag` git** — Live emit stays under Vehicle builder `out/live/` (gitignored) or operator-local paths.  
6. **L1 hybrid** — CI Met = Guide 13 synthetic Soft Adjust green; live Met = pilot when emit present.  
7. **Honesty** — `friend_publish_eligible` must remain **false** for this pilot; reject if mapper would set true.  
8. Prefer ≤300 lines/file (hard max 400) for new mapper module.

---

## Soft pins (binding for Ready / Implement)

| Pin | Locked default |
|-----|----------------|
| Live vehicle | `cat:2017-f-150` / `rights_class=private_oem` from Vehicle Soft Adjust live RAG Gold emit |
| Live path (canonical) | `second_brain/docs/dev_guides/builders/vehicle_rag_gold_assembly/out/live/cat__2017-f-150/` |
| Gold root for ingest | Prefer parent `…/out/live` with root `gold_status.json`, **or** write sidecar into the release dir (`cat__2017-f-150/gold_status.json`) — both OK (Guide 12/13 root-then-release collect) |
| Bridge **(B1)** | Thin CLI/module: read `present_only_receipt.json` → write `gold_status.json` |
| Mapped fields | `schema_hint=mechanic_gold_status/v1`; `zero_gap=false`; `present_only=true`; `complete_library` ← receipt.`complete_library` (expect false); `publishable=false`; `friend_publish_eligible=false` (**hard**); `vehicle_ids=[receipt.vehicle_id]`; notes cite Guide 14 + ≠ Done |
| CLI ingest | Reuse `mecharag ingest --source private-gold` + `MECHANIC_PRIVATE_GOLD_ROOT` |
| L1 CI | `pytest tests/test_private_gold_source.py tests/test_gold_status.py tests/test_private_gold_present_only.py` stay green; add mapper unit tests with **fixture receipt** (no OEM) |
| Live proof | Soft Adjust `load_all` / ingest ≥1 doc from live emit when path exists; if emit missing on Implement host → document gap + still ship mapper + synthetic CI (L1) |
| Docs | Thin ARCHITECTURE / GETTING_STARTED: live Soft Adjust **pilot** Met ≠ Done ≠ friend Review |
| Forbidden | OEM commit; Ford PTS; rclone; Guide 13 reopen; Guide 15 Write; Done claim; CE invent |

### Example mapped `gold_status.json` (from live receipt)

```json
{
  "schema_hint": "mechanic_gold_status/v1",
  "zero_gap": false,
  "publishable": false,
  "present_only": true,
  "complete_library": false,
  "friend_publish_eligible": false,
  "vehicle_ids": ["cat:2017-f-150"],
  "notes": "Guide 14 Soft Adjust live pilot from present_only_receipt — not dual-product Done; not friend publish"
}
```

### Mapper sketch (Implement — not this Write)

```text
Input:  <release>/present_only_receipt.json
Output: <gold_root or release>/gold_status.json
Rules:  friend_publish_eligible always false;
        present_only true;
        zero_gap false;
        complete_library from receipt (bool);
        vehicle_ids = [receipt.vehicle_id];
        fail closed if receipt missing/invalid or vehicle_id not ^cat:
```

Suggested module path: `mecharag/receipt_to_gold_status.py` + thin `scripts/` or `python -m mecharag…` entry (smallest correct).

---

## Locked decisions (do not reopen)

| Decision | Lock |
|----------|------|
| Shape | **A** — live Soft Adjust pilot |
| Met | **L1** — hybrid live + synthetic CI |
| Bridge | **B1** — receipt → `gold_status` |
| Guide 13 Soft Adjust policy | Closed |
| Guide 15 ask/eval | Out of this guide |

---

## Acceptance criteria (Implement Met)

- [x] B1 mapper: receipt → `gold_status` with Soft Adjust honesty fields; unit-tested on fixture receipt  
- [x] Live path: Soft Adjust status + ≥1 unit sample load for `cat:2017-f-150` (large-pack attestation; not full DB upsert)  
- [x] Without `gold_status` → fail closed (Guide 13; covered by synthetic Soft Adjust suite)  
- [x] Guide 13 synthetic Soft Adjust suite still green (L1)  
- [x] Drive URL root still forbidden  
- [x] No OEM bytes added to `mechanic_rag` git  
- [x] Thin honesty docs; no dual-product Done / friend Soft Adjust Review Met / Ford Met claim  
- [x] Public fail-closed unchanged  

---

## Ordered step checklist

### Phase A — Anchor

- [x] **A1.** Confirm Guide 13 Review Pass + Prioritize A/L1/B1.  
- [x] **A2.** Confirm live emit path exists.  
- [x] **A3.** Confirm release has manifest + `present_only_receipt.json`.  

### Phase B — Bridge (B1)

- [x] **B1.** Implement receipt → `gold_status` mapper (`mecharag/receipt_to_gold_status.py`).  
- [x] **B2.** Force `friend_publish_eligible=false`; set present-only / incomplete honesty.  
- [x] **B3.** Unit tests with synthetic fixture receipt (no OEM).  

### Phase C — Live Soft Adjust pilot

- [x] **C1.** Write `gold_status.json` into live release dir (Ready preference).  
- [x] **C2–C3.** Soft Adjust status + sample load attestation (≥1 unit / ≥1 doc); full Compose upsert optional / not Met-blocking.  

### Phase D — L1 regression + honesty

- [x] **D1.** Guide 13 Soft Adjust pytest trio + mapper + live pilot — **32 passed**.  
- [x] **D2.** Public fail-closed OK.  
- [x] **D3.** Thin ARCHITECTURE / GETTING_STARTED / VISION honesty.  
- [x] **D4.** No OEM committed under `mechanic_rag/`.  

### Phase E — Stop

- [x] **E1.** No Guide 13 reopen; no Guide 15; no Ford/rclone/CE invent.  
- [x] **E2.** Stop at Implement DoD Met — Ready-for Review.  

---

## Verification / Definition of Done

```bash
# Evidence this Implement:
pytest tests/test_private_gold_source.py tests/test_gold_status.py \
  tests/test_private_gold_present_only.py tests/test_receipt_to_gold_status.py \
  tests/test_live_present_only_pilot.py -q
# 32 passed

LIVE=../second_brain/docs/dev_guides/builders/vehicle_rag_gold_assembly/out/live/cat__2017-f-150
python -m mecharag receipt-to-gold-status "$LIVE/present_only_receipt.json" \
  --out "$LIVE/gold_status.json"

python3 scripts/checks/public_fail_closed.py fixtures
```

**DoD (Write):** This guide authored with A/L1/B1 pins; steps/DoD/blast/edges; **no** Implement.  
**DoD (Ready):** Pins locked; live path + mapper shape clear.  
**DoD (Implement):** Phases A–E Met; L1 green; live Soft Adjust pilot attested; no OEM in mechanic git; honesty docs.

---

## Blast radius and risks

| Risk | Angle | Mitigation |
|------|-------|------------|
| Accidental OEM commit | Legal | Live trees stay gitignored; mapper tests use fixture receipt |
| Friend publish confusion | Honesty | Mapper hard-sets `friend_publish_eligible=false`; docs ban Done |
| Huge live corpus ingest cost | Ops | Met allows load attestation; full DB ingest optional when env up |
| Breaking Guide 13 Soft Adjust | Regression | L1 pytest gate; no policy reopen |
| Scope into Guide 15 ask/eval | Process | Explicit Out |
| Live emit pruned | Env | L1: ship mapper + synthetic CI; document live gap |

**Blast radius:** New thin mapper module + tests; optional thin CLI; ARCHITECTURE/GETTING_STARTED honesty — **not** Guide 13 Soft Adjust policy rewrite, ranking, LICENSE, §9, Vehicle assemble reopen, friend rclone.

### Rollback

Revert Guide 14 mapper/docs commits; Guide 13 Soft Adjust remains Met.

---

## Edge-case handling

| Case | Behavior |
|------|----------|
| Live emit missing | L1: mapper + synthetic CI still Met; live pilot marked gap in Implement note |
| Receipt missing / invalid JSON | Mapper fail closed |
| Receipt `vehicle_id` not `^cat:` | Mapper fail closed |
| `gold_status` missing after map skipped | Soft Adjust fail closed (Guide 13) |
| Operator sets `friend_publish_eligible=true` by hand | Soft Adjust rejects (Guide 13 Ready preference) |
| Sidecar only at release dir | OK — collect root-then-release |
| Drive URL as Gold root | Still forbidden |
| Multiple `cat__*` under `out/live` | Pilot Met = ≥1 vehicle (`2017-f-150`); multi-vehicle live later |

---

## Explicitly out of Met

- Ford PTS / Torque F1  
- Friend rclone / Soft Adjust #4 live republish  
- Dual-product Done  
- Guide 15 ask/eval Write  
- Teaching Soft Adjust to accept receipt basename as status (B3)  
- Reopening Guide 13 Soft Adjust policy  
- Committing live OEM text into `mechanic_rag`  

---

## Stop conditions

- Write: this guide complete; handoff Results filled; no Implement.  
- Ready (later): score + evidence; Tom authorized Ready-checks.  
- Implement (later): Phases A–E; L1 + live pilot when emit present.

---

## Ready for Ready-check?

**Write Met** → Ready Go `20cbd15` → **Implement Met** this pass. Next: Review implementation.
