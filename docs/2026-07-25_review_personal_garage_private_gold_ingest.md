# Review — Personal garage private-gold ingest

**Date:** 2026-07-25  
**Repo:** `mechanic_rag`  
**Mode:** multi-repo awareness; primary `mechanic_rag`  
**Stage:** Review implementation — **Pass**  
**Guide:** `docs/dev_guides/2026-07-25_dev_guide_personal_garage_private_gold_ingest.md`  
**Implement:** Met (full fleet under Compose Postgres)

### Declare

| Item | Value |
|------|-------|
| Will write | This review · living context · hub briefing line · guide status already Met |
| Will **not** | Ask smoke · multimodal · friend Drive · CE/embed reopen · unrelated refactors |

---

## Verdict

**Shippable as-is (Review Pass)** for the private-gold ingest Definition of Done.

First full-fleet ingest: `inserted=13 skipped=0 failed=0`. Idempotent re-run after skip-before-embed fix: `inserted=0 skipped=13 failed=0` in ~3.9s. SQL: 4 `cat:` vehicles, 13 documents, 18243 chunks, 11 indexed `index_state` rows (Triumph has no wiring family). Targeted tests **22 passed**. Ask smoke correctly **out of Met**.

---

## DoD vs evidence

| Gate | Result |
|------|--------|
| DRY / no parallel ingest CLI | **Pass** — `_upsert_loaded_documents` shared; `mecharag ingest --source private-gold` |
| Load 13 docs / 4 vehicles | **Pass** |
| Ingest exit 0 full fleet | **Pass** — `/tmp/mechanic_garage_ingest.log` |
| Idempotent skip | **Pass** — `/tmp/mechanic_garage_ingest_rerun2.log` + unit test skip-before-embed |
| DB vehicles/docs/chunks/`index_state` | **Pass** (filter `vehicle_id LIKE 'cat:%'`; fixtures coexist) |
| Tests C1–C4 | **Pass** |
| Docs / `.env.example` | **Pass** |
| Non-goals (ask / M1+ / friend Done) | **Honored** |

---

## Findings (tied to guide / quality)

| ID | Severity | Finding | Guide / bar |
|----|----------|---------|-------------|
| R1 | Fixed in Implement | First idempotent attempt re-embedded then skipped — `content_hash` check lived only inside `upsert_document_version` **after** Ollama | Idempotent DoD + DE latency; fixed: `content_hash_exists` **before** chunk/embed |
| R2 | Soft | Re-run still reloads full Contract 7.2 units from disk (`load_all`) before skip | Acceptable (~4s); further cache out of scope |
| R3 | Soft | Historical `Soft Adjust` string still appears in honesty log helper output | ALWAYS plain-English for **new** docs; rename needs dedicated guide |
| R4 | Info | Chunk rows (18243) ≫ emit units (~13286) — chunker splits oversized units | Expected; do not treat as doc-count mismatch |
| R5 | Info | Total `documents` table = 16 (13 garage + 3 fixtures) — attestation must filter `cat:` | Operator honesty |
| R6 | Info | Disk ~27 GiB free at Met close (94% used) — headroom thin for large re-emits | Guide §4 disk gate still relevant |

No architectural drift into Drive ingest, second CLI, model unfreeze, or ask Met claims.

---

## Smallest refinement set

**None required for Review Pass.**

Optional backlog (separate authorize if wanted):

1. Thin ask attestation guide over one `cat:` vehicle (post-ingest).  
2. Rename honesty log vocabulary off historical Soft Adjust identifiers (dedicated doc/code rename).  
3. Manifest-level skip without loading unit bodies (only if re-run I/O becomes painful).

---

## QUALITY_STANDARD §5 (self-check)

- Assumptions eliminated with logs/SQL/tests.  
- Scope stayed inside ingest guide.  
- Edge case (expensive false-idempotent re-embed) found and fixed before claiming Review Pass.  
- Docs updated in same delivery (guide + context + this review).  
- No secrets committed.

---

## Next

1. Thin **ask attestation** guide (optional, separate Write).  
2. Friend library remains separate program.  
3. Multimodal M1+ remains roadmap only.
