# Field inventory — RAG Gold `NormalizedDocumentManifest` (normalized manifest)

**Date:** 2026-07-12  
**Schema:** [`normalized_document_manifest.schema.json`](./normalized_document_manifest.schema.json) (`schema_version` = `1.0.0`)  
**Bump policy:** Breaking field rename/type/requiredness → bump `schema_version` const in schema + this inventory.

Emitter = whatever tool writes the manifests (for example `mecharag garage-emit`). Consumer = Mechanic (`FixtureSource` / `PrivateGoldSource`).

| JSON path | Type | Required? | Emit | Consume | Reject rule |
|-----------|------|-----------|------|---------|-------------|
| `$.schema_version` | string const `1.0.0` | yes | emitter | Mechanic | Unsupported version → reject (never coerce) |
| `$.manifest_id` | string | ≥1 of `manifest_id` / `release_id` | emitter | Mechanic records as release pointer | Missing both → reject |
| `$.release_id` | string | ≥1 of `manifest_id` / `release_id` | emitter (synonym) | same | Missing both → reject |
| `$.corpus_version` | string | yes | emitter | index compatibility; bump → `reindex_needed` | Missing/empty → reject |
| `$.documents` | array | yes, minItems 1 | emitter | ingest loop | Empty array → reject |
| `$.documents[].vehicle_id` | string | yes | catalog / fixture namespace | PK / filter | Public: must `^fixture:`; never VIN; never filename-alone; private catalog: `^cat:` |
| `$.documents[].year` | integer | yes | emitter | `vehicles.year` | Missing → reject |
| `$.documents[].make` | string | yes | emitter | `vehicles.make` | Missing → reject |
| `$.documents[].model` | string | yes | emitter | `vehicles.model` | Missing → reject |
| `$.documents[].engine` | string | yes | emitter | `vehicles.engine` | Missing → reject |
| `$.documents[].trim` | string | no | emitter | `vehicles.trim` nullable | Omitted OK |
| `$.documents[].doc_family` | string | yes | emitter | `documents.doc_family` | Missing → reject; full controlled vocab deferred |
| `$.documents[].document_id` | string | yes | emitter | doc identity | Missing → reject; duplicate `(document_id, artifact_version)` in one manifest → reject |
| `$.documents[].artifact_version` | string | yes | emitter | version identity | Missing → reject |
| `$.documents[].content_hash` | sha256 hex | yes | emitter | idempotent skip | Missing/malformed/mismatch vs primary artifact → reject |
| `$.documents[].rights_class` | enum | yes | emitter | public vs private gate | Public profile: `private_oem` → reject; allowlist classes only |
| `$.documents[].provenance.adapter_id` | string | yes | emitter | lineage store | Missing → reject |
| `$.documents[].provenance.source_id` | string | yes | emitter | lineage store | Missing → reject |
| `$.documents[].provenance.source_doc_ids` | string[] | no | emitter | lineage | Optional opaque IDs |
| `$.documents[].provenance.redacted_locator` | string | no | emitter | lineage | Optional; public fixtures must not point at live OEM trees |
| `$.documents[].provenance.observation_ids` | string[] | no | emitter | lineage | Optional |
| `$.documents[].provenance.export_id` | string | no | emitter | lineage | Optional |
| `$.documents[].lineage.transform_name` | string | yes | emitter | provenance metadata only | Missing → reject |
| `$.documents[].lineage.transform_version` | string | yes | emitter | provenance metadata only | Missing → reject |
| `$.documents[].lineage.input_bronze_hashes` | sha256[] | no | emitter | opaque OK | Malformed hex → reject |
| `$.documents[].lineage.input_silver_hashes` | sha256[] | no | emitter | opaque OK | Malformed hex → reject |
| `$.documents[].artifacts[]` | object | yes, ≥1 | emitter | full-manifest validate | Each listed path must exist; sha256 + byte_length must match |
| `$.documents[].artifacts[].path` | relative `.txt`/`.md` | yes | emitter | blob resolve | Absolute/PDF/missing → reject |
| `$.documents[].artifacts[].sha256` | sha256 hex | yes | emitter | checksum | Mismatch → reject |
| `$.documents[].artifacts[].byte_length` | integer ≥0 | yes | emitter | size check | Mismatch → reject |
| `$.documents[].units[]` | object | yes, ≥1 | emitter | citation locators pre-chunk | Empty → reject |
| `$.documents[].units[].page_start` | integer ≥1 | yes | emitter | locator | Missing → reject |
| `$.documents[].units[].page_end` | integer ≥1 | yes | emitter | locator | Missing → reject |
| `$.documents[].units[].section_path` | string | yes | emitter | locator | Missing → reject |
| `$.documents[].units[].heading` | string | yes | emitter | locator | Missing → reject |
| `$.documents[].units[].body` | string | one of body/text_path | emitter | text | Both missing → reject |
| `$.documents[].units[].text_path` | relative path | one of body/text_path | emitter | must be in artifacts | Path not listed / absent on disk → reject |

## Mechanic-only (absent from emitted manifests)

| Concern | Owner | Note |
|---------|-------|------|
| `chunk_id` | Mechanic | Derived at chunk time; **forbidden** on emit schema |
| embeddings / embedding model version | Mechanic | Index path only |
| `index_state` | Mechanic | Never written by the emitter |

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
| **emitted** (private corpus) | may be `private_oem` | typically `cat:…` | Schema + hashes still required |
| **public FixtureSource** | `synthetic_fixture` (or `redistributable`) | must match `^fixture:` | Reject `private_oem`; reject path outside allowlist; reject VIN-shaped / bare IDs |

**PrivateGoldSource permissiveness ≠ skip validation.** Private rights may allow `private_oem`, but schema validity, artifact hashes/sizes, and `vehicle_id` presence remain mandatory.

## Deferred (do not invent here)

- Full slug/hash recipes and make/model/engine normalization tables after the `fixture:` / `cat:` prefixes.
- Full `doc_family` controlled vocabulary beyond examples `service_manual` \| `wiring` \| `connectors`.
- **Shared-repo move:** if the emitting side moves this schema to a shared repo, the Mechanic consumer schema stays under `contracts/` and stays in sync through an explicit `schema_version` bump.

## Program fixtures (source of record)

Synthetic text fixtures only (valid + invalid samples), staged by the validator/tests; private corpora stay outside this repo.
