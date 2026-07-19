# Dev Guide 15 Soft Adjust — PrivateGold ask / eval plane

**Date:** 2026-07-19  
**Repo:** `mechanic_rag`  
**Work item:** Guide 15 Soft Adjust — prove Soft Adjust `cat:` PrivateGold through `/api/ask` (synthetic Met) with incomplete-Gold honesty  
**Stage that authored this:** Write-dev-guide (pass 163)  
**Status:** **Review Pass** (Soft Adjust ask/eval Met — hybrid unit; HTTP env gap documented)  
**Prerequisite:** Guide 14 Review Pass (`c4254b3`); Prioritize Met (`2636aa1`) locks **A / Q1 / E1**; Write Met `66e3dc9`; Ready Go `b67b9fa`; Implement `cb11b04`  
**Handoff (Write):** `second_brain/docs/2026-07-19_spoke_mechanic_write_guide15_pass163_handoff.md`  
**Handoff (Ready):** `second_brain/docs/2026-07-19_spoke_mechanic_ready_guide15_pass163_handoff.md`  
**Handoff (Implement):** `second_brain/docs/2026-07-19_spoke_mechanic_implement_guide15_pass163_handoff.md`  
**Handoff (Review):** `second_brain/docs/2026-07-19_spoke_mechanic_review_guide15_pass163_handoff.md`  
**Ready note:** `docs/2026-07-19_guide15_ready_check_private_gold_ask_eval_pass163_note.md`  
**Env gap note:** `docs/2026-07-19_guide15_implement_env_gap_pass163_note.md`  
**Review note:** `docs/2026-07-19_guide15_review_private_gold_ask_eval_pass163_note.md`  
**Prioritize:** `mechanic_rag/docs/2026-07-19_prioritize_next_after_guide14_pass163.md`  

**Tom / hub locks (pass 163 — do not reopen):**

| Pin | Lock |
|-----|------|
| Shape **(A)** | Soft Adjust **PrivateGold ask / eval** plane (close Soft Adjust query doneness) |
| Met vehicle **(Q1)** | Synthetic Soft Adjust `cat:demo-synthetic-f150` + `private_oem` + `gold_status` (Guide 13 shape) — **no** live F-150 upsert Met |
| Eval depth **(E1)** | Ask smoke + incomplete-Gold honesty docs — **not** full Soft Adjust golden suite (E2) · **not** UI Soft Adjust packaging (E3) |
| Friend / Drive / Ford | Out — no rclone · no friend Soft Adjust Review Met · no Ford PTS |
| Dual-product Done | **Forbidden claim** |
| Guide 13–14 | Closed — do not reopen Soft Adjust ingest policy / live pilot Met |

---

## Objective

Close the **Soft Adjust PrivateGold → ask** consumer loop without Ford or friend zero-gap:

1. **Ingest (Soft Adjust):** Stage Guide 13 synthetic Soft Adjust pack (`cat:demo-synthetic-f150` / `private_oem` + authorizing `gold_status`) and index via `mecharag ingest --source private-gold` when Compose/Ollama up — **or** prove vehicle/row presence another attested way if already indexed.  
2. **Ask Soft Adjust:** `POST /api/ask` with `vehicle_id=cat:demo-synthetic-f150` and a question grounded in the synthetic Soft Adjust text returns a **contract-valid** response (`answered` **or** `insufficient_evidence`) scoped to that vehicle — **no** cross-vehicle leak to fixture S2000.  
3. **Honesty:** Incomplete / present-only Soft Adjust Gold may yield thin citations or insufficient-evidence — docs + optional log/diag note Soft Adjust honesty; **≠** dual-product Done ≠ friend Soft Adjust Review Met.  
4. **E1 depth:** Ask smoke (+ optional `mecharag eval --retrieval-only` one Soft Adjust case if cheap); **not** n≥N Soft Adjust goldens.  
5. **CI:** Keep Guide 13–14 Soft Adjust unit tests green; no OEM in git; no Guide 14 reopen; no live corpus upsert Met.  
6. **Stop.** No Ford; no rclone; no CE invent; no more live PrivateGold upsert as Guide 15 Met.

**Success signal (after Implement):**  
- Soft Adjust vehicle known to ask path after Soft Adjust private-gold ingest (or attested index).  
- Ask smoke for `cat:demo-synthetic-f150` succeeds contractually when env up; if env gap → documented + unit/contract Soft Adjust ask-path attestation still Met (same hybrid pattern as prior Guides).  
- Fixture ask path unchanged.  
- Docs cannot claim dual-product Done / friend Review Met / Ford required for Met.

---

## Learning notes (interview-portable)

1. **Ingest Met ≠ query Met** — Adapter Soft Adjust proves Gold can enter the index; ask Soft Adjust proves the product plane can retrieve/answer under that identity.  
2. **Vehicle scoping as tenancy** — Every ask carries `vehicle_id`; Soft Adjust Met is proving Soft Adjust identity is first-class in that scope, not inventing a new API.  
3. **Incomplete evidence is valid** — Present-only / Soft Adjust Gold may honestly return `insufficient_evidence`; that is not failure of Soft Adjust ask Met.  
4. **Synthetic stand-in for query Met** — Same anti-OEM-in-git pattern as Guide 13: prove Soft Adjust ask without live corpus upsert.

---

## References (paths only)

- `mechanic_rag/docs/dev_guides/2026-07-19_dev_guide_13_soft_adjust_present_only_private_gold.md`  
- `mechanic_rag/docs/dev_guides/2026-07-19_dev_guide_14_soft_adjust_live_present_only_private_gold_pilot.md`  
- `mechanic_rag/tests/test_private_gold_present_only.py` (synthetic Soft Adjust staging helper)  
- `mechanic_rag/tests/test_soft_adjust_ask_plane.py` (Guide 15 Soft Adjust pack → Met vehicle)  
- `mechanic_rag/web/src/server/__tests__/ask_soft_adjust_private_gold.test.ts` (Guide 15 Soft Adjust ask unit)  
- `mechanic_rag/mecharag/private_gold_source.py` / `ingest_cmd.py`  
- `mechanic_rag/web/src/server/ask.ts` / `web/src/app/api/ask`  
- `mechanic_rag/contracts/ask_request.schema.json` / `ask_response.schema.json`  
- `mechanic_rag/GETTING_STARTED.md` (fixture + Soft Adjust ask curl)  
- `mechanic_rag/docs/ARCHITECTURE.md` §8 ask contract  
- `second_brain/docs/workflow_os/rails/QUALITY_STANDARD.md`

---

## Architecture constraints (binding)

1. **No ask schema fork** — Keep `{ vehicle_id, question }` (+ optional `doc_family`); Soft Adjust is identity + indexed corpus, not a new request field.  
2. **Reuse Soft Adjust ingest** — Guide 13 policy; do not reopen `friend_publish_eligible` / N1 fixture path.  
3. **Q1 only for Met** — Synthetic Soft Adjust vehicle; live `cat:2017-f-150` ask / full upsert **out of Met**.  
4. **E1 only** — Ask smoke + honesty; no Soft Adjust n=44 suite; no UI Soft Adjust selector Met.  
5. **Vehicle scoping** — Soft Adjust ask must not retrieve fixture-only chunks for Soft Adjust vehicle_id (and vice versa).  
6. **No OEM in git** — Synthetic Soft Adjust text only for Met pack.  
7. **Honesty** — Soft Adjust ask Met ≠ dual-product Done ≠ friend Soft Adjust Review Met.  
8. Prefer ≤300 lines/file for any new helper (hard max 400).

---

## Soft pins (binding for Ready / Implement)

| Pin | Locked default |
|-----|----------------|
| Met vehicle **(Q1)** | `cat:demo-synthetic-f150` + `rights_class=private_oem` + Guide 13 `gold_status` (present-only / `zero_gap=false` / `friend_publish_eligible=false`) |
| Staging | Reuse Guide 13 synthetic Soft Adjust pack under tmp / gitignored private Gold root (same shape as `tests/test_private_gold_present_only.py`) |
| Ingest | `MECHANIC_PRIVATE_GOLD_ROOT=<synth>` + `mecharag ingest --source private-gold` when env up |
| Ask smoke | `POST /api/ask` with Soft Adjust `vehicle_id` + question about synthetic Soft Adjust content (e.g. oil capacity / filter from staged text) |
| Acceptable outcomes | HTTP 200 contract body with `answered` **or** `insufficient_evidence` — both OK for Soft Adjust Met if vehicle scoping holds |
| Fail cases | `404 unknown vehicle_id` before ingest; cross-vehicle citation of fixture S2000 for Soft Adjust ask |
| Env gap | If Compose/Next/Ollama down: attest Soft Adjust vehicle registration / retrieval unit path + document gap; fixture ask regression still green |
| Eval **(E1)** | Optional one Soft Adjust golden or `--retrieval-only` smoke — **not** required full suite |
| Docs | Thin ARCHITECTURE / GETTING_STARTED: Soft Adjust ask smoke Met ≠ Done ≠ friend Review |
| Forbidden | Live F-150 upsert Met; Ford; rclone; CE invent; dual-product Done; Guide 14 reopen |

### Example ask smoke (operator)

```bash
# After Soft Adjust private-gold ingest of synthetic pack:
curl -s -X POST localhost:3000/api/ask \
  -H 'content-type: application/json' \
  -d '{"vehicle_id":"cat:demo-synthetic-f150","question":"Drain oil with vehicle level — what is the oil capacity procedure?"}'
# Expect: contract-valid JSON; vehicle_id echoed Soft Adjust id; no fixture:honda-s2000-demo citations
```

---

## Locked decisions (do not reopen)

| Decision | Lock |
|----------|------|
| Shape | **A** — Soft Adjust ask/eval plane |
| Met vehicle | **Q1** — synthetic Soft Adjust `cat:demo-synthetic-f150` |
| Eval depth | **E1** — ask smoke + honesty |
| Live Soft Adjust ask / full upsert | Out of Met |
| Dual-product Done | Forbidden |

---

## Acceptance criteria

- [x] Synthetic Soft Adjust pack staged + Soft Adjust private-gold ingest (or attested index) for `cat:demo-synthetic-f150`  
- [x] Ask smoke: Soft Adjust `vehicle_id` returns contract-valid response when env up **or** unit Soft Adjust ask attestation Met (env gap)  
- [x] Soft Adjust ask does not cite fixture-only vehicle chunks (scoping)  
- [x] Unknown Soft Adjust vehicle before ingest → 404 (or equivalent fail-closed)  
- [x] Incomplete-Gold honesty in docs (Soft Adjust ask Met ≠ Done ≠ friend Review Met)  
- [x] Guide 13–14 Soft Adjust unit tests still green  
- [x] Public fail-closed / fixture ask path unchanged  
- [x] No OEM in `mechanic_rag` git; no live F-150 upsert Met  

---

## Ordered step checklist

### Phase A — Anchor

- [x] **A1.** Confirm Guide 14 Review Pass + Prioritize A/Q1/E1.  
- [x] **A2.** Confirm ask path (`ask.ts`) requires `vehicle_id` + `vehicleExists`.  
- [x] **A3.** Confirm Guide 13 synthetic Soft Adjust staging pattern available.  

### Phase B — Soft Adjust index for Met vehicle

- [x] **B1.** Stage synthetic Soft Adjust pack + `gold_status` under private Gold root (tmp/gitignored).  
- [x] **B2.** Ingest `--source private-gold` when env up (or attest Soft Adjust vehicle rows exist).  
- [x] **B3.** Prove Soft Adjust `vehicleExists(cat:demo-synthetic-f150)` true after ingest.  

### Phase C — Ask smoke (E1)

- [x] **C1.** Ask Soft Adjust vehicle with grounded question; record outcome (`answered` or `insufficient_evidence`).  
- [x] **C2.** Assert response `vehicle_id` Soft Adjust; no fixture S2000 citation leak.  
- [x] **C3.** Env gap path: document + unit/contract Soft Adjust ask-scoping attestation.  

### Phase D — Honesty + regression

- [x] **D1.** Thin ARCHITECTURE / GETTING_STARTED Soft Adjust ask honesty.  
- [x] **D2.** Grep: no dual-product Done / friend Soft Adjust Review Met / Ford Met claim.  
- [x] **D3.** Guide 13–14 Soft Adjust pytest green; public fail-closed OK; fixture ask still works.  

### Phase E — Stop

- [x] **E1.** No live Soft Adjust upsert Met; no Guide 14 reopen; no CE invent.  
- [x] **E2.** Stop for Review.  

---

## Verification / Definition of Done

```bash
# From mechanic_rag/

# Soft Adjust unit Met (CI — primary when HTTP env gap)
cd web && npx vitest run src/server/__tests__/ask_soft_adjust_private_gold.test.ts
uv run pytest tests/test_soft_adjust_ask_plane.py tests/test_private_gold_present_only.py \
  tests/test_gold_status.py tests/test_receipt_to_gold_status.py \
  tests/test_private_gold_source.py tests/test_live_present_only_pilot.py -q
python3 scripts/checks/public_fail_closed.py fixtures

# Optional HTTP when stack up — see docs/2026-07-19_guide15_implement_env_gap_pass163_note.md
```

**DoD (Write):** This guide authored with A/Q1/E1 pins; steps/DoD/blast/edges; **no** Implement.  
**DoD (Ready):** Pins locked; Soft Adjust ask Met path clear.  
**DoD (Implement):** Phases A–E Met; Soft Adjust ask smoke (or attested env-gap path); honesty docs; no live upsert Met.  

**Implement evidence (2026-07-19):** Soft Adjust vitest **4 passed**; Soft Adjust + Guide 13–14 pytest **34 passed**; public fail-closed OK; HTTP env gap documented; honesty docs updated.

---

## Blast radius and risks

| Risk | Angle | Mitigation |
|------|-------|------------|
| Soft Adjust ask treated as Done | Honesty | Explicit ban; incomplete-Gold wording |
| Cross-vehicle leak | Safety | Assert Soft Adjust ask citations stay Soft Adjust / no fixture S2000 |
| Env gap blocks Met | Process | Hybrid attestation like Guides 11–14 |
| Scope into live F-150 upsert | Process | Q1 lock; Out of Met |
| Scope into Soft Adjust golden suite | Process | E1 lock |
| Breaking fixture ask | Regression | Keep fixture smoke; Soft Adjust additive |

**Blast radius:** Soft Adjust staging/ingest ops notes; Soft Adjust ask test helper; ARCHITECTURE/GETTING_STARTED honesty — **not** ask schema fork, ranking/CE, Guide 13–14 Soft Adjust policy reopen, live corpus upsert, UI Soft Adjust packaging.

### Rollback

Revert Guide 15 Soft Adjust ask/docs commits; Guide 13–14 Soft Adjust ingest Met remains; fixture ask unchanged.

---

## Edge-case handling

| Case | Behavior |
|------|----------|
| Soft Adjust vehicle not ingested | Ask → `404 unknown vehicle_id` (or equivalent) |
| Soft Adjust ingested; weak retrieval | `insufficient_evidence` OK for Met |
| Soft Adjust ingested; grounded hit | `answered` with Soft Adjust-scoped citations OK |
| Ask fixture vehicle after Soft Adjust ingest | Still works (regression) |
| Ask Soft Adjust with fixture question only | Soft Adjust outcome OK; must not invent fixture citations |
| Live `cat:2017-f-150` ask | Out of Met (ops later) |
| Compose/Next down | Document gap; unit Soft Adjust scoping attestation |

---

## Explicitly out of Met

- Ford PTS / Torque F1  
- Friend rclone / Soft Adjust #4 live republish  
- Dual-product Done  
- Full live Soft Adjust PrivateGold upsert / live F-150 ask Met  
- Soft Adjust golden suite (E2) / UI Soft Adjust packaging (E3)  
- CE invent / freeze reopen  
- Guide 13–14 Soft Adjust reopen  

---

## Stop conditions

- Write: this guide complete; handoff Results filled; no Implement.  
- Ready: score + evidence; Tom authorized Ready-checks.  
- Implement: Phases A–E Met under A/Q1/E1 — **Met**; Review next.

---

## Ready for Review?

**Review Pass** — see `docs/2026-07-19_guide15_review_private_gold_ask_eval_pass163_note.md`. Locks **A / Q1 / E1**. HTTP Soft Adjust ask remains optional operator when stack up.
