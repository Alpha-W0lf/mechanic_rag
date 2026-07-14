#!/usr/bin/env python3
"""Validate NormalizedDocumentManifest JSON against Contract 7.2 schema + artifact hashes.

Dependency-light: stdlib + jsonschema.
Exit codes: 0 success; 1 validation failure; 2 usage/IO error.
"""

from __future__ import annotations

import argparse
import hashlib
import json
import re
import sys
from dataclasses import dataclass, field
from enum import Enum
from pathlib import Path
from typing import Any

try:
    import jsonschema
    from jsonschema import Draft202012Validator
except ImportError:  # pragma: no cover
    print(
        "ERROR: jsonschema is required. Install with: pip install 'jsonschema>=4.20'",
        file=sys.stderr,
    )
    sys.exit(2)

CONTRACTS_DIR = Path(__file__).resolve().parents[2] / "contracts"
DEFAULT_SCHEMA = CONTRACTS_DIR / "normalized_document_manifest.schema.json"

# Public FixtureSource allowlisted rights classes
PUBLIC_RIGHTS = frozenset({"synthetic_fixture", "redistributable"})
VIN_RE = re.compile(r"^[A-HJ-NPR-Z0-9]{17}$", re.IGNORECASE)
FIXTURE_ID_RE = re.compile(r"^fixture:[A-Za-z0-9._-]+$")
CAT_ID_RE = re.compile(r"^cat:[A-Za-z0-9._-]+$")


class ErrorCode(str, Enum):
    SCHEMA = "SCHEMA"
    UNSUPPORTED_SCHEMA_VERSION = "UNSUPPORTED_SCHEMA_VERSION"
    MISSING_CORPUS_VERSION = "MISSING_CORPUS_VERSION"
    EMPTY_DOCUMENTS = "EMPTY_DOCUMENTS"
    DUPLICATE_DOCUMENT_VERSION = "DUPLICATE_DOCUMENT_VERSION"
    VEHICLE_ID_PREFIX = "VEHICLE_ID_PREFIX"
    VEHICLE_ID_VIN = "VEHICLE_ID_VIN"
    PUBLIC_PRIVATE_OEM = "PUBLIC_PRIVATE_OEM"
    PUBLIC_RIGHTS_CLASS = "PUBLIC_RIGHTS_CLASS"
    ALLOWLIST_PATH = "ALLOWLIST_PATH"
    ARTIFACT_MISSING = "ARTIFACT_MISSING"
    ARTIFACT_HASH_MISMATCH = "ARTIFACT_HASH_MISMATCH"
    ARTIFACT_SIZE_MISMATCH = "ARTIFACT_SIZE_MISMATCH"
    UNIT_TEXT_PATH_UNLISTED = "UNIT_TEXT_PATH_UNLISTED"
    CONTENT_HASH_MISMATCH = "CONTENT_HASH_MISMATCH"


@dataclass
class ValidationIssue:
    code: ErrorCode
    message: str
    path: str = ""

    def __str__(self) -> str:
        loc = f" @ {self.path}" if self.path else ""
        return f"{self.code.value}{loc}: {self.message}"


@dataclass
class ValidationResult:
    ok: bool
    issues: list[ValidationIssue] = field(default_factory=list)

    def add(self, code: ErrorCode, message: str, path: str = "") -> None:
        self.issues.append(ValidationIssue(code=code, message=message, path=path))
        self.ok = False


def load_json(path: Path) -> Any:
    with path.open("r", encoding="utf-8") as f:
        return json.load(f)


def load_schema(schema_path: Path) -> dict[str, Any]:
    return load_json(schema_path)


def _schema_issue_code(err: jsonschema.ValidationError) -> ErrorCode:
    abs_path = list(err.absolute_path)
    validator = err.validator
    if abs_path == ["schema_version"] or (
        validator == "const" and abs_path[:1] == ["schema_version"]
    ):
        return ErrorCode.UNSUPPORTED_SCHEMA_VERSION
    if err.validator == "required" and "corpus_version" in str(err.message):
        return ErrorCode.MISSING_CORPUS_VERSION
    if abs_path == ["documents"] and err.validator in {"minItems", "required"}:
        return ErrorCode.EMPTY_DOCUMENTS
    if (
        len(abs_path) >= 1
        and abs_path[0] == "documents"
        and err.validator == "minItems"
    ):
        return ErrorCode.EMPTY_DOCUMENTS
    return ErrorCode.SCHEMA


def validate_schema(
    manifest: dict[str, Any], schema: dict[str, Any], result: ValidationResult
) -> None:
    validator = Draft202012Validator(schema)
    for err in sorted(validator.iter_errors(manifest), key=lambda e: list(e.path)):
        code = _schema_issue_code(err)
        path = "/" + "/".join(str(p) for p in err.absolute_path)
        result.add(code, err.message, path=path)


def validate_duplicates(manifest: dict[str, Any], result: ValidationResult) -> None:
    seen: set[tuple[str, str]] = set()
    for i, doc in enumerate(manifest.get("documents") or []):
        if not isinstance(doc, dict):
            continue
        key = (str(doc.get("document_id", "")), str(doc.get("artifact_version", "")))
        if key in seen:
            result.add(
                ErrorCode.DUPLICATE_DOCUMENT_VERSION,
                f"duplicate document_id+artifact_version {key!r}",
                path=f"/documents/{i}",
            )
        else:
            seen.add(key)


def _is_vin_shaped(vehicle_id: str) -> bool:
    if ":" in vehicle_id:
        return False
    return bool(VIN_RE.match(vehicle_id))


def validate_identity_and_profile(
    manifest: dict[str, Any],
    *,
    profile: str,
    result: ValidationResult,
) -> None:
    for i, doc in enumerate(manifest.get("documents") or []):
        if not isinstance(doc, dict):
            continue
        vid = str(doc.get("vehicle_id", ""))
        rights = str(doc.get("rights_class", ""))
        base = f"/documents/{i}"

        if _is_vin_shaped(vid):
            result.add(
                ErrorCode.VEHICLE_ID_VIN,
                f"vehicle_id looks VIN-shaped (forbidden): {vid!r}",
                path=f"{base}/vehicle_id",
            )
            continue

        if profile == "public":
            if rights == "private_oem":
                result.add(
                    ErrorCode.PUBLIC_PRIVATE_OEM,
                    "public FixtureSource rejects rights_class=private_oem",
                    path=f"{base}/rights_class",
                )
            elif rights not in PUBLIC_RIGHTS:
                result.add(
                    ErrorCode.PUBLIC_RIGHTS_CLASS,
                    f"public profile rejects rights_class={rights!r}",
                    path=f"{base}/rights_class",
                )
            if not FIXTURE_ID_RE.match(vid):
                result.add(
                    ErrorCode.VEHICLE_ID_PREFIX,
                    f"public profile requires vehicle_id matching ^fixture:…, got {vid!r}",
                    path=f"{base}/vehicle_id",
                )
        else:  # library
            if not (FIXTURE_ID_RE.match(vid) or CAT_ID_RE.match(vid)):
                result.add(
                    ErrorCode.VEHICLE_ID_PREFIX,
                    f"library profile requires fixture: or cat: prefix, got {vid!r}",
                    path=f"{base}/vehicle_id",
                )


def _sha256_file(path: Path) -> tuple[str, int]:
    data = path.read_bytes()
    return hashlib.sha256(data).hexdigest(), len(data)


def validate_artifacts(
    manifest: dict[str, Any],
    manifest_path: Path,
    result: ValidationResult,
) -> None:
    base_dir = manifest_path.parent
    for i, doc in enumerate(manifest.get("documents") or []):
        if not isinstance(doc, dict):
            continue
        artifacts = doc.get("artifacts") or []
        listed: dict[str, dict[str, Any]] = {}
        primary_hash: str | None = None

        for j, art in enumerate(artifacts):
            if not isinstance(art, dict):
                continue
            rel = str(art.get("path", ""))
            apath = f"/documents/{i}/artifacts/{j}"
            if ".." in Path(rel).parts or Path(rel).is_absolute():
                result.add(
                    ErrorCode.ARTIFACT_MISSING,
                    f"illegal artifact path {rel!r}",
                    path=apath,
                )
                continue
            full = base_dir / rel
            if not full.is_file():
                result.add(
                    ErrorCode.ARTIFACT_MISSING,
                    f"artifact not found: {rel}",
                    path=apath,
                )
                continue
            actual_hash, actual_size = _sha256_file(full)
            declared_hash = str(art.get("sha256", ""))
            declared_size = art.get("byte_length")
            if actual_hash != declared_hash:
                result.add(
                    ErrorCode.ARTIFACT_HASH_MISMATCH,
                    f"sha256 mismatch for {rel}: declared {declared_hash}, actual {actual_hash}",
                    path=apath,
                )
            if declared_size is not None and int(declared_size) != actual_size:
                result.add(
                    ErrorCode.ARTIFACT_SIZE_MISMATCH,
                    f"byte_length mismatch for {rel}: declared {declared_size}, actual {actual_size}",
                    path=apath,
                )
            listed[rel] = art
            if j == 0:
                primary_hash = actual_hash

        content_hash = str(doc.get("content_hash", ""))
        if primary_hash and content_hash and content_hash != primary_hash:
            # Allow content_hash to match declared primary artifact hash even when file mismatches
            # (hash mismatch already reported). Also reject when file OK but content_hash wrong.
            first = artifacts[0] if artifacts else {}
            declared_primary = str(first.get("sha256", "")) if isinstance(first, dict) else ""
            if content_hash != declared_primary and content_hash != primary_hash:
                result.add(
                    ErrorCode.CONTENT_HASH_MISMATCH,
                    "content_hash must equal primary artifact sha256",
                    path=f"/documents/{i}/content_hash",
                )

        for k, unit in enumerate(doc.get("units") or []):
            if not isinstance(unit, dict):
                continue
            text_path = unit.get("text_path")
            if text_path and str(text_path) not in listed:
                result.add(
                    ErrorCode.UNIT_TEXT_PATH_UNLISTED,
                    f"unit text_path {text_path!r} not listed in artifacts",
                    path=f"/documents/{i}/units/{k}/text_path",
                )


def path_is_allowlisted(manifest_path: Path, allowlist_roots: list[Path]) -> bool:
    resolved = manifest_path.resolve()
    for root in allowlist_roots:
        try:
            resolved.relative_to(root.resolve())
            return True
        except ValueError:
            continue
    return False


def validate_manifest(
    manifest_path: Path,
    *,
    schema_path: Path = DEFAULT_SCHEMA,
    profile: str = "public",
    allowlist_roots: list[Path] | None = None,
    enforce_allowlist: bool = True,
) -> ValidationResult:
    result = ValidationResult(ok=True)
    if not manifest_path.is_file():
        result.add(ErrorCode.ARTIFACT_MISSING, f"manifest not found: {manifest_path}")
        return result

    if enforce_allowlist and allowlist_roots:
        if not path_is_allowlisted(manifest_path, allowlist_roots):
            result.add(
                ErrorCode.ALLOWLIST_PATH,
                f"manifest path outside allowlist roots: {manifest_path}",
                path=str(manifest_path),
            )
            return result

    try:
        manifest = load_json(manifest_path)
    except (OSError, json.JSONDecodeError) as exc:
        result.add(ErrorCode.SCHEMA, f"failed to load manifest JSON: {exc}")
        return result

    if not isinstance(manifest, dict):
        result.add(ErrorCode.SCHEMA, "manifest root must be an object")
        return result

    schema = load_schema(schema_path)
    validate_schema(manifest, schema, result)
    validate_duplicates(manifest, result)
    validate_identity_and_profile(manifest, profile=profile, result=result)
    validate_artifacts(manifest, manifest_path, result)
    return result


def main(argv: list[str] | None = None) -> int:
    parser = argparse.ArgumentParser(
        description="Validate a NormalizedDocumentManifest (Contract 7.2)."
    )
    parser.add_argument("manifest", type=Path, help="Path to manifest JSON")
    parser.add_argument(
        "--schema",
        type=Path,
        default=DEFAULT_SCHEMA,
        help="Path to JSON Schema (default: mechanic_rag/contracts/...)",
    )
    parser.add_argument(
        "--profile",
        choices=("public", "library"),
        default="public",
        help="public = FixtureSource fail-closed; library = emit profile",
    )
    parser.add_argument(
        "--allowlist-root",
        action="append",
        type=Path,
        default=None,
        help="Allowlisted directory for public profile (repeatable). "
        "Defaults to <repo>/fixtures when omitted.",
    )
    parser.add_argument(
        "--no-allowlist",
        action="store_true",
        help="Skip allowlist path gate (still applies rights/vehicle_id rules).",
    )
    args = parser.parse_args(argv)

    repo_root = Path(__file__).resolve().parents[2]
    allowlist = args.allowlist_root
    if allowlist is None and not args.no_allowlist:
        allowlist = [repo_root / "fixtures"]
        # Program SSOT commonly used in CI/tests
        program = (
            repo_root.parent
            / "second_brain"
            / "docs"
            / "dev_guides"
            / "fixtures"
            / "vehicle_rag_gold"
        )
        if program.is_dir():
            allowlist.append(program)

    result = validate_manifest(
        args.manifest,
        schema_path=args.schema,
        profile=args.profile,
        allowlist_roots=allowlist,
        enforce_allowlist=not args.no_allowlist,
    )
    if result.ok:
        print(f"OK: {args.manifest}")
        return 0
    print(f"FAIL: {args.manifest}", file=sys.stderr)
    for issue in result.issues:
        print(f"  - {issue}", file=sys.stderr)
    return 1


if __name__ == "__main__":
    sys.exit(main())
