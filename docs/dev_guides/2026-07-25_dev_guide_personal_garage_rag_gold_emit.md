# Dev guide — Personal garage → Contract 7.2 RAG Gold emit (fleet)

**Date:** 2026-07-25  
**Repo:** `mechanic_rag`  
**Work item:** Personal garage private corpus — curated local PDFs → full-manual text → Contract 7.2 RAG Gold (all owned vehicles)  
**Stage that authored this:** Write dev guide  
**Status:** **Review Pass** (2026-07-25) · Implement Met · Ready was Go 8.7/10  
**Review note:** `docs/2026-07-25_review_personal_garage_rag_gold_emit.md`  
**Ready note:** `docs/2026-07-25_ready_check_personal_garage_rag_gold_emit.md`  
**Context SSOT:** `docs/2026-07-25_mechanic_rag_orientation_vehicle_docs_wiring_context_summary.md`  
**Lens:** Data eng (emit) + AI eng (RAG corpus honesty)  
**Live Gold root:** `~/var/mechanic_garage/` (outside git)  
**Product lock:** Portfolio v1 = **M0 text-first**; multimodal **M1→M3** roadmap only (VISION §5)

### Declare (Write)

| Item | Value |
|------|-------|
| Mode | multi-repo awareness; implement in `mechanic_rag` |
| Will write | This guide only |
| Will **not** | Implement · ingest into Postgres · ask path · friend Drive capture · CE/embed reopen |

---

## 1. Objective

Build a **local MacBook** pipeline that:

1. Copies **allowlisted** OEM vehicle manuals from Drive (or existing local copies) into a gitignored **bronze** tree.  
2. Extracts **full PDF text** (all pages that yield extractable text) for every included manual.  
3. Emits validating **Contract 7.2** releases (`NormalizedDocumentManifest` + `.txt` artifacts) + `gold_status.json` under a local **Gold** root suitable for later `PrivateGoldSource` ingest.  
4. Covers **all four** owned vehicles in one Definition of Done (fleet-wide), with **per-vehicle** verification gates.

**Success signal (Implement Met):** For each allowlisted `vehicle_id`, a Gold release validates with `scripts/validate/validate_manifest.py --profile library`; `gold_status.json` is present; inventory lists included/excluded sources with hashes; no Drive URL in Mechanic config; no paperwork/YXZ-out-of-range files in bronze or Gold.

**Out of this guide’s Met:** `mecharag ingest`, `/api/ask`, embeddings, friend-library dual-product Done, public fixtures changes.

---

## 2. Why all four vehicles (not a single-vehicle-only pilot)

The fleet is small (four vehicles). Deferring three vehicles buys little once the emit path exists, and would leave YXZ year-filter / Transit disk risks untested. **Scope = all four.** Still use **per-vehicle gates** so one failure does not silently fake fleet Met.

Earlier “Triumph-first” advice remains useful as **implementation order inside the guide** (smallest → largest), not as a scope cut.

Suggested Implement order: Triumph → S2000 → YXZ → Transit (heavy last).

---

## 3. Locked product rules (do not reopen in Implement)

| Rule | Value |
|------|-------|
| Vehicles | S2000, Street Triple, YXZ (2021), Transit 350 only |
| Excluded vehicles | Mazda2, WR250X |
| YXZ manuals | **2019–2023 generation only** |
| Corpus completeness | **Full** included PDFs (all pages) — do **not** hand-curate “important sections only” for the corpus |
| Retrieval chunking | Allowed later at Mechanic ingest — **not** a reason to drop pages from emit |
| Paperwork | Exclude registration, CARFAX, permits, titles |
| Aftermarket | Exclude Victron and similar accessory docs (v1) |
| Storage | Local disk only for Mechanic; Drive = human archive / copy source |
| Friend shop program | Unchanged; not this corpus |

---

## 4. References (paths only)

- Context: `docs/2026-07-25_mechanic_rag_orientation_vehicle_docs_wiring_context_summary.md`  
- VISION private path: `docs/VISION.md`  
- Architecture GD1–GD5 + PrivateGoldSource: `docs/ARCHITECTURE.md`  
- Schema: `contracts/normalized_document_manifest.schema.json`  
- Validator: `scripts/validate/validate_manifest.py`  
- Consumer (later, do not call for Met): `mecharag/private_gold_source.py`, `mecharag/gold_status.py`  
- Prior art (different input grain — Ford **page-dump** leaves, not personal multi-page service PDFs): `second_brain/docs/dev_guides/builders/vehicle_rag_gold_assembly/` (`extract_live.py`, `assemble_live_rag_gold.py`) — **reuse extract ideas; do not require Ford page-dump layout**  
- Drive sources (copy only):  
  - `gdrive:Vehicle Docs/2003 Honda S2000/`  
  - `gdrive:Vehicle Docs/2015 Triumph Street Triple/`  
  - `gdrive:Vehicle Docs/2021 Yamama YXZ1000R SS SE/`  
  - `gdrive:Vehicle Service Manuals/Ford PTS - PDF manuals/2016-transit/`  
  - `gdrive:Vehicle Docs/2016 Ford Transit 350/Ford Transit van - Owners Manual_2016.pdf`

---

## 5. Architecture constraints

1. **GD2:** Never set `MECHANIC_PRIVATE_GOLD_ROOT` / emit output to a Drive URL.  
2. **No OEM in git:** Bronze + Gold roots **gitignored**; never commit PDFs or private Gold text.  
3. **Rights:** `rights_class=private_oem`; `vehicle_id` must be `cat:…`.  
4. **Validate:** library profile only for private_oem.  
5. **Present-only honesty:** Empty-text pages may be skipped **with receipt counts** in sidecar / emit receipt — do not invent torque text; do not claim `zero_gap` / friend publish.  
6. **Dedup:** Identical SHA-256 PDFs → one bronze object (S2000 service manuals are known duplicates).  
7. **File size / disk:** Before Transit copy+extract, require documented free-space check (data volume had ~30 GiB free on 2026-07-25 — tight).  
8. Prefer ≤300 lines/file; hard max 400. New code under **`mecharag/garage_emit/`** only (Ready pin); tests under `tests/test_garage_emit*.py` or `tests/garage_emit/`.  
9. **`pypdf`:** add to main `project.dependencies` (or a Met-installed optional extra) — do not rely on undocumented `legacy` only (Ready pin).  
10. Do **not** modify friend-library builders to “read Drive Gold as RAG” — garage emit is Mechanic-owned for this personal corpus.  
11. **`gold_status.json` (Ready pin):** per vehicle gold dir — `schema_hint=mechanic_gold_status/v1`, `present_only=true`, `zero_gap=false`, `complete_library=false`, `publishable=false`, `friend_publish_eligible=false`, `vehicle_ids=[that cat:]`, notes: personal garage ≠ friend Done.

---

## 6. Proposed local layout (pin in Ready check if Tom renames)

```text
~/var/mechanic_garage/          # OUTSIDE mechanic_rag git
  README.txt                    # operator note: private OEM; not for git
  inventory/corpus_inventory.json
  bronze/
    2003-honda-s2000/
    2015-triumph-street-triple/
    2021-yamaha-yxz1000r-ss-se/
    2016-ford-transit-350/
  gold/
    cat_2003-honda-s2000/
      normalized_document_manifest.json
      gold_status.json
      artifacts/**/*.txt
    cat_2015-triumph-street-triple/
      …
    cat_2021-yamaha-yxz1000r-ss-se/
      …
    cat_2016-ford-transit-350/
      …
  receipts/
    emit_<vehicle>_<timestamp>.json
```

`MECHANIC_PRIVATE_GOLD_ROOT` for a **later** ingest guide should point at `~/var/mechanic_garage/gold` (or equivalent), never bronze.

---

## 7. Allowlist — files in / out (binding inventory)

### 7.1 `cat:2015-triumph-street-triple`

| Include | `doc_family` |
|---------|--------------|
| `Triumph Street Triple 675 - Service Manual_2013.pdf` | `service_manual` |
| `Triumph Street Triple 675 - Owners Handbook_2014.pdf` | `owners_manual` |
| `Triumph Street Triple 675 - Owners Handbook_2019.pdf` | `owners_manual` |

| Exclude |
|---------|
| `2023 Vehicle Registration Renewal_2015 Triumph Street Triple_Motorcycle.pdf` |

### 7.2 `cat:2003-honda-s2000`

| Include | `doc_family` | Notes |
|---------|--------------|-------|
| One of the duplicate service manuals (prefer stable name `Honda S2000 - Service Manual_2000 - 2008.pdf`) | `service_manual` | Drop byte-identical twin |
| `Honda S2000 - Owners Manual_2001.pdf` | `owners_manual` | |
| `Honda S2000 - Wiring Diagram 2008.pdf` | `wiring` | |

| Exclude |
|---------|
| All TxDMV / registration / CARFAX / transit permit PDFs |
| `Honda S2000 - Service Manual_2000 - 2003.pdf.crdownload` |
| The second copy of the duplicate service manual |

### 7.3 `cat:2021-yamaha-yxz1000r-ss-se` (YXZ **2019–2023 only**)

| Include | `doc_family` |
|---------|--------------|
| `YXZ1000R 2019_service manual.pdf` | `service_manual` |
| `YXZ1000R 2020-2023_service manual.pdf` | `service_manual` |
| `yamaha yxz1000et 2019_owners manual.pdf` | `owners_manual` |

| Exclude (out of generation / wrong years) |
|---------|
| `YXZ1000R 2016_service manual.pdf` |
| `YXZ1000R 2018_service manual.pdf` |
| `YXZ1000R NON Paddle Shift 2017_service manual.pdf` |
| `YXZ1000R Paddle Shift 2017_service manual.pdf` |
| `YXZ1000R 2024_service manual.pdf` |
| `yamaha yxz1000r ss_owners manual 2024.pdf` |

**Honesty:** 2019 owners filename contains `et`; owned vehicle is SS SE. Keep provenance in manifest; do not claim perfect trim identity.

### 7.4 `cat:2016-ford-transit-350`

| Include | `doc_family` | Source |
|---------|--------------|--------|
| `service_manual.pdf` | `service_manual` | Friend Gold `2016-transit/` |
| `wiring.pdf` | `wiring` | Friend Gold `2016-transit/` |
| `connectors.pdf` | `connectors` | Friend Gold `2016-transit/` |
| `Ford Transit van - Owners Manual_2016.pdf` | `owners_manual` | Personal Vehicle Docs |

| Exclude |
|---------|
| `FRIEND_README.md` / `.txt`, `completeness_ledger.json`, `drive_gold_manifest.json` (not manual body) |
| Entire `Victron Orion XS…/` tree (aftermarket accessory) |

---

## 8. Identity + document IDs

| Field | Rule |
|-------|------|
| `vehicle_id` | Exact `cat:` strings in §7 |
| `year` / `make` / `model` / `engine` | Fill best-known; engine may be `unknown` if not locked — do not invent VIN |
| `document_id` | Stable slug from family + source basename (no spaces); stable across re-runs |
| `artifact_version` | Emit transform version string (e.g. `garage_pdf_to_rag_gold@1.0.0`) |
| `corpus_version` | Single fleet stamp for the Met run (e.g. `personal-garage-2026-07-25`) — bump on material re-emit |
| `content_hash` | SHA-256 of primary text artifact bytes (or declared primary) per Contract 7.2 |
| `provenance.adapter_id` | e.g. `personal_garage_pdf` |
| `provenance.source_id` | e.g. `tom_macbook_bronze` |
| `rights_class` | `private_oem` |

`doc_family` values used here: `service_manual` \| `wiring` \| `connectors` \| `owners_manual` (owners is allowed string; full controlled vocab still deferred in schema docs).

---

## 9. Ordered Implement checklist

### A. Prep / rails

- [x] **A1.** Confirm free disk ≥ **8 GiB** before Transit work (or Tom pins alternate volume). Record `df -h` in receipt.  
- [x] **A2.** Create `~/var/mechanic_garage/` layout (§6); add root `README.txt` (private OEM; not for git).  
- [x] **A3.** Ensure `mechanic_rag/.gitignore` ignores any accidental in-repo garage paths if used; prefer roots **outside** the repo.  
- [x] **A4.** Add code package home + `pypdf` dependency if missing; keep public fixture paths untouched. (**Also:** `cryptography>=3.1` for AES OEM PDFs; empty-user-password decrypt accepted.)

### B. Inventory + bronze copy (all vehicles)

- [x] **B1.** Implement allowlist inventory writer: for each vehicle, list include/exclude with planned `doc_family` and expected Drive/local source path.  
- [x] **B2.** Copy **only** include-list PDFs into bronze (rclone `copy` to local, or `cp` if already local). **Never** Mechanic runtime read of `gdrive:`.  
- [x] **B3.** Compute SHA-256 for every bronze PDF; write into `corpus_inventory.json`.  
- [x] **B4.** Dedup: if two includes share SHA-256, keep one and record `dedup_of` in inventory. (S2000 twin excluded from allowlist.)  
- [x] **B5.** Fail closed if any YXZ **exclude** file appears under YXZ bronze.  
- [x] **B6.** Fail closed if paperwork patterns appear under bronze (`registration`, `CARFAX`, `TxDMV`, `.crdownload`, etc. — maintain an explicit deny-name list in code).

### C. Emit transform (full PDF → text units)

- [x] **C1.** For each bronze PDF: extract **every page** to text units with `page_start` / `page_end` (page-at-a-time is fine).  
- [x] **C2.** Empty or whitespace-only page: **skip unit**, increment `empty_extract_pages` in receipt — do not fabricate content.  
- [x] **C3.** Write `.txt` artifacts under `gold/…/artifacts/` with relative paths allowed by schema (`relative_text_path`).  
- [x] **C4.** Build `documents[]` entries per PDF (or per family+document_id) with provenance + `content_hash`.  
- [x] **C5.** Write `normalized_document_manifest.json` (schema_version `1.0.0`, `corpus_version`, `manifest_id`/`release_id`).  
- [x] **C6.** Validate with `validate_manifest.py --profile library` — fail closed on errors.  
- [x] **C7.** Write `gold_status.json` authorizing present-only / incomplete private OEM (mirror fields `PrivateGoldSource` already requires for `cat:` — see `mecharag/gold_status.py` / Guide 13–14 patterns). Set honesty: not friend-publish; not dual-product Done.  
- [x] **C8.** Write per-vehicle emit receipt under `receipts/` (counts: pages total, empty skipped, documents, bytes, wall time).

### D. Tests (fixture-sized — required for Met)

- [x] **D1.** Tiny synthetic multi-page PDF fixture (or text-inject test double) covering: happy path, empty page skip, deny-list reject, YXZ year filter helper, SHA dedup.  
- [x] **D2.** Validator accepts a minimal synthetic `private_oem` / `cat:` release shaped like emit output.  
- [x] **D3.** Public `FixtureSource` / fixtures ingest tests remain green — no private OEM leakage into public profile.

### E. Live fleet emit (operator)

- [x] **E1.** Run emit for Triumph → S2000 → YXZ → Transit.  
- [x] **E2.** Confirm each vehicle Gold dir has manifest + `gold_status` + artifacts.  
- [x] **E3.** Spot-check: YXZ gold must not reference 2016/2017/2018/2024 manuals.  
- [x] **E4.** Spot-check: no Victron / registration strings in inventory includes.  
- [x] **E5.** Stop. **Do not** run `mecharag ingest` or ask in this guide’s Met.

---

## 10. Definition of Done / verification

| Gate | Pass criteria |
|------|----------------|
| Inventory | `corpus_inventory.json` lists all four vehicles; includes/excludes match §7 |
| Bronze | Only allowlisted PDFs; hashes recorded; S2000 dedup applied; YXZ out-of-range absent |
| Gold validate | Each vehicle: `validate_manifest.py --profile library` exit 0 |
| Status | Each vehicle: `gold_status.json` present and sufficient for later `cat:` PrivateGoldSource load |
| Full-manual intent | Emit processes **all pages** of each included PDF (empty skips audited, not silent page-range cherry-pick) |
| Rights / privacy | No Drive root; no OEM in git; `private_oem` + `cat:` only |
| Tests | D1–D3 green |
| Non-goals | No ingest Met · no ask Met · no friend Done · no CE reopen |

**Ready-for Review signal:** DoD table above Met with evidence paths (inventory path, four gold dirs, test command output).

---

## 11. Blast radius / risks

| Risk | Angle | Mitigation |
|------|-------|------------|
| Disk exhaustion on Transit extract | Ops / MacBook | A1 space gate; Transit last; optional alternate volume |
| Wrong-year YXZ manuals pollute retrieval | RAG quality | Hard exclude list + fail closed B5/E3 |
| Paperwork in index | RAG quality / privacy | Deny-list B6 |
| Treating Drive as DB | Architecture / GD2 | Copy-then-emit only |
| Scope creep into ingest/ask | Process | Explicit Out of Met |
| Duplicate S2000 manuals | Index bloat | SHA dedup B4 |
| `owners_manual` vocab | Schema deferred | Allowed string; document in inventory |
| Huge Transit text | Cost / time | Receipt wall-clock; do not truncate corpus to “save time” without Tom lock |
| Friend Gold copy ≠ page-dump prior art | Engineering | New garage emit path; do not force Ford leaf orderer |

---

## 12. Edge cases (must handle in steps or tests)

| Case | Behavior |
|------|----------|
| Missing allowlisted PDF on Drive | Fail that vehicle (or whole run) fail-closed — do not Met with silent gap unless Tom authorizes present-only vehicle omit |
| `.crdownload` / partial | Exclude; never extract |
| Empty PDF page | Skip + count |
| Scanned image-only page (no text) | Same as empty — skip + count; do **not** require OCR in v1 (record `ocr_not_attempted`) |
| Password-encrypted PDF | Fail closed **unless** empty-user-password decrypt succeeds (`PasswordType` ≠ `NOT_DECRYPTED`). AES PDFs require `cryptography>=3.1`. |
| Path escape / symlink outside bronze | Reject |
| Re-run emit | Idempotent overwrite of gold for same `corpus_version` or bump version deliberately |
| Mazda2 / WR250X folders still on Drive | Never copy |

---

## 13. Non-goals (forbidden in this Implement)

- Mechanic Postgres ingest / embeddings / ask  
- Google Drive as live ingest root  
- Friend LEMON/aggregator/Ford fleet expansion  
- OCR pipeline for image-only pages  
- Including Victron / registration / out-of-range YXZ  
- Public fixture or LICENSE changes  
- Claiming dual-product Done  

---

## 14. Suggested verification commands (Implement fills exact paths)

```bash
df -h /Users/tom
# after emit:
python scripts/validate/validate_manifest.py \
  --profile library \
  ~/var/mechanic_garage/gold/cat_2015-triumph-street-triple/normalized_document_manifest.json
# repeat for each vehicle gold dir
pytest <garage_emit_tests> -q
```

---

## 15. Stop conditions

- Write stage: **stop after this guide** (no code).  
- Implement stage: **stop after DoD** — no ingest/ask.  
- If free disk &lt; gate: **stop and ask Tom** before Transit extract.

---

## 16. Next stages (after this guide)

1. Refine-dev-guide (optional) or **Ready check before code**  
2. **Implement** this guide  
3. **Review implementation**  
4. Next backlog: Mechanic private-gold **ingest** of `~/var/mechanic_garage/gold` (separate guide)

---

## 17. Ready check locks (2026-07-25 — Go 8.7/10)

| Decision | Locked |
|----------|--------|
| Local root path | `~/var/mechanic_garage/` |
| OCR for image-only pages | **Defer** (skip + count; `ocr_not_attempted`) |
| YXZ `et` owners applicability | **Keep** with provenance honesty |
| Code home | `mecharag/garage_emit/` |
| `pypdf` | Main dep (or Met-installed extra) |
| `gold_status` | Guide 13–shaped present-only pack (§5.11) |

## 18. Implement evidence (2026-07-25)

| Item | Evidence |
|------|----------|
| Package | `mecharag/garage_emit/` + `mecharag garage-emit {init,sync-bronze,emit}` |
| Deps | `pypdf==5.9.0`, `cryptography>=3.1`, `jsonschema>=4.20` in main deps |
| Tests | `uv run pytest tests/test_garage_emit.py …` — garage + PrivateGold regression **46 passed** (targeted set) |
| Bronze | `~/var/mechanic_garage/bronze` ~1.0 GiB; inventory 4 vehicles |
| Gold | `~/var/mechanic_garage/gold` ~59 MiB text; 4 manifests validate library profile |
| Load smoke | `PrivateGoldSource(gold).load_all()` → **13** documents (3+3+3+4) |
| Triumph | pages=1077 empty=2 |
| S2000 | pages=2526 empty=38 |
| YXZ | pages=1504 empty=14; no 2016/17/18/24 refs |
| Transit | pages=8308 empty=75 |
| Out of Met | No ingest · no ask |

**Ready-for Review.** Next stage: Review implementation.

---

## 19. Review Pass (2026-07-25)

**Verdict:** Shippable as-is. See `docs/2026-07-25_review_personal_garage_rag_gold_emit.md`.

Optional non-blocking polish: receipt `df` snapshot; bronze path-escape reject; empty-password extract unit test.

**Next backlog:** Write guide — private-gold **ingest** of `~/var/mechanic_garage/gold` (chunk/embed/index). Multimodal M1+ only via separate future guide.

