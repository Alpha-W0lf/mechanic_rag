# Dev Guide 11 — PrivateGoldSource (fixture-first Contract 7.2 ingest)

**Date:** 2026-07-18 / 2026-07-19  
**Repo:** `mechanic_rag`  
**Work item:** Guide 11 — implement **`PrivateGoldSource`** adapter + CLI ingest from a **local Gold root** (GD2); fixture-first Met  
**Stage that authored this:** Write-dev-guide (pass 163)  
**Status:** **Ready Met (8.8/10)** — not Implemented; Ready note `docs/2026-07-19_guide11_ready_check_private_gold_source_pass163_note.md`  
**Context SSOT:** `mechanic_rag/docs/2026-07-18_private_gold_source_context_summary.md`  
**Handoff (Write):** `second_brain/docs/2026-07-18_spoke_mechanic_write_private_gold_source_pass163_handoff.md`  
**Handoff (Gather):** `second_brain/docs/2026-07-18_spoke_mechanic_gather_private_gold_source_pass163_handoff.md`  
**Hub lock:** `second_brain/docs/2026-07-19_hub_decision_lock_mechanic_private_gold_write_pass163.md`  
**Prerequisite:** Guide 10 library RAG Gold **fixture emit** Met; Contract 7.2 schemas/validators Met; Guide 01 ingest path live for fixtures

**Tom / hub locks (pass 163 — do not reopen):**

| Pin | Lock |
|-----|------|
| Write timing | **A** — Write/Implement Guide 11 now (fixture-first); do **not** wait for live Soft Adjust Review |
| First Met identity | **N1** — Met on **`fixture:`** Contract 7.2 tree under a **private Gold root** (not `fixtures/` allowlist) |
| Live Soft Adjust Review | **Parked / out of Met** — no live OEM / `2017-f-150` / `private_oem` / `cat:` Met requirement |
| Drive ingest | **Forbidden** (GD2) forever for this adapter |
| Public flip | **No change** — Guide 10b Met ≠ PrivateGold Done |

---

## Objective

Land Mechanic’s missing **MR3** private adapter so library Contract **7.2** RAG Gold can be ingested from a configured **local Gold root** outside git — proving dual-product **consumer** path without claiming live OEM Done.

1. Add `PrivateGoldSource` (discover + load + validate Contract 7.2 releases).  
2. Extend `mecharag ingest --source private-gold` to require `MECHANIC_PRIVATE_GOLD_ROOT` (fail closed if unset).  
3. Reuse chunk → embed → upsert; prove Met on a **`fixture:`** Contract 7.2 pack staged under that root.  
4. Thin honesty: ARCHITECTURE MR3 / GETTING_STARTED note — Fixture Met ≠ live OEM Soft Adjust ≠ dual-product Done.  
5. **Stop.** No ranking/CE reopen; no public-flip edits; no Drive client.

**Success signal (after Implement):** `mecharag ingest --source private-gold` inserts ≥1 document from a Contract 7.2 `fixture:` release under `MECHANIC_PRIVATE_GOLD_ROOT`; `FixtureSource` / public fail-closed unchanged; a reviewer cannot honestly believe live Soft Adjust Review Met or Drive-as-ingest.

**This Write does not Implement.**

---

## Learning notes (interview-portable)

1. **Adapter segregation** — Same consumer schema, different trust roots; never one “trust mode” flag pointing public defaults at private trees.  
2. **Emit vs consume** — Library owns Gold release + checksums; Mechanic owns chunking, embeddings, `index_state`.  
3. **Fixture-first Soft Adjust** — Prove GD2 ingest on synthetic Contract 7.2 before coupling to parked live OEM Review.  
4. **Fail closed on missing config** — Required env for private root prevents silent fallthrough to public fixtures.

---

## References (paths only)

- `mechanic_rag/docs/2026-07-18_private_gold_source_context_summary.md`
- `mechanic_rag/docs/ARCHITECTURE.md` §5.1–5.4 (GD2, MR3)
- `mechanic_rag/mecharag/fixture_source.py` / `ingest_cmd.py` / `chunking.py` / `db_upsert.py`
- `mechanic_rag/contracts/normalized_document_manifest.schema.json`
- `mechanic_rag/contracts/rag_gold_normalized_document_manifest_FIELDS.md`
- `mechanic_rag/scripts/validate/validate_manifest.py` (`--profile public` \| `library`)
- `second_brain/docs/2026-07-12_vehicle_docs_library_architecture.md` Contract 7.2
- `second_brain/docs/dev_guides/2026-07-18_dev_guide_10_vehicle_rag_gold_assembly.md` (fixture emit Met)
- `second_brain/docs/dev_guides/fixtures/vehicle_rag_gold/` (Contract 7.2 shape SSOT)
- `second_brain/docs/2026-07-19_hub_decision_lock_mechanic_private_gold_write_pass163.md`
- `second_brain/docs/2026-07-18_spoke_vehicle_park_live_rag_review_pass163_handoff.md` (live Review parked)
- `second_brain/docs/workflow_os/rails/QUALITY_STANDARD.md`

---

## Architecture constraints (binding)

1. **PrivateGoldSource + ingest CLI only** for Met code — reuse chunk/embed/upsert; no ranking/CE/eval redesign.  
2. **GD2:** Local Gold root only; **never** Drive / rclone / OAuth.  
3. **Separate adapter** — do not extend `FixtureSource` with a trust flag; do not default private root for stranger clone.  
4. **Contract 7.2 consume** — ingest `NormalizedDocumentManifest` release shape (`documents[]`, artifacts, units with `text_path` and/or inline `text`); do not fork schema.  
5. **Met = N1 only** — `vehicle_id` must match `^fixture:`; `rights_class` allowlist for Met includes `synthetic_fixture` (and `redistributable` if present). Do **not** require `private_oem` / `cat:` for Met.  
6. **Live Soft Adjust out of Met** — document Soft Adjust follow-on pins only; do not Implement live path this guide.  
7. **Public fail-closed unchanged** — `FixtureSource`, `public_fail_closed.py`, Guide 10b flip honesty untouched.  
8. **Freeze honesty retained** — Tom override; n=44 delta 0; no earned-lift claim.  
9. Prefer ≤300 lines/file (hard max 400) for new modules.

---

## Soft pins (binding for Ready / Implement)

| Pin | Locked default |
|-----|----------------|
| Module | `mecharag/private_gold_source.py` (new) |
| CLI source token | `--source private-gold` (aliases OK: `PrivateGoldSource`, `private_gold`) |
| Root env | **`MECHANIC_PRIVATE_GOLD_ROOT`** required for private-gold; `--root` may override but must still be outside default `fixtures/` for Met honesty |
| Unset root | Exit non-zero + clear stderr — **no** silent fixtures fallthrough |
| Discover | Find Contract 7.2 release files: prefer `**/normalized_document_manifest.json`; also accept a single release JSON that validates with `documents[]` |
| Validate | Call existing validator logic / `validate_manifest.py --profile library` semantics before DB write (schema + artifact hashes/sizes; `fixture:` IDs OK under library profile) |
| Unit text | Resolve each unit: if `text` present use it; else load `text_path` relative to vehicle/release dir; empty text → skip unit (or reject doc — pin: **reject document** if zero chunks after resolve) |
| Per-doc ingest | For each `documents[]` entry, build flat manifest dict expected by `upsert_document_version` (`vehicle_id`, `document_id`, … at top level) + units with `text` |
| Met Gold pack | Stage Guide 10–shaped **or** program `vehicle_rag_gold/valid/` Contract 7.2 pack into a **gitignored** temp/local gold root for tests (e.g. `tmp/private_gold_met/` or pytest tmp_path). **No OEM bytes in git.** |
| Met vehicle | Any validating `fixture:` id in pack (recommend Guide 10 demo or `fixture:demo-s2000-ap1`) |
| Tests | Unit/integration: discover+load+hash OK; unset env fails; path escape fails; happy ingest with Compose if available — else document env gap for ask smoke only |
| Docs honesty | Thin ARCHITECTURE §5.2 / GETTING_STARTED: PrivateGoldSource path exists (fixture-first); live Soft Adjust **not** Met; ≠ dual-product Done; ≠ public flip change |
| Forbidden | Drive ingest; ranking changes; LICENSE rewrite; §9 flip edits; claiming Soft Adjust Review Met |

---

## Locked decisions (do not reopen)

| Decision | Lock |
|----------|------|
| Write now fixture-first | **A** |
| Met identity | **N1** (`fixture:` under private root) |
| Live Soft Adjust | Out of Met (parked) |
| Drive as ingest | Forbidden |

---

## Acceptance criteria (for later Implement — unchecked at Write)

- [ ] `PrivateGoldSource` module discover/load/validate Contract 7.2 releases  
- [ ] `mecharag ingest --source private-gold` requires `MECHANIC_PRIVATE_GOLD_ROOT` (or explicit `--root`); unset → fail closed  
- [ ] Met: ingest ≥1 `fixture:` document from staged Contract 7.2 pack under private root (hash/idempotent skip OK on re-run)  
- [ ] `FixtureSource` + public fail-closed unchanged  
- [ ] Thin honesty docs: fixture-first Met ≠ live Soft Adjust ≠ dual-product Done  
- [ ] Verification commands pass; no ranking/public-flip/LICENSE invent  

---

## Ordered step checklist

All boxes start unchecked. **Do not check boxes in Write / Ready-check.**

### Phase A — Anchor

- [ ] **A1.** Confirm `PrivateGoldSource` absent; `ingest_cmd` fixtures-only gate present.  
- [ ] **A2.** Confirm Contract 7.2 validator + field inventory exist.  
- [ ] **A3.** Confirm live Soft Adjust Review still parked (out of Met).  
- [ ] **A4.** Stage Met Gold pack under gitignored private root (N1 `fixture:` Contract 7.2).  

### Phase B — Adapter

- [ ] **B1.** Implement `mecharag/private_gold_source.py`: discover releases; load documents; resolve `text_path`; validate hashes/sizes; enforce path-under-root.  
- [ ] **B2.** For Met: require `vehicle_id` `^fixture:`; reject path escape; reject hash mismatch.  
- [ ] **B3.** Map each document to flat upsert manifest + units with `text`.  

### Phase C — CLI wiring

- [ ] **C1.** Extend `ingest_cmd` / `__main__` for `--source private-gold`.  
- [ ] **C2.** Resolve root from `--root` or `MECHANIC_PRIVATE_GOLD_ROOT`; fail closed if missing.  
- [ ] **C3.** Reuse `chunk_manifest_units` → embed → `upsert_document_version` (per-doc isolation retained).  

### Phase D — Prove Met + honesty

- [ ] **D1.** Targeted tests (unset env; happy load; optional Compose ingest).  
- [ ] **D2.** Run Met ingest once; log inserted/skipped.  
- [ ] **D3.** Thin ARCHITECTURE / GETTING_STARTED honesty (adapter exists; live Soft Adjust out; public flip unchanged).  
- [ ] **D4.** Grep: no Drive-as-ingest claim; no “dual-product Done”; no Soft Adjust Review Met claim.  

### Phase E — Stop

- [ ] **E1.** No ranking/CE/LICENSE/§9 flip changes.  
- [ ] **E2.** Stop for Review after Implement (Ready-check first).  

---

## Verification / Definition of Done

```bash
# From mechanic_rag/
# 1) Fail closed without root
unset MECHANIC_PRIVATE_GOLD_ROOT
mecharag ingest --source private-gold   # expect non-zero + clear error

# 2) Met ingest (after staging Contract 7.2 fixture: pack under $GOLD)
export MECHANIC_PRIVATE_GOLD_ROOT="$GOLD"
mecharag ingest --source private-gold
# expect exit 0; inserted or skipped ≥1

# 3) Public path unchanged
python3 scripts/checks/public_fail_closed.py fixtures   # OK
mecharag ingest --source fixtures                       # still works

# 4) Honesty
rg -n 'PrivateGoldSource|private-gold|MECHANIC_PRIVATE_GOLD_ROOT|dual-product|Soft Adjust' \
  docs/ARCHITECTURE.md GETTING_STARTED.md docs/VISION.md
# Must NOT claim: live Soft Adjust Review Met; Drive ingest; dual-product Done from Guide 11 alone
```

**DoD (Ready):** Guide pins locked; Met pack path clear; blast/edges explicit; §9/public flip unchanged.

**DoD (Implement):** Phases A–E Met; verification green; fixture-first only.

**DoD (this Write):** Guide 11 authored with locks A/N1; steps/DoD/blast/edges; **no** Implement.

---

## Blast radius and risks

| Risk | Angle | Mitigation |
|------|-------|------------|
| Public default → private root | Legal/CI | Required env; separate adapter |
| Live Met claim while Review parked | Honesty | Soft Adjust out of Met |
| Contract 7.2 vs legacy FixtureSource shape | Interop | Consume `documents[]` + `text_path`; do not break fixtures ingest |
| Path escape / symlink escape | Security | Resolve + `relative_to(root)` like FixtureSource |
| Partial multi-doc failure | Data | Per-doc try/except; prior version remains |
| Scope into ranking | Interview | Code blast = adapter + CLI + thin docs |

**Blast radius:** `mecharag/private_gold_source.py`, `ingest_cmd.py`, `__main__.py`, tests, thin ARCHITECTURE/GETTING_STARTED — **not** ranking, LICENSE, §9 flip, Drive.

### Rollback

Revert adapter/CLI/docs commits; leave fixtures ingest intact.

---

## Edge-case handling

| Case | Behavior |
|------|----------|
| Env unset | Fail closed |
| Manifest fails validate / hash mismatch | Reject before write |
| `private_oem` / `cat:` in Met pack | Out of Met — reject or Soft Adjust later (pin: **reject for Guide 11 Met** if present, to keep N1 honest) |
| Empty units after resolve | Reject that document |
| Soft Adjust Review unparks later | New Soft Adjust / follow-on guide — not silent scope expand |
| Drive URL as root | Hard fail / forbid |

---

## Soft Adjust follow-on (explicitly out of Met)

When hub unparks live Soft Adjust Review/Align:

- Allow `cat:` + `private_oem` under PrivateGoldSource  
- Optional present-only receipt honesty (sidecar; not schema fork)  
- Live `2017-f-150` (or later) Gold root ingest Soft Adjust  

Do **not** Implement these in Guide 11.

---

## Stop conditions

- Write: this guide complete; handoff Results filled; no Implement.  
- Ready (later): score + evidence; Tom authorized Ready-checks.  
- Implement (later): Phases A–E DoD met; fixture-first only.

---

## Ready for Ready-check?

**Yes** — Guide 11 Write complete; locks A/N1 pinned; Met pack + CLI pins explicit. Run Ready-check next. Do **not** Implement until Ready Met.
