# Field inventory — RAG Gold `NormalizedDocumentManifest` (Contract 7.2)

**Date:** 2026-07-12  
**Schema:** [`normalized_document_manifest.schema.json`](./normalized_document_manifest.schema.json) (`schema_version` = `1.0.0`)  
**Semantic SSOT:** `second_brain/docs/2026-07-12_vehicle_docs_library_architecture.md` Contract 7.2  
**Bump policy:** Breaking field rename/type/requiredness → bump `schema_version` const in schema + this inventory.

Emit owner = vehicle docs library (Gold builder). Consume owner = Mechanic (`FixtureSource` / `PrivateGoldSource`).

| JSON path | Type | Required? | Emit | Consume | Reject rule |
|-----------|------|-----------|------|---------|-------------|
| `$.schema_version` | string const `1.0.0` | yes | library | Mechanic | Unsupported version → reject (never coerce) |
| `$.manifest_id` | string | ≥1 of `manifest_id` / `release_id` | library | Mechanic records as release pointer | Missing both → reject |
| `$.release_id` | string | ≥1 of `manifest_id` / `release_id` | library (synonym) | same | Missing both → reject |
| `$.corpus_version` | string | yes | library | index compatibility; bump → `reindex_needed` | Missing/empty → reject |
| `$.documents` | array | yes, minItems 1 | library | ingest loop | Empty array → reject |
| `$.documents[].vehicle_id` | string | yes | catalog / fixture namespace | PK / filter | Public: must `^fixture:`; never VIN; never filename-alone; private catalog: `^cat:` |
| `$.documents[].year` | integer | yes | library | `vehicles.year` | Missing → reject |
| `$.documents[].make` | string | yes | library | `vehicles.make` | Missing → reject |
| `$.documents[].model` | string | yes | library | `vehicles.model` | Missing → reject |
| `$.documents[].engine` | string | yes | library | `vehicles.engine` | Missing → reject |
| `$.documents[].trim` | string | no | library | `vehicles.trim` nullable | Omitted OK |
| `$.documents[].doc_family` | string | yes | library | `documents.doc_family` | Missing → reject; full controlled vocab deferred |
| `$.documents[].document_id` | string | yes | library | doc identity | Missing → reject; duplicate `(document_id, artifact_version)` in one manifest → reject |
| `$.documents[].artifact_version` | string | yes | library | version identity | Missing → reject |
| `$.documents[].content_hash` | sha256 hex | yes | library | idempotent skip | Missing/malformed/mismatch vs primary artifact → reject |
| `$.documents[].rights_class` | enum | yes | library | public vs private gate | Public profile: `private_oem` → reject; allowlist classes only |
| `$.documents[].provenance.adapter_id` | string | yes | library | lineage store | Missing → reject |
| `$.documents[].provenance.source_id` | string | yes | library | lineage store | Missing → reject |
| `$.documents[].provenance.source_doc_ids` | string[] | no | library | lineage | Optional opaque IDs |
| `$.documents[].provenance.redacted_locator` | string | no | library | lineage | Optional; public fixtures must not point at live OEM trees |
| `$.documents[].provenance.observation_ids` | string[] | no | library | lineage | Optional |
| `$.documents[].provenance.export_id` | string | no | library | lineage | Optional |
| `$.documents[].lineage.transform_name` | string | yes | library | provenance metadata only | Missing → reject |
| `$.documents[].lineage.transform_version` | string | yes | library | provenance metadata only | Missing → reject |
| `$.documents[].lineage.input_bronze_hashes` | sha256[] | no | library | opaque OK | Malformed hex → reject |
| `$.documents[].lineage.input_silver_hashes` | sha256[] | no | library | opaque OK | Malformed hex → reject |
| `$.documents[].artifacts[]` | object | yes, ≥1 | library | full-manifest validate | Each listed path must exist; sha256 + byte_length must match |
| `$.documents[].artifacts[].path` | relative `.txt`/`.md` | yes | library | blob resolve | Absolute/PDF/missing → reject |
| `$.documents[].artifacts[].sha256` | sha256 hex | yes | library | checksum | Mismatch → reject |
| `$.documents[].artifacts[].byte_length` | integer ≥0 | yes | library | size check | Mismatch → reject |
| `$.documents[].units[]` | object | yes, ≥1 | library | citation locators pre-chunk | Empty → reject |
| `$.documents[].units[].page_start` | integer ≥1 | yes | library | locator | Missing → reject |
| `$.documents[].units[].page_end` | integer ≥1 | yes | library | locator | Missing → reject |
| `$.documents[].units[].section_path` | string | yes | library | locator | Missing → reject |
| `$.documents[].units[].heading` | string | yes | library | locator | Missing → reject |
| `$.documents[].units[].body` | string | one of body/text_path | library | text | Both missing → reject |
| `$.documents[].units[].text_path` | relative path | one of body/text_path | library | must be in artifacts | Path not listed / absent on disk → reject |

## Mechanic-only (absent from library emit)

| Concern | Owner | Note |
|---------|-------|------|
| `chunk_id` | Mechanic | Derived at chunk time; **forbidden** on emit schema |
| embeddings / embedding model version | Mechanic | Index path only |
| `index_state` | Mechanic | Never written by library |

## Conceptual map → Mechanic ARCHITECTURE §6 (no SQL in this slice)

| Manifest concern | §6 table / column concept |
|------------------|---------------------------|
| `vehicle_id`, year/make/model/engine/trim | `vehicles` |
| `document_id` + `artifact_version`, `doc_family`, provenance, `content_hash`, `corpus_version` | `documents` |
| page/section units | citation metadata before `chunks` |
| chunk/embed/`index_state` | Mechanic-only; not in this schema |

## Profiles

| Profile | `rights_class` | `vehicle_id` | Extra gates |
|---------|----------------|--------------|-------------|
| **library-emit** (private Gold) | may be `private_oem` | typically `cat:…` | Schema + hashes still required |
| **public FixtureSource** | `synthetic_fixture` (or `redistributable`) | must match `^fixture:` | Reject `private_oem`; reject path outside allowlist; reject VIN-shaped / bare IDs |

**PrivateGoldSource permissiveness ≠ skip validation.** Private rights may allow `private_oem`, but schema validity, artifact hashes/sizes, and `vehicle_id` presence remain mandatory.

## Deferred (do not invent here)

- **`VEH-ID-ALGO-001`:** full slug/hash recipes + make/model/engine normalization tables after `fixture:` / `cat:` prefixes. Link: library architecture §5.5.
- Full `doc_family` controlled vocabulary beyond examples `service_manual` \| `wiring` \| `connectors`.
- **Shared-repo move (S3 trigger):** when `vehicle_docs_library` exists, library-emit schema copy moves/lives there; Mechanic consumer schema stays under `mechanic_rag/contracts/` and stays in sync via explicit `schema_version` bump — no silent forks.

## Program fixture SSOT

`second_brain/docs/dev_guides/fixtures/vehicle_rag_gold/` (valid + invalid synthetic text only). Optional Mechanic mirror: `mechanic_rag/fixtures/vehicle_rag_gold/` — not required for this validator slice.
