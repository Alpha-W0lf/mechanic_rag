#!/usr/bin/env python3
from __future__ import annotations

import argparse
from pathlib import Path


RAG_INPUT_DIR = Path(__file__).resolve().parents[2] / "rag_input"


def discover_pdfs() -> list[Path]:
    if not RAG_INPUT_DIR.exists():
        return []
    return sorted([p for p in RAG_INPUT_DIR.iterdir() if p.suffix.lower() == ".pdf"])


def main() -> None:
    parser = argparse.ArgumentParser(description="Ingestion skeleton")
    parser.add_argument("--dry-run", action="store_true", help="Print plan only; no DB writes")
    args = parser.parse_args()

    pdfs = discover_pdfs()
    print(f"Found {len(pdfs)} PDF(s) in {RAG_INPUT_DIR}")
    for p in pdfs:
        print(f" - {p.name}")

    if args.dry_run:
        print(
            "\nDry run: parsing (Docling/PyMuPDF), chunking (structure+semantic), "
            "embedding, upsert to Supabase."
        )
        return

    # TODO: implement parsing (Docling primary, PyMuPDF fallback)
    # TODO: implement chunking with semantic refinement + breadcrumbs
    # TODO: embed with selected model and upsert to Supabase (pgvector)


if __name__ == "__main__":
    main()


