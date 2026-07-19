# Dev Guide 12 — Status-aware multi-vehicle PrivateGold fixture corpus

**Date:** 2026-07-19  
**Repo:** `mechanic_rag`  
**Work item:** Guide 12 — ≥2 `fixture:` vehicles under private Gold root + optional status sidecar honesty (`zero_gap=false`)  
**Stage that authored this:** Write-dev-guide (pass 163)  
**Status:** **Ready Met (9.0/10 Go)** — not Implemented; Ready note `docs/2026-07-19_guide12_ready_check_multi_vehicle_private_gold_pass163_note.md`  
**Prioritize SSOT:** `mechanic_rag/docs/2026-07-19_prioritize_next_after_guide11_pass163.md` (`35ffa92`)  
**Prerequisite:** Guide 11 PrivateGoldSource Review Pass (`5becff8` / Implement `b509ac0`)  
**Handoff (Write):** `second_brain/docs/2026-07-19_spoke_mechanic_write_guide12_pass163_handoff.md`  
**Hub:** `second_brain/docs/2026-07-19_prioritize_morning_no_ford_gap_registry_pass163.md`

**Tom / hub locks (pass 163 — do not reopen):**

| Pin | Lock |
|-----|------|
| Shape | **A** — multi-vehicle PrivateGold **fixture** corpus + status-aware honesty |
| Met identity | **N1** — `fixture:` only (no OEM in git; no `cat:` / `private_oem` for Met) |
| Status shape | **S1** — optional JSON sidecar (no Contract 7.2 schema fork) |
| Ford / Drive zero-gap | **Parked** — out of Met |
| Guide 13 Soft Adjust | **Out** — live OEM present-only Soft Adjust is a later guide |
| Dual-product Done | **Forbidden claim** |

---

## Objective

Prove PrivateGold **consumer** doneness beyond Guide 11’s single-vehicle Met:

1. Stage **≥2 distinct** `fixture:` `vehicle_id`s under `MECHANIC_PRIVATE_GOLD_ROOT` (Contract 7.2).  
2. Ingest via existing `PrivateGoldSource` / `mecharag ingest --source private-gold`.  
3. Load optional **`gold_status.json`** sidecar (S1) so incomplete Gold (`zero_gap=false` / `publishable=false` / `present_only` / `complete_library=false`) is **first-class** and honesty-logged — never dual-product Done.  
4. Thin docs: Guide 12 Met ≠ live Soft Adjust ≠ dual-product Done ≠ public flip change.  
5. **Stop.** No Guide 13 Soft Adjust; no ranking/CE; no Ford; no Vehicle Soft Adjust #7 wait.

**Success signal (after Implement):** Ingest under private root yields **≥2** distinct `fixture:` vehicles in DB (insert or idempotent skip OK); when sidecar present with `zero_gap=false`, logs/honesty docs make incompleteness unmistakable; missing sidecar does **not** fail Met; `FixtureSource` / public fail-closed unchanged.

**This Write does not Implement.**

---

## Learning notes (interview-portable)

1. **Corpus growth vs adapter invention** — Guide 11 landed the trust-root adapter; Guide 12 grows **coverage + honesty**, not a second ingest stack.  
2. **Status plane ≠ content plane** — Completeness/`zero_gap` is operator honesty (sidecar); Contract 7.2 remains the document schema.  
3. **Optional fail-open vs required fail-closed** — Sidecar absent → proceed; root env unset → still fail closed (Guide 11).  
4. **Multi-tenant RAG identity** — Distinct `vehicle_id` keys keep retrieval filters honest when the private root holds more than one car.

---

## References (paths only)

- `mechanic_rag/docs/2026-07-19_prioritize_next_after_guide11_pass163.md`
- `mechanic_rag/docs/dev_guides/2026-07-18_dev_guide_11_private_gold_source.md`
- `mechanic_rag/mecharag/private_gold_source.py` / `ingest_cmd.py` / `db_upsert.py`
- `mechanic_rag/contracts/normalized_document_manifest.schema.json`
- `mechanic_rag/scripts/validate/validate_manifest.py`
- `second_brain/docs/dev_guides/fixtures/vehicle_rag_gold/` (shape SSOT — today single-vehicle packs)
- `second_brain/docs/workflow_os/rails/QUALITY_STANDARD.md`

---

## Architecture constraints (binding)

1. **Reuse Guide 11 adapter** — extend discover/load lightly; do not fork `FixtureSource`; do not add Drive.  
2. **N1 Met** — every ingested `vehicle_id` must match `^fixture:`; reject `cat:` / `private_oem` (Guide 13 later).  
3. **No Contract 7.2 schema fork** — status lives in optional sidecar only (S1).  
4. **Sidecar optional** — missing `gold_status.json` → ingest proceeds; present → parse + log honesty fields.  
5. **Incomplete is ingestible** — `zero_gap=false` / `publishable=false` must **not** block Met ingest.  
6. **No dual-product Done / Soft Adjust Review Met / Drive-as-ingest claims.**  
7. **No OEM bytes in git** — stage packs in pytest `tmp_path` / gitignored private root only.  
8. Prefer ≤300 lines/file (hard max 400) for new helpers.

---

## Soft pins (binding for Ready / Implement)

| Pin | Locked default |
|-----|----------------|
| Met vehicles | **≥2 distinct** `fixture:` ids (recommend `fixture:demo-s2000-ap1` + `fixture:demo-miata-nb`) |
| Pack layout (either OK) | **(P1)** two release dirs under Gold root each with Contract 7.2 JSON + texts · **or (P2)** one release whose `documents[]` spans ≥2 `vehicle_id`s |
| Staging | Copy/adapt program `vehicle_rag_gold/valid/` shapes into tmp/private root; recompute hashes if text/`vehicle_id` change |
| Sidecar name | **`gold_status.json`** next to a release (same dir as that release’s manifest) and/or one root-level sidecar for the Gold root |
| Sidecar fields (soft schema) | Recommended keys: `schema_hint`=`mechanic_gold_status/v1`, `zero_gap` (bool), `publishable` (bool), `present_only` (bool), `complete_library` (bool), optional `vehicle_ids` (string[]), optional `notes` (string) |
| Sidecar missing | **OK** — do not fail Met |
| Sidecar present | Load + validate JSON object; log INFO honesty line including `zero_gap` / `publishable` / `present_only` / `complete_library` when set; never treat as Contract 7.2 document |
| Discover exclusion | Never treat `gold_status.json` as a release (even if malformed with `documents[]` — pin: **skip by basename**) |
| Module | Prefer thin `mecharag/gold_status.py` **or** small helpers in `private_gold_source.py` — keep ≤300 lines total new surface |
| CLI | Reuse `--source private-gold` / `MECHANIC_PRIVATE_GOLD_ROOT` — no new `--source` token required |
| Met proof | After ingest: count distinct `vehicle_id` from loaded docs ≥2; DB `vehicles` rows ≥2 when Compose up (else unit-test load_all count + document env gap) |
| Honesty docs | Thin ARCHITECTURE / GETTING_STARTED: multi-vehicle fixture PrivateGold + optional incomplete status; ≠ dual-product Done; ≠ Guide 13 Soft Adjust |
| Forbidden | OEM in git; `cat:` Met; schema fork; ranking/CE; LICENSE/§9 flip; Soft Adjust Review Met claim; waiting on Vehicle Soft Adjust #7 |

### Example sidecar (fixture honesty — incomplete on purpose)

```json
{
  "schema_hint": "mechanic_gold_status/v1",
  "zero_gap": false,
  "publishable": false,
  "present_only": true,
  "complete_library": false,
  "vehicle_ids": ["fixture:demo-s2000-ap1", "fixture:demo-miata-nb"],
  "notes": "Guide 12 synthetic incomplete status — not dual-product Done"
}
```

---

## Locked decisions (do not reopen)

| Decision | Lock |
|----------|------|
| Shape | **A** |
| Met identity | **N1** |
| Status | **S1** (optional sidecar) |
| Guide 13 Soft Adjust | Out of Met |

---

## Acceptance criteria (unchecked at Write — Implement later)

- [ ] Private Gold root stages ≥2 distinct `fixture:` vehicles (P1 or P2)  
- [ ] `mecharag ingest --source private-gold` indexes ≥2 vehicles (insert/skip OK)  
- [ ] Optional `gold_status.json` loaded when present; basename skipped by discover  
- [ ] Missing sidecar does not fail Met  
- [ ] Sidecar with `zero_gap=false` does not block ingest; honesty logged / docs clear  
- [ ] Guide 11 N1 gates retained (`cat:` / `private_oem` still rejected)  
- [ ] `FixtureSource` + public fail-closed unchanged  
- [ ] Thin honesty docs; no dual-product Done / Soft Adjust Review Met / Drive ingest claim  
- [ ] Targeted tests green; no ranking/OEM/Ford invent  

---

## Ordered step checklist

All boxes start unchecked. **Do not check boxes in Write / Ready-check.**

### Phase A — Anchor

- [ ] **A1.** Confirm Guide 11 adapter live (`private_gold_source.py`, private-gold CLI).  
- [ ] **A2.** Confirm program fixtures are single-vehicle today — multi-vehicle pack must be staged (not assumed present).  
- [ ] **A3.** Confirm locks A/N1/S1; Guide 13 Soft Adjust out.  

### Phase B — Multi-vehicle pack

- [ ] **B1.** Build staging helper or test fixture: ≥2 `fixture:` vehicles under tmp/private root (P1 or P2).  
- [ ] **B2.** Validate each release with `validate_manifest.py --profile library --no-allowlist` (or equivalent).  
- [ ] **B3.** Add Met `gold_status.json` with `zero_gap=false` (honesty path).  

### Phase C — Status-aware load

- [ ] **C1.** Implement sidecar load (optional); skip `gold_status.json` in discover.  
- [ ] **C2.** Wire INFO honesty log on ingest when sidecar present.  
- [ ] **C3.** Keep Guide 11 N1 reject for `cat:` / `private_oem`.  

### Phase D — Prove Met + honesty

- [ ] **D1.** Unit tests: two-vehicle load; discover skips sidecar; missing sidecar OK; `zero_gap=false` does not raise.  
- [ ] **D2.** Met ingest once (Compose if up) — ≥2 vehicles inserted/skipped.  
- [ ] **D3.** Thin ARCHITECTURE / GETTING_STARTED honesty.  
- [ ] **D4.** Grep: no dual-product Done; no Soft Adjust Review Met; no Drive ingest; no OEM in git.  

### Phase E — Stop

- [ ] **E1.** No Guide 13 Soft Adjust / ranking / LICENSE / §9 flip.  
- [ ] **E2.** Stop for Ready-check → Implement (authorized Ready-checks).  

---

## Verification / Definition of Done

```bash
# From mechanic_rag/
# 1) Stage $GOLD with ≥2 fixture: vehicles + optional gold_status.json (zero_gap=false)
export MECHANIC_PRIVATE_GOLD_ROOT="$GOLD"
mecharag ingest --source private-gold
# expect exit 0; ≥2 distinct fixture: vehicles inserted or skipped

# 2) Sidecar honesty visible in logs when present
# expect INFO mentioning zero_gap=false / publishable=false (or equivalent)

# 3) Public path unchanged
python3 scripts/checks/public_fail_closed.py fixtures   # OK

# 4) Tests
pytest tests/test_private_gold_source.py tests/test_gold_status.py -q
# (or equivalent new test module)

# 5) Honesty
rg -n 'Guide 12|multi-vehicle|gold_status|zero_gap|dual-product|Soft Adjust' \
  docs/ARCHITECTURE.md GETTING_STARTED.md docs/VISION.md
# Must NOT claim: dual-product Done; Soft Adjust Review Met; Drive ingest; OEM corpus
```

**DoD (Write):** This guide authored with A/N1/S1; steps/DoD/blast/edges; **no** Implement.  
**DoD (Ready):** Pins locked; Met pack path clear; blast/edges explicit.  
**DoD (Implement):** Phases A–E Met; verification green; fixture-first only.

---

## Blast radius and risks

| Risk | Angle | Mitigation |
|------|-------|------------|
| Sidecar mistaken for release | Data | Skip basename `gold_status.json` in discover |
| Incomplete Gold marketed as Done | Honesty | Sidecar + docs; never tick dual-product Done |
| Multi-doc same vehicle counted as multi-vehicle | Met cheat | Require **distinct** `vehicle_id` ≥2 |
| Scope into Guide 13 Soft Adjust | Process | Explicit out; N1 retained |
| OEM leak into git | Legal | Stage only under tmp / gitignored root |

**Blast radius:** `private_gold_source.py` and/or new `gold_status.py`, ingest log lines, tests, thin ARCHITECTURE/GETTING_STARTED — **not** ranking, LICENSE, §9, Drive, Vehicle Soft Adjust #7.

### Rollback

Revert Guide 12 commits; Guide 11 single-vehicle path remains.

---

## Edge-case handling

| Case | Behavior |
|------|----------|
| Only one `fixture:` vehicle in root | Fail Met (not Guide 12 DoD) |
| Sidecar missing | Proceed (optional) |
| Sidecar invalid JSON | Fail closed for that ingest run (clear error) — or soft-warn + proceed? **Pin: fail closed** if file exists but unreadable/invalid |
| Sidecar `zero_gap=true` on synthetic incomplete pack | Allowed but honesty docs still forbid Done claim; prefer Met pack uses `false` |
| `cat:` / `private_oem` in pack | Reject (N1) — Guide 13 |
| Drive URL as root | Still forbidden (Guide 11) |
| `multi_doc_family_manifest` alone | Insufficient — same `vehicle_id` twice ≠ multi-vehicle |

---

## Guide 13 Soft Adjust (explicitly out of Met)

When hub unparks after Vehicle Soft Adjust #7 + local present-only rebuild:

- Allow `cat:` + `private_oem` when sidecar says incomplete / present-only  
- Live local OEM Gold root ingest Soft Adjust  

Do **not** Implement in Guide 12.

---

## Stop conditions

- Write: this guide complete; handoff Results filled; no Implement.  
- Ready (later): score + evidence; Tom authorized Ready-checks.  
- Implement (later): Phases A–E; fixture-first only.

---

## Ready for Ready-check?

**Yes** — Guide 12 Write complete; locks A/N1/S1 pinned; multi-vehicle + optional sidecar Met path explicit. Do **not** Implement until Ready Met.
