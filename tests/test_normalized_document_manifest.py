"""Tests for NormalizedDocumentManifest schema + public fail-closed gates."""

from __future__ import annotations

import sys
from pathlib import Path

import pytest

REPO_ROOT = Path(__file__).resolve().parents[1]
VALIDATE_DIR = REPO_ROOT / "scripts" / "validate"
sys.path.insert(0, str(VALIDATE_DIR))

from validate_manifest import (  # noqa: E402
    ErrorCode,
    validate_manifest,
)

SCHEMA = REPO_ROOT / "contracts" / "normalized_document_manifest.schema.json"

# Program SSOT fixtures (sibling repo in multi-root workspace)
PROGRAM_FIXTURES = (
    REPO_ROOT.parent
    / "second_brain"
    / "docs"
    / "dev_guides"
    / "fixtures"
    / "vehicle_rag_gold"
)
VALID = PROGRAM_FIXTURES / "valid"
INVALID = PROGRAM_FIXTURES / "invalid"


def _validate(path: Path, *, profile: str = "public", allowlist: list[Path] | None = None):
    roots = allowlist if allowlist is not None else [PROGRAM_FIXTURES]
    return validate_manifest(
        path,
        schema_path=SCHEMA,
        profile=profile,
        allowlist_roots=roots,
        enforce_allowlist=True,
    )


@pytest.mark.parametrize(
    "name",
    ["minimal_manifest.json", "multi_doc_family_manifest.json"],
)
def test_valid_manifests_pass(name: str) -> None:
    result = _validate(VALID / name)
    assert result.ok, [str(i) for i in result.issues]


@pytest.mark.parametrize(
    ("name", "expected_code"),
    [
        ("missing_corpus_version.json", ErrorCode.MISSING_CORPUS_VERSION),
        ("unsupported_schema_version.json", ErrorCode.UNSUPPORTED_SCHEMA_VERSION),
        ("bad_vehicle_id_prefix.json", ErrorCode.VEHICLE_ID_PREFIX),
        ("private_oem_on_public.json", ErrorCode.PUBLIC_PRIVATE_OEM),
        ("hash_mismatch.json", ErrorCode.ARTIFACT_HASH_MISMATCH),
        ("missing_blob.json", ErrorCode.ARTIFACT_MISSING),
        ("empty_documents.json", ErrorCode.EMPTY_DOCUMENTS),
        ("vin_shaped_vehicle_id.json", ErrorCode.VEHICLE_ID_VIN),
        ("byte_length_mismatch.json", ErrorCode.ARTIFACT_SIZE_MISMATCH),
        ("duplicate_document_version.json", ErrorCode.DUPLICATE_DOCUMENT_VERSION),
    ],
)
def test_invalid_manifests_fail_expected_code(name: str, expected_code: ErrorCode) -> None:
    result = _validate(INVALID / name)
    assert not result.ok
    codes = {i.code for i in result.issues}
    assert expected_code in codes, f"expected {expected_code} in {codes}: {[str(i) for i in result.issues]}"


def test_public_fail_closed_private_oem() -> None:
    result = _validate(INVALID / "private_oem_on_public.json", profile="public")
    assert not result.ok
    assert any(i.code == ErrorCode.PUBLIC_PRIVATE_OEM for i in result.issues)


def test_path_outside_allowlist_rejected(tmp_path: Path) -> None:
    # Copy a known-valid manifest outside allowlist
    src = VALID / "minimal_manifest.json"
    outsider = tmp_path / "minimal_manifest.json"
    outsider.write_text(src.read_text(encoding="utf-8"), encoding="utf-8")
    # Blobs not needed — allowlist fails first
    result = validate_manifest(
        outsider,
        schema_path=SCHEMA,
        profile="public",
        allowlist_roots=[PROGRAM_FIXTURES],
        enforce_allowlist=True,
    )
    assert not result.ok
    assert any(i.code == ErrorCode.ALLOWLIST_PATH for i in result.issues)


def test_library_profile_allows_private_oem_with_cat_id(tmp_path: Path) -> None:
    """PrivateGoldSource may use private_oem + cat:; still requires schema + hashes."""
    p1 = VALID / "minimal_p1.txt"
    p2 = VALID / "minimal_p2.txt"
    (tmp_path / "minimal_p1.txt").write_bytes(p1.read_bytes())
    (tmp_path / "minimal_p2.txt").write_bytes(p2.read_bytes())
    manifest = (VALID / "minimal_manifest.json").read_text(encoding="utf-8")
    manifest = manifest.replace("fixture:demo-s2000-ap1", "cat:demo-s2000-ap1")
    manifest = manifest.replace('"rights_class": "synthetic_fixture"', '"rights_class": "private_oem"')
    path = tmp_path / "private_gold_manifest.json"
    path.write_text(manifest, encoding="utf-8")

    result = validate_manifest(
        path,
        schema_path=SCHEMA,
        profile="library",
        allowlist_roots=[tmp_path],
        enforce_allowlist=True,
    )
    assert result.ok, [str(i) for i in result.issues]


def test_happy_path_hash_and_size_verified() -> None:
    result = _validate(VALID / "minimal_manifest.json")
    assert result.ok
    # Re-validate artifacts explicitly by ensuring no hash/size issues present
    assert not any(
        i.code
        in {
            ErrorCode.ARTIFACT_HASH_MISMATCH,
            ErrorCode.ARTIFACT_SIZE_MISMATCH,
            ErrorCode.ARTIFACT_MISSING,
        }
        for i in result.issues
    )


def test_trim_optional_on_minimal() -> None:
    """minimal_manifest omits trim — must still pass."""
    import json

    data = json.loads((VALID / "minimal_manifest.json").read_text(encoding="utf-8"))
    assert "trim" not in data["documents"][0]
    result = _validate(VALID / "minimal_manifest.json")
    assert result.ok
