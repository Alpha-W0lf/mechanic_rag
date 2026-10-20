"""FixtureSource: allowlisted paths under fixtures/ only."""

from __future__ import annotations

import hashlib
import json
from dataclasses import dataclass
from pathlib import Path
from typing import Any

PUBLIC_RIGHTS = frozenset({"synthetic_fixture", "redistributable"})
FORBIDDEN_RIGHTS = frozenset({"private_oem"})
SUPPORTED_SCHEMA = frozenset({"1.0.0", "1"})


@dataclass
class FixtureDocument:
    root: Path
    manifest_path: Path
    manifest: dict[str, Any]
    text_path: Path
    text: str


class FixtureSourceError(ValueError):
    pass


class FixtureSource:
    """Load NormalizedDocumentManifest + text from allowlisted fixtures only."""

    def __init__(self, fixture_root: Path) -> None:
        self.fixture_root = fixture_root.resolve()

    def _ensure_under_root(self, path: Path) -> Path:
        resolved = path.resolve()
        try:
            resolved.relative_to(self.fixture_root)
        except ValueError as exc:
            raise FixtureSourceError(
                f"path escapes fixture root: {resolved}"
            ) from exc
        return resolved

    def discover(self) -> list[Path]:
        if not self.fixture_root.is_dir():
            raise FixtureSourceError(f"fixture root missing: {self.fixture_root}")
        # Prefer built manifests; fall back to templates for first build
        manifests = sorted(self.fixture_root.glob("**/manifest.json"))
        if not manifests:
            manifests = sorted(self.fixture_root.glob("**/manifest.template.json"))
        return manifests

    def load_one(self, manifest_path: Path) -> FixtureDocument:
        path = self._ensure_under_root(manifest_path)
        raw = json.loads(path.read_text(encoding="utf-8"))
        vehicle_dir = path.parent
        text_candidates = list(vehicle_dir.glob("*.txt"))
        if not text_candidates:
            raise FixtureSourceError(f"no .txt units under {vehicle_dir}")
        text_path = self._ensure_under_root(text_candidates[0])
        text = text_path.read_text(encoding="utf-8")
        content_hash = hashlib.sha256(text.encode("utf-8")).hexdigest()

        # Build units from text if template has empty units
        manifest = dict(raw)
        if not manifest.get("units"):
            manifest["units"] = _units_from_text(text)
        manifest["content_hash"] = content_hash

        self.validate_manifest(manifest)
        return FixtureDocument(
            root=vehicle_dir,
            manifest_path=path,
            manifest=manifest,
            text_path=text_path,
            text=text,
        )

    def validate_manifest(self, manifest: dict[str, Any]) -> None:
        required = [
            "schema_version",
            "manifest_id",
            "corpus_version",
            "vehicle_id",
            "year",
            "make",
            "model",
            "engine",
            "doc_family",
            "document_id",
            "artifact_version",
            "content_hash",
            "units",
        ]
        missing = [k for k in required if k not in manifest]
        if missing:
            raise FixtureSourceError(f"manifest missing fields: {missing}")
        if str(manifest["schema_version"]) not in SUPPORTED_SCHEMA:
            raise FixtureSourceError(
                f"unsupported schema_version: {manifest['schema_version']}"
            )
        vehicle_id = manifest["vehicle_id"]
        if not str(vehicle_id).startswith("fixture:"):
            raise FixtureSourceError(
                f"FixtureSource requires fixture: vehicle_id, got {vehicle_id}"
            )
        rights = manifest.get("rights_class", "synthetic_fixture")
        if rights in FORBIDDEN_RIGHTS or rights not in PUBLIC_RIGHTS:
            raise FixtureSourceError(f"rights_class not allowlisted: {rights}")
        if not manifest["units"]:
            raise FixtureSourceError("manifest units empty")
        for unit in manifest["units"]:
            if not (unit.get("text") or "").strip():
                raise FixtureSourceError("unit text empty")


def _units_from_text(text: str) -> list[dict[str, Any]]:
    """Split synthetic manual on ## / ### headings into citation units."""
    units: list[dict[str, Any]] = []
    current_section = "root"
    current_heading = "root"
    buf: list[str] = []
    page = 1

    def flush() -> None:
        nonlocal page
        body = "\n".join(buf).strip()
        if not body:
            return
        units.append(
            {
                "unit_id": f"u{len(units)+1}",
                "page_start": page,
                "page_end": page,
                "section_path": current_section,
                "heading": current_heading,
                "text": body,
            }
        )
        page += 1

    for line in text.splitlines():
        if line.startswith("## "):
            flush()
            buf = []
            current_heading = line[3:].strip()
            current_section = current_heading
            buf.append(line)
        elif line.startswith("### "):
            flush()
            buf = []
            current_heading = line[4:].strip()
            current_section = f"{current_section.split('>')[0].strip()} > {current_heading}"
            buf.append(line)
        else:
            buf.append(line)
    flush()
    if not units:
        units.append(
            {
                "unit_id": "u1",
                "page_start": 1,
                "page_end": 1,
                "section_path": "document",
                "heading": "document",
                "text": text.strip(),
            }
        )
    return units
