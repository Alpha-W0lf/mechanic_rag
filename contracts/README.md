# Mechanic contracts

Versioned schemas for Mechanic ingest / API boundaries.

| Artifact | Role |
|----------|------|
| `normalized_document_manifest.schema.json` | Shared `NormalizedDocumentManifest` JSON Schema (`schema_version` **1.0.0**) — **documents[]** release wrapper per Contract 7.2 |
| `rag_gold_normalized_document_manifest_FIELDS.md` | Contract 7.2 field inventory + reject rules |
| `ask_request.schema.json` / `ask_response.schema.json` | Ask-path API contracts (separate from Gold emit) |


**Fixture policy:** committed synthetic fixtures under `fixtures/`; private-garage corpora stay outside this repo.  
**Optional FixtureSource mirror:** `mechanic_rag/fixtures/` (not required for schema validation tests).  
**Validator:** `scripts/validate/validate_manifest.py`.

Bump `schema_version` on breaking field changes. When `vehicle_docs_library` exists (S3 trigger), library-emit schema copy moves there; keep this consumer schema in sync via explicit version bump.

### PrivateGoldSource note

Private ingest may allow `rights_class=private_oem`, but **must still** pass schema validation, artifact hash/size checks, and require `vehicle_id`. Rights permissiveness ≠ skipping validation.
