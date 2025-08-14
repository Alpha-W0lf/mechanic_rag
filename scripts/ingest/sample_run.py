#!/usr/bin/env python3
from __future__ import annotations

import argparse
from pathlib import Path
from typing import List, Dict, Any

from .pdf_text import extract_pages_text
from .chunking import fixed_window_chunks
from .jsonl import write_jsonl


def build_records(pdf_path: Path, max_pages: int | None = None) -> List[Dict[str, Any]]:
    pages = extract_pages_text(pdf_path)
    if max_pages is not None:
        pages = pages[:max_pages]
    records: List[Dict[str, Any]] = []
    for page in pages:
        for chunk in fixed_window_chunks(page.text, window_chars=1100, overlap_chars=200):
            records.append(
                {
                    "document": pdf_path.name,
                    "page_start": page.page_number,
                    "page_end": page.page_number,
                    "section_heading": None,
                    "section_path": None,
                    "content": chunk,
                }
            )
    return records


def main() -> None:
    parser = argparse.ArgumentParser(description="Sample PDF→chunks JSONL pipeline (no DB)")
    parser.add_argument("pdf", type=Path, help="Path to a PDF file")
    parser.add_argument("--out", type=Path, default=Path("sample_chunks.jsonl"))
    parser.add_argument("--max-pages", type=int, default=None)
    args = parser.parse_args()

    try:
        records = build_records(args.pdf, max_pages=args.max_pages)
    except RuntimeError as exc:
        print(f"Error: {exc}")
        print("Hint: Install dependencies from requirements.txt and ensure PyMuPDF is available.")
        return

    write_jsonl(args.out, records)
    print(f"Wrote {len(records)} chunk record(s) to {args.out}")


if __name__ == "__main__":
    main()


