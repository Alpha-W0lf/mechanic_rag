"""PrivateGoldSource: Contract 7.2 releases from a local Gold root (GD2)."""

from __future__ import annotations

import json
import re
import sys
from dataclasses import dataclass
from pathlib import Path
from typing import Any

_VALIDATE_DIR = Path(__file__).resolve().parents[1] / "scripts" / "validate"
if str(_VALIDATE_DIR) not in sys.path:
    sys.path.insert(0, str(_VALIDATE_DIR))

from validate_manifest import validate_manifest  # noqa: E402

from mecharag.gold_status import SIDECAR_BASENAME

FIXTURE_ID_RE = re.compile(r"^fixture:[A-Za-z0-9._-]+$")
MET_RIGHTS = frozenset({"synthetic_fixture", "redistributable"})
DRIVE_LIKE = re.compile(r"^(https?://|gdrive:|drive:)", re.IGNORECASE)


class PrivateGoldSourceError(ValueError):
    pass


@dataclass
class PrivateGoldDocument:
    """One flat upsert-ready document from a Contract 7.2 release."""

    release_path: Path
    manifest: dict[str, Any]


class PrivateGoldSource:
    """Discover/load Contract 7.2 releases under a configured local Gold root.

    Guide 11 Met (N1): ``fixture:`` + synthetic/redistributable only.
    ``private_oem`` / ``cat:`` rejected until Soft Adjust follow-on.
    """

    def __init__(self, gold_root: Path | str) -> None:
        raw = str(gold_root).strip()
        if DRIVE_LIKE.match(raw):
            raise PrivateGoldSourceError(
                f"Drive/URL roots forbidden (GD2): {gold_root}"
            )
        self.gold_root = Path(gold_root).expanduser().resolve()

    def _ensure_under_root(self, path: Path) -> Path:
        resolved = path.resolve()
        try:
            resolved.relative_to(self.gold_root)
        except ValueError as exc:
            raise PrivateGoldSourceError(
                f"path escapes private Gold root: {resolved}"
            ) from exc
        return resolved

    def discover(self) -> list[Path]:
        if not self.gold_root.is_dir():
            raise PrivateGoldSourceError(
                f"private Gold root missing: {self.gold_root}"
            )
        preferred = sorted(
            self.gold_root.glob("**/normalized_document_manifest.json")
        )
        found: list[Path] = list(preferred)
        seen = set(preferred)
        for path in sorted(self.gold_root.glob("**/*.json")):
            if path in seen:
                continue
            if path.name == SIDECAR_BASENAME:
                continue
            if "template" in path.name.lower():
                continue
            try:
                raw = json.loads(path.read_text(encoding="utf-8"))
            except (OSError, json.JSONDecodeError):
                continue
            if isinstance(raw, dict) and isinstance(raw.get("documents"), list):
                found.append(path)
                seen.add(path)
        return found

    def load_release(self, release_path: Path) -> list[PrivateGoldDocument]:
        path = self._ensure_under_root(release_path)
        result = validate_manifest(
            path,
            profile="library",
            enforce_allowlist=False,
        )
        if not result.ok:
            issues = "; ".join(str(i) for i in result.issues)
            raise PrivateGoldSourceError(f"release validation failed: {issues}")

        raw = json.loads(path.read_text(encoding="utf-8"))
        if not isinstance(raw, dict):
            raise PrivateGoldSourceError("release root must be an object")
        documents = raw.get("documents") or []
        if not documents:
            raise PrivateGoldSourceError("release documents[] empty")

        out: list[PrivateGoldDocument] = []
        base_dir = path.parent
        for doc in documents:
            if not isinstance(doc, dict):
                raise PrivateGoldSourceError("documents[] entry must be object")
            self._enforce_n1_met(doc)
            flat = self._to_flat_manifest(raw, doc, base_dir)
            out.append(PrivateGoldDocument(release_path=path, manifest=flat))
        return out

    def load_all(self) -> list[PrivateGoldDocument]:
        docs: list[PrivateGoldDocument] = []
        for release in self.discover():
            docs.extend(self.load_release(release))
        return docs

    def distinct_vehicle_ids(self, docs: list[PrivateGoldDocument] | None = None) -> set[str]:
        documents = docs if docs is not None else self.load_all()
        return {str(d.manifest["vehicle_id"]) for d in documents}

    def _enforce_n1_met(self, doc: dict[str, Any]) -> None:
        vid = str(doc.get("vehicle_id", ""))
        rights = str(doc.get("rights_class", ""))
        if vid.startswith("cat:") or rights == "private_oem":
            raise PrivateGoldSourceError(
                "Guide 11 Met rejects private_oem/cat: "
                f"(vehicle_id={vid!r}, rights_class={rights!r}); Soft Adjust later"
            )
        if not FIXTURE_ID_RE.match(vid):
            raise PrivateGoldSourceError(
                f"Guide 11 Met requires vehicle_id ^fixture:…, got {vid!r}"
            )
        if rights not in MET_RIGHTS:
            raise PrivateGoldSourceError(
                f"Guide 11 Met rights_class not allowlisted: {rights!r}"
            )

    def _to_flat_manifest(
        self,
        release: dict[str, Any],
        doc: dict[str, Any],
        base_dir: Path,
    ) -> dict[str, Any]:
        units_out: list[dict[str, Any]] = []
        for idx, unit in enumerate(doc.get("units") or []):
            if not isinstance(unit, dict):
                continue
            text = unit.get("text")
            if text is None or str(text).strip() == "":
                text_path = unit.get("text_path")
                if not text_path:
                    continue
                rel = str(text_path)
                if ".." in Path(rel).parts or Path(rel).is_absolute():
                    raise PrivateGoldSourceError(f"illegal text_path: {rel!r}")
                full = self._ensure_under_root(base_dir / rel)
                if not full.is_file():
                    raise PrivateGoldSourceError(f"text_path missing: {rel}")
                text = full.read_text(encoding="utf-8")
            body = str(text).strip()
            if not body:
                continue
            units_out.append(
                {
                    "unit_id": unit.get("unit_id") or f"u{idx + 1}",
                    "page_start": unit.get("page_start", 1),
                    "page_end": unit.get("page_end", unit.get("page_start", 1)),
                    "section_path": unit.get("section_path") or "document",
                    "heading": unit.get("heading") or "document",
                    "text": body,
                }
            )

        if not units_out:
            raise PrivateGoldSourceError(
                f"document {doc.get('document_id')!r}: zero units after text resolve"
            )

        return {
            "schema_version": release.get("schema_version"),
            "manifest_id": release.get("manifest_id")
            or release.get("release_id")
            or doc.get("document_id"),
            "corpus_version": release.get("corpus_version"),
            "vehicle_id": doc["vehicle_id"],
            "year": doc["year"],
            "make": doc["make"],
            "model": doc["model"],
            "engine": doc["engine"],
            "trim": doc.get("trim"),
            "doc_family": doc["doc_family"],
            "document_id": doc["document_id"],
            "artifact_version": doc["artifact_version"],
            "content_hash": doc["content_hash"],
            "rights_class": doc.get("rights_class", "synthetic_fixture"),
            "provenance": doc.get("provenance") or {},
            "units": units_out,
        }
