"""Guide 14 Soft Adjust — map Vehicle present_only_receipt → Mechanic gold_status."""

from __future__ import annotations

import argparse
import json
import re
import sys
from pathlib import Path
from typing import Any

from mecharag.gold_status import SCHEMA_HINT, SIDECAR_BASENAME

CAT_ID_RE = re.compile(r"^cat:[A-Za-z0-9._-]+$")

RECEIPT_BASENAME = "present_only_receipt.json"


class ReceiptToGoldStatusError(ValueError):
    pass


def map_receipt_to_gold_status(receipt: dict[str, Any]) -> dict[str, Any]:
    """Translate Vehicle present-only receipt into Soft Adjust gold_status."""
    if not isinstance(receipt, dict):
        raise ReceiptToGoldStatusError("receipt must be a JSON object")
    vid = str(receipt.get("vehicle_id", "")).strip()
    if not CAT_ID_RE.match(vid):
        raise ReceiptToGoldStatusError(
            f"receipt vehicle_id must match ^cat:…, got {vid!r}"
        )
    complete = receipt.get("complete_library")
    if not isinstance(complete, bool):
        raise ReceiptToGoldStatusError(
            "receipt complete_library must be a bool, "
            f"got {type(complete).__name__}"
        )
    return {
        "schema_hint": SCHEMA_HINT,
        "zero_gap": False,
        "publishable": False,
        "present_only": True,
        "complete_library": complete,
        "friend_publish_eligible": False,
        "vehicle_ids": [vid],
        "notes": (
            "Guide 14 Soft Adjust live pilot from present_only_receipt — "
            "not dual-product Done; not friend publish"
        ),
    }


def load_receipt(path: Path) -> dict[str, Any]:
    if not path.is_file():
        raise ReceiptToGoldStatusError(f"receipt missing: {path}")
    try:
        raw = json.loads(path.read_text(encoding="utf-8"))
    except (OSError, json.JSONDecodeError) as exc:
        raise ReceiptToGoldStatusError(
            f"receipt unreadable/invalid JSON: {path}: {exc}"
        ) from exc
    if not isinstance(raw, dict):
        raise ReceiptToGoldStatusError(f"receipt must be a JSON object: {path}")
    return raw


def write_gold_status_from_receipt(
    receipt_path: Path | str,
    *,
    out_path: Path | str | None = None,
) -> Path:
    """Map receipt → gold_status.json (default: sibling in same directory)."""
    receipt_path = Path(receipt_path).expanduser().resolve()
    receipt = load_receipt(receipt_path)
    status = map_receipt_to_gold_status(receipt)
    dest = (
        Path(out_path).expanduser().resolve()
        if out_path
        else receipt_path.parent / SIDECAR_BASENAME
    )
    dest.parent.mkdir(parents=True, exist_ok=True)
    dest.write_text(json.dumps(status, indent=2) + "\n", encoding="utf-8")
    return dest


def main(argv: list[str] | None = None) -> int:
    parser = argparse.ArgumentParser(
        prog="mecharag-receipt-to-gold-status",
        description=(
            "Guide 14 Soft Adjust: map present_only_receipt.json → gold_status.json"
        ),
    )
    parser.add_argument(
        "receipt",
        type=Path,
        help="Path to present_only_receipt.json",
    )
    parser.add_argument(
        "--out",
        type=Path,
        default=None,
        help=f"Output path (default: <receipt_dir>/{SIDECAR_BASENAME})",
    )
    args = parser.parse_args(argv)
    try:
        dest = write_gold_status_from_receipt(args.receipt, out_path=args.out)
    except ReceiptToGoldStatusError as exc:
        print(f"error: {exc}", file=sys.stderr)
        return 2
    print(f"wrote {dest}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
