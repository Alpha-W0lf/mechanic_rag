"""Personal garage PDF → Contract 7.2 RAG Gold emit (private OEM)."""

from __future__ import annotations

TRANSFORM_NAME = "garage_pdf_to_rag_gold"
TRANSFORM_VERSION = "1.0.0"
CORPUS_VERSION_DEFAULT = "personal-garage-2026-07-25"
DEFAULT_GARAGE_ROOT = "~/var/mechanic_garage"

__all__ = [
    "TRANSFORM_NAME",
    "TRANSFORM_VERSION",
    "CORPUS_VERSION_DEFAULT",
    "DEFAULT_GARAGE_ROOT",
]
