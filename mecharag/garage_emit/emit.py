"""Emit Contract 7.2 RAG Gold + gold_status from garage bronze PDFs."""

from __future__ import annotations

import json
import shutil
import sys
import time
from datetime import datetime, timezone
from pathlib import Path
from typing import Any

from mecharag.garage_emit import (
    CORPUS_VERSION_DEFAULT,
    TRANSFORM_NAME,
    TRANSFORM_VERSION,
)
from mecharag.garage_emit.allowlist import require_vehicle
from mecharag.garage_emit.extract import ExtractError, extract_pages
from mecharag.garage_emit.hashing import sha256_bytes, sha256_file, slug_document_id
from mecharag.garage_emit.layout import bronze_dir, ensure_layout, gold_dir
from mecharag.gold_status import SIDECAR_BASENAME

_VALIDATE_DIR = Path(__file__).resolve().parents[2] / "scripts" / "validate"
if str(_VALIDATE_DIR) not in sys.path:
    sys.path.insert(0, str(_VALIDATE_DIR))

from validate_manifest import validate_manifest  # noqa: E402


class EmitError(ValueError):
    pass


def _utc_z() -> str:
    return datetime.now(timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ")


def gold_status_for(vehicle_id: str) -> dict[str, Any]:
    return {
        "schema_hint": "mechanic_gold_status/v1",
        "zero_gap": False,
        "publishable": False,
        "present_only": True,
        "complete_library": False,
        "friend_publish_eligible": False,
        "vehicle_ids": [vehicle_id],
        "notes": (
            "personal garage RAG Gold — present-only; "
            "≠ friend Drive Done; ≠ dual-product Done; ocr_not_attempted"
        ),
    }


def _safe_unit_stem(doc_family: str, page: int, used: set[str]) -> str:
    base = f"{doc_family}_p{page:05d}"
    name = base
    if name in used:
        name = f"{base}_{sha256_bytes(base.encode())[:8]}"
    used.add(name)
    return name


def emit_vehicle(
    root: Path,
    vehicle_id: str,
    *,
    corpus_version: str = CORPUS_VERSION_DEFAULT,
) -> dict[str, Any]:
    ensure_layout(root)
    spec = require_vehicle(vehicle_id)
    bdir = bronze_dir(root, spec)
    gdir = gold_dir(root, spec)
    if gdir.exists():
        shutil.rmtree(gdir)
    artifacts_root = gdir / "artifacts"
    artifacts_root.mkdir(parents=True, exist_ok=True)

    started = time.perf_counter()
    documents: list[dict[str, Any]] = []
    receipt_docs: list[dict[str, Any]] = []
    total_pages = 0
    empty_pages = 0

    for manual in spec.manuals:
        pdf_path = bdir / manual.filename
        if not pdf_path.is_file():
            raise EmitError(f"bronze PDF missing: {pdf_path}")
        bronze_hash = sha256_file(pdf_path)
        try:
            pages = extract_pages(pdf_path)
        except ExtractError as exc:
            raise EmitError(str(exc)) from exc

        doc_id = slug_document_id(manual.doc_family, manual.filename)
        used: set[str] = set()
        artifacts: list[dict[str, Any]] = []
        units: list[dict[str, Any]] = []
        empty_for_doc = 0
        for page in pages:
            total_pages += 1
            if page.empty:
                empty_pages += 1
                empty_for_doc += 1
                continue
            stem = _safe_unit_stem(manual.doc_family, page.page_number, used)
            # Unique per document — same doc_family can have multiple PDFs.
            rel = f"artifacts/{doc_id}/{stem}.txt"
            data = page.text.encode("utf-8")
            digest = sha256_bytes(data)
            out_path = gdir / rel
            out_path.parent.mkdir(parents=True, exist_ok=True)
            out_path.write_bytes(data)
            artifacts.append(
                {"path": rel, "sha256": digest, "byte_length": len(data)}
            )
            units.append(
                {
                    "page_start": page.page_number,
                    "page_end": page.page_number,
                    "section_path": f"{manual.filename}/page-{page.page_number}",
                    "heading": f"{manual.filename} p{page.page_number}",
                    "text_path": rel,
                }
            )

        if not units:
            raise EmitError(
                f"zero text units after extract (all empty?): {manual.filename}"
            )
        doc: dict[str, Any] = {
            "vehicle_id": spec.vehicle_id,
            "year": spec.year,
            "make": spec.make,
            "model": spec.model,
            "engine": spec.engine,
            "doc_family": manual.doc_family,
            "document_id": doc_id,
            "artifact_version": TRANSFORM_VERSION,
            "content_hash": artifacts[0]["sha256"],
            "rights_class": "private_oem",
            "provenance": {
                "adapter_id": "personal_garage_pdf",
                "source_id": "tom_macbook_bronze",
                "source_doc_ids": [manual.filename],
                "redacted_locator": f"bronze/{spec.bronze_dirname}/{manual.filename}",
                "observation_ids": [f"obs:garage:{doc_id}"],
                "export_id": f"export:garage:{corpus_version}",
            },
            "lineage": {
                "transform_name": TRANSFORM_NAME,
                "transform_version": TRANSFORM_VERSION,
                "input_bronze_hashes": [bronze_hash],
            },
            "artifacts": artifacts,
            "units": units,
        }
        if spec.trim:
            doc["trim"] = spec.trim
        documents.append(doc)
        receipt_docs.append(
            {
                "filename": manual.filename,
                "doc_family": manual.doc_family,
                "pages_total": len(pages),
                "units_kept": len(units),
                "empty_skipped": empty_for_doc,
                "bronze_sha256": bronze_hash,
            }
        )

    release_id = (
        f"rag-gold:{spec.vehicle_id}:{TRANSFORM_VERSION}:{corpus_version}"
    )
    manifest = {
        "schema_version": "1.0.0",
        "manifest_id": release_id,
        "release_id": release_id,
        "corpus_version": corpus_version,
        "documents": documents,
    }
    manifest_path = gdir / "normalized_document_manifest.json"
    manifest_path.write_text(
        json.dumps(manifest, indent=2) + "\n", encoding="utf-8"
    )
    status_path = gdir / SIDECAR_BASENAME
    status_path.write_text(
        json.dumps(gold_status_for(spec.vehicle_id), indent=2) + "\n",
        encoding="utf-8",
    )

    result = validate_manifest(
        manifest_path, profile="library", enforce_allowlist=False
    )
    if not result.ok:
        issues = "; ".join(str(i) for i in result.issues)
        raise EmitError(f"Contract 7.2 validate failed: {issues}")

    elapsed = time.perf_counter() - started
    receipt = {
        "schema_hint": "mechanic_garage_emit_receipt/v1",
        "built_at": _utc_z(),
        "vehicle_id": spec.vehicle_id,
        "corpus_version": corpus_version,
        "transform": f"{TRANSFORM_NAME}@{TRANSFORM_VERSION}",
        "pages_total": total_pages,
        "empty_extract_pages": empty_pages,
        "ocr_not_attempted": True,
        "documents": receipt_docs,
        "wall_seconds": round(elapsed, 3),
        "gold_dir": str(gdir),
        "manifest_path": str(manifest_path),
    }
    receipt_path = (
        root
        / "receipts"
        / f"emit_{spec.bronze_dirname}_{_utc_z().replace(':', '')}.json"
    )
    receipt_path.parent.mkdir(parents=True, exist_ok=True)
    receipt_path.write_text(
        json.dumps(receipt, indent=2) + "\n", encoding="utf-8"
    )
    receipt["receipt_path"] = str(receipt_path)
    return receipt
