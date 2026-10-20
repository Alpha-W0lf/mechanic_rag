"""Page-at-a-time PDF text extraction for garage emit."""

from __future__ import annotations

from dataclasses import dataclass
from pathlib import Path

from pypdf import PasswordType, PdfReader
from pypdf.errors import FileNotDecryptedError, PdfReadError


class ExtractError(ValueError):
    pass


@dataclass
class PageExtract:
    page_number: int  # 1-based
    text: str
    empty: bool


def extract_pages(path: Path) -> list[PageExtract]:
    """Extract every page; empty/whitespace pages marked empty (not fabricated)."""
    try:
        reader = PdfReader(str(path))
    except PdfReadError as exc:
        raise ExtractError(f"cannot read PDF {path.name}: {exc}") from exc

    if getattr(reader, "is_encrypted", False):
        # Many OEM PDFs are "encrypted" with an empty user password and open in
        # Preview without a prompt. Accept empty-password decrypt only.
        try:
            result = reader.decrypt("")
        except Exception as exc:  # noqa: BLE001 — fail closed
            raise ExtractError(
                f"password-encrypted PDF fail-closed: {path.name}"
            ) from exc
        if result == PasswordType.NOT_DECRYPTED:
            raise ExtractError(
                f"password-encrypted PDF fail-closed: {path.name}"
            )

    out: list[PageExtract] = []
    try:
        pages = reader.pages
    except FileNotDecryptedError as exc:
        raise ExtractError(
            f"password-encrypted PDF fail-closed: {path.name}"
        ) from exc

    for idx, page in enumerate(pages, start=1):
        try:
            text = page.extract_text() or ""
        except Exception as exc:  # noqa: BLE001
            raise ExtractError(
                f"extract failed {path.name} page {idx}: {exc}"
            ) from exc
        empty = not text.strip()
        out.append(PageExtract(page_number=idx, text=text, empty=empty))
    return out
