"""Hash helpers for garage bronze / Gold artifacts."""

from __future__ import annotations

import hashlib
from pathlib import Path


def sha256_bytes(data: bytes) -> str:
    return hashlib.sha256(data).hexdigest()


def sha256_file(path: Path) -> str:
    h = hashlib.sha256()
    with path.open("rb") as fh:
        while True:
            chunk = fh.read(1024 * 1024)
            if not chunk:
                break
            h.update(chunk)
    return h.hexdigest()


def slug_document_id(doc_family: str, filename: str) -> str:
    stem = filename.rsplit(".", 1)[0] if "." in filename else filename
    safe = "".join(ch if ch.isalnum() else "-" for ch in stem)
    while "--" in safe:
        safe = safe.replace("--", "-")
    safe = safe.strip("-").lower() or "doc"
    return f"{doc_family}--{safe}"
