# Dev guide — Personal garage private-gold ingest (chunk → embed → index)

**Date:** 2026-07-25  
**Repo:** `mechanic_rag`  
**Work item:** Ingest Contract 7.2 personal garage Gold (`~/var/mechanic_garage/gold`) into Compose Postgres via existing `PrivateGoldSource` + `mecharag ingest`  
**Stage that authored this:** Write dev guide  
**Status:** **Implement Met** + **Review Pass** (2026-07-25) · Ready was Go 8.6/10  
**Evidence:** first ingest `/tmp/mechanic_garage_ingest.log` (`inserted=13 skipped=0 failed=0`); idempotent `/tmp/mechanic_garage_ingest_rerun2.log` (`inserted=0 skipped=13 failed=0`, ~3.9s after skip-before-embed) · review `docs/2026-07-25_review_personal_garage_private_gold_ingest.md` 
**Depends on:** Garage emit **Review Pass** (`docs/dev_guides/2026-07-25_dev_guide_personal_garage_rag_gold_emit.md`)  
**Context SSOT:** `docs/2026-07-25_mechanic_rag_orientation_vehicle_docs_wiring_context_summary.md`  
**Lens:** AI eng (RAG ingest) + data eng (idempotent upsert) + portfolio code quality (DRY)

### Declare (Write)

| Item | Value |
|------|-------|
| Mode | multi-repo awareness; implement in `mechanic_rag` |
| Will write | This guide only |
| Will **not** | Implement · ask HTTP Met · multimodal M1+ · friend Drive · CE/embed model reopen · parallel ingest CLI |

---

## 1. Objective

Make Tom’s personal garage RAG Gold **queryable later** by indexing it with the **existing** private ingest path:

```text
~/var/mechanic_garage/gold
  → PrivateGoldSource.discover/load_all (validate + resolve text_path)
  → chunk_manifest_units
  → OllamaEmbedder (nomic-embed-text @ 768, frozen)
  → upsert_document_version (idempotent on content_hash)
  → vehicles / documents / chunks / index_state in Compose Postgres
```

**Success signal (Implement Met):**

1. With Compose Postgres up + Ollama embed model available:  
   `mecharag ingest --source private-gold --root ~/var/mechanic_garage/gold` exits `0` (or documented partial with explicit Tom lock).  
2. All four garage `vehicle_id`s present in `vehicles`.  
3. Document/chunk counts match load expectations (13 Contract 7.2 documents from emit Review).  
4. Re-run ingest → **skipped** unchanged `content_hash` (idempotent).  
5. Targeted tests green; **no** second ingest pipeline invented.  
6. Optional thin ask smoke for one `cat:` vehicle **only if** stack up — not required for Met if unit/contract attestation already covers ask plane (Guide 15); prefer SQL/count attestation for Met.

**Out of Met:** multimodal assets, Drive ingest, friend dual-product Done, public fixture changes, CE reopen, inventing `garage-ingest` CLI.

---

## 2. DRY / architecture constraints (binding — portfolio bar)

1. **Reuse owners (do not fork):**  
   - `mecharag/private_gold_source.py`  
   - `mecharag/ingest_cmd.py` (`--source private-gold`)  
   - `mecharag/chunking.py`  
   - `mecharag/embedder.py`  
   - `mecharag/db_upsert.py`  
   - `mecharag/gold_status.py`  
2. **No parallel path:** Do not add `garage_ingest.py` that re-implements load/chunk/embed/upsert. Operator entry remains `mecharag ingest`.  
3. **If touching `ingest_cmd.py`:** The fixture and private-gold loops currently duplicate chunk→embed→upsert. **Required DRY when editing that file:** extract one shared helper (e.g. `_upsert_loaded_documents(...)`) used by both paths — state the business rule first (per-doc isolation, inserted/skipped/failed counters, fail run if any failed). Do not leave two divergent copies.  
4. **Business rules before new helpers:** Write the rule in the checklist note before coding (inputs/outputs/fail-closed).  
5. **Clean functions:** ≤300 lines/file preferred; no dead code; no Soft Adjust vocabulary in **new** user-facing docs (historical code identifiers may remain until a dedicated rename guide).  
6. **GD2:** Root is local path only (`MECHANIC_PRIVATE_GOLD_ROOT` / `--root`). Never `gdrive:`.  
7. **Frozen embed:** `nomic-embed-text` @ 768 — do not swap models.  
8. **M0 only:** `content_modality` remains text; no image rows.  
9. **Rights:** `private_oem` + `cat:` require authorizing `gold_status` (already on garage Gold).  

---

## 3. References (paths only)

- Emit guide + Review: `docs/dev_guides/2026-07-25_dev_guide_personal_garage_rag_gold_emit.md`, `docs/2026-07-25_review_personal_garage_rag_gold_emit.md`  
- Context: `docs/2026-07-25_mechanic_rag_orientation_vehicle_docs_wiring_context_summary.md`  
- VISION / ARCHITECTURE (GD2, ingest, PrivateGoldSource, M0 multimodal roadmap)  
- Code: `mecharag/ingest_cmd.py`, `private_gold_source.py`, `chunking.py`, `embedder.py`, `db_upsert.py`  
- Tests prior art: `tests/test_private_gold_source.py`, `tests/test_private_gold_present_only.py`  
- Live Gold: `~/var/mechanic_garage/gold/` (four `cat_*` dirs)  
- Env: `.env.example`, Compose Postgres  

---

## 4. Operator preconditions (evidence before Met)

| Precondition | Check |
|--------------|-------|
| Garage Gold present | Four dirs with `normalized_document_manifest.json` + `gold_status.json` |
| Disk | Enough free space for Postgres growth (emit gate was ≥8 GiB; confirm `df` before long embed) |
| Compose | `docker compose up -d` (Postgres on `DATABASE_URL`, default port 5433) |
| Ollama | `ollama pull nomic-embed-text` (or already local); embed endpoint reachable |
| Env | `DATABASE_URL` set; prefer `--root` for Met over relying on unset env |

**Scale honesty:** Emit produced on the order of **~13k page units** across the fleet (Transit dominates). Current `OllamaEmbedder.embed` calls Ollama **once per chunk**. Full-fleet first ingest may take a **long wall-clock** (tens of minutes to hours depending on machine). Met may use:

- **(A) Full fleet** (preferred if Tom accepts wait), or  
- **(B) Phased Met:** Triumph-only first (filter documented) then continue fleet in same guide’s E-steps — **only if** Tom locks B at Ready.

**Recommendation for Ready:** Prefer **(A)** with progress logging; do not invent silent truncation.

---

## 5. Ordered Implement checklist

### A. Rails / honesty docs

- [x] **A1.** Confirm live Gold still loads: `PrivateGoldSource(~/var/mechanic_garage/gold).load_all()` → 13 docs / 4 vehicles.  
- [x] **A2.** Document operator command in guide evidence (and thin GETTING_STARTED or context note — **update living docs**, do not invent a second runbook essay).  
- [x] **A3.** Add `MECHANIC_PRIVATE_GOLD_ROOT` commented example to `.env.example` if missing (path placeholder only — never real OEM).  
- [x] **A4.** State business rule for any new helper before coding (DRY §2.3).

### B. Code quality (only if needed)

- [x] **B1.** If `ingest_cmd.py` is edited: extract shared document upsert loop (fixture + private-gold). **Do not** edit for vanity.  
- [x] **B2.** Optional (Ready lock): progress log every N docs or chunks during long private ingest — thin, no architecture change.  
- [x] **B3.** Do **not** change chunker defaults / embed model / CE without new guide.  
- [x] **B4.** Leave no unused imports, stubs, or commented-out blocks from the slice.

### C. Tests (required)

- [x] **C1.** Keep existing PrivateGoldSource / present-only ingest tests green.  
- [x] **C2.** Add or extend a test that private-gold ingest path rejects Drive-like roots / missing `MECHANIC_PRIVATE_GOLD_ROOT` (may already exist — reuse).  
- [x] **C3.** If DRY helper extracted: unit-test inserted vs skipped vs failed counting with fakes (no live Ollama required).  
- [x] **C4.** Public fixtures ingest still green (no private OEM leak into default fixtures path).

### D. Live ingest (operator)

- [x] **D1.** `df -h` recorded in short attestation note (append to context or review evidence — prefer update living context).  
- [x] **D2.** Compose + Ollama ready.  
- [x] **D3.** Run:  
  `mecharag ingest --source private-gold --root "$HOME/var/mechanic_garage/gold"`  
- [x] **D4.** Verify SQL (or thin script): 4 `vehicle_id`s; document count ≥ 13; chunks ≫ 0; `index_state` sane for garage families.  
- [x] **D5.** Re-run same ingest → all docs **skipped** (or inserted=0, skipped=13).  
- [x] **D6.** Stop. Do not claim ask Met unless optional smoke explicitly run and recorded.

### E. Optional ask smoke (not required for Met)

- [ ] **E1.** If Compose + Next + Ollama generator up: one `POST /api/ask` for e.g. `cat:2015-triumph-street-triple` with a torque/procedure-style question; record citations non-empty **or** honest `insufficient_evidence`.  
- [x] **E2.** Do not expand into UI packaging.

---

## 6. Definition of Done / verification

| Gate | Pass criteria |
|------|----------------|
| DRY | No new parallel ingest module; shared helper if `ingest_cmd` edited |
| Load | 13 docs / 4 vehicles from garage Gold |
| Ingest exit | `0` on full intended scope (A or Ready-locked B) |
| Idempotent | Second run skips unchanged hashes |
| DB | Vehicles + documents + chunks present; no Drive root used |
| Tests | C1–C4 green |
| Docs | Context / `.env.example` updated; VISION not claiming multimodal Met |
| Non-goals | No ask required · no M1+ · no friend Done · no model unfreeze |

---

## 7. Blast radius / risks

| Risk | Mitigation |
|------|------------|
| Multi-hour embed of Transit | Honesty in §4; progress logs; Tom Ready lock A vs B |
| Ollama down mid-run | Per-doc failure isolation already; fix env and resume (idempotent skip helps) |
| Partial DB fill | Fail run if `failed>0`; do not claim Met |
| Mixing fixtures root | Existing refuse of private-gold on `fixtures/` |
| Disk / Postgres volume | `df` before D3 |
| Accidental OEM in git | Gold stays under `~/var`; never copy into repo |
| Duplicate ingest logic drift | B1 DRY mandatory if file touched |

---

## 8. Edge cases

| Case | Behavior |
|------|----------|
| Missing Gold dir | Fail closed |
| Missing `gold_status` for `cat:`/`private_oem` | Fail closed (existing PrivateGoldSource) |
| Empty chunks for a doc | Fail that doc; count failed |
| Embed dim mismatch | Fail closed (existing embedder) |
| Re-ingest after Gold re-emit with new hashes | Insert new versions / replace per upsert rules — do not hand-delete unless documented |
| Triumph-only filter | Only if Ready locks phased Met B — implement via temporary `--vehicle` **only if** already supported; else operator moves other gold dirs aside (**document exactly**); prefer not to invent flags unless needed |

**Prefer:** no new CLI flags unless Ready proves full-fleet ingest cannot complete. Smallest path = existing CLI.

---

## 9. Non-goals

- Multimodal M1–M3 implementation  
- OCR / image assets  
- Friend library Done  
- Changing public fixtures corpus  
- Embedding/CE model changes  
- New `mecharag garage-ingest` command  

---

## 10. Suggested verification commands

```bash
df -h /System/Volumes/Data
docker compose -f /Users/tom/Documents/Git/mechanic_rag/docker-compose.yml ps
ollama list | rg nomic-embed-text
cd /Users/tom/Documents/Git/mechanic_rag
uv run python -c "from pathlib import Path; from mecharag.private_gold_source import PrivateGoldSource; d=PrivateGoldSource(Path.home()/'var'/'mechanic_garage'/'gold').load_all(); print(len(d), {x.manifest['vehicle_id'] for x in d})"
uv run mecharag ingest --source private-gold --root "$HOME/var/mechanic_garage/gold"
# re-run for skip attestation
uv run mecharag ingest --source private-gold --root "$HOME/var/mechanic_garage/gold"
uv run pytest tests/test_private_gold_source.py tests/test_private_gold_present_only.py tests/test_garage_emit.py -q
```

---

## 11. Ready check locks (2026-07-25 — Go 8.6/10)

| Decision | Locked |
|----------|--------|
| Full fleet vs phased Met | **(A) Full fleet** (13 docs / 4 vehicles / ~13286 units) |
| Optional ask smoke in Met | **No** |
| Progress logging | **Yes** (every N docs; optional chunk cadence) |
| DRY refactor of `ingest_cmd` | **Required** because progress logging edits that file — extract shared upsert helper |
| New `--vehicle` flag | **No** unless full-fleet fails with documented ops blocker |
| Compose at Ready | **Was down** — Implement must bring up before live ingest |

See `docs/2026-07-25_ready_check_personal_garage_private_gold_ingest.md`.

**Implement** only after Tom explicit authorize.

---

## 12. Next after this guide

1. ~~Ready / Implement / Review~~ **Implement Met + Review Pass**  
2. Later: thin ask attestation guide / ops note; multimodal remains M1+ backlog  

### Implement evidence (2026-07-25)

| Item | Result |
|------|--------|
| Operator | `uv run mecharag ingest --source private-gold --root "$HOME/var/mechanic_garage/gold"` |
| First run | `inserted=13 skipped=0 failed=0 vehicles=4` — `/tmp/mechanic_garage_ingest.log` |
| Idempotent | `inserted=0 skipped=13 failed=0` in ~3.9s — `/tmp/mechanic_garage_ingest_rerun2.log` (skip **before** embed) |
| SQL `cat:` | 4 vehicles · 13 documents · 18243 chunks · 11 `index_state` indexed rows (Triumph has no wiring family) |
| Disk | `df -h /System/Volumes/Data` → **27 GiB free** (94% used) at Met close |
| DRY | `_upsert_loaded_documents` shared; fixtures + private-gold |
| Tests | `tests/test_ingest_upsert_helper.py` (+ private-gold / garage emit targeted) **22 passed** |
| Ask | **Out of Met** (Ready lock) |

---

## 13. Stop

Write stage stopped at authoring. **Implement Met** recorded above — ask smoke still optional / not claimed.
