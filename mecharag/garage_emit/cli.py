"""CLI: mecharag garage-emit (init / sync-bronze / emit)."""

from __future__ import annotations

import argparse
import json
import sys
from pathlib import Path

from mecharag.garage_emit import CORPUS_VERSION_DEFAULT, DEFAULT_GARAGE_ROOT
from mecharag.garage_emit.allowlist import EMIT_ORDER
from mecharag.garage_emit.bronze import (
    BronzeError,
    sync_all_bronze,
    sync_vehicle_bronze,
    write_inventory,
)
from mecharag.garage_emit.emit import EmitError, emit_vehicle
from mecharag.garage_emit.layout import (
    ensure_layout,
    require_free_gib,
    resolve_garage_root,
)


def _add_root(p: argparse.ArgumentParser) -> None:
    p.add_argument(
        "--root",
        default=DEFAULT_GARAGE_ROOT,
        help=f"Garage root (default: {DEFAULT_GARAGE_ROOT})",
    )


def build_parser() -> argparse.ArgumentParser:
    parser = argparse.ArgumentParser(
        prog="mecharag garage-emit",
        description="Personal garage PDF → Contract 7.2 RAG Gold emit",
    )
    sub = parser.add_subparsers(dest="action", required=True)

    init_p = sub.add_parser("init", help="Create garage layout + README")
    _add_root(init_p)

    sync_p = sub.add_parser(
        "sync-bronze", help="rclone copy allowlisted PDFs into bronze"
    )
    _add_root(sync_p)
    sync_p.add_argument(
        "--vehicle",
        default=None,
        help="Single vehicle_id (default: all in emit order)",
    )
    sync_p.add_argument(
        "--min-free-gib",
        type=float,
        default=8.0,
        help="Fail if free disk below this many GiB (default 8)",
    )

    emit_p = sub.add_parser("emit", help="Emit Gold from bronze PDFs")
    _add_root(emit_p)
    emit_p.add_argument(
        "--vehicle",
        default=None,
        help="Single vehicle_id (default: all in emit order)",
    )
    emit_p.add_argument(
        "--corpus-version",
        default=None,
        help="corpus_version stamp (default from package)",
    )
    emit_p.add_argument(
        "--min-free-gib",
        type=float,
        default=8.0,
        help="Fail if free disk below this many GiB before emit",
    )
    return parser


def main(argv: list[str] | None = None) -> int:
    parser = build_parser()
    args = parser.parse_args(argv)
    root = resolve_garage_root(args.root)

    if args.action == "init":
        ensure_layout(root)
        print(f"garage layout ready: {root}")
        return 0

    if args.action == "sync-bronze":
        try:
            probe = root if root.exists() else Path.home()
            require_free_gib(probe, args.min_free_gib)
            ensure_layout(root)
            if args.vehicle:
                slice_ = sync_vehicle_bronze(root, args.vehicle, use_rclone=True)
                path = write_inventory(root, [slice_])
            else:
                path = sync_all_bronze(root, use_rclone=True)
            print(f"bronze sync OK inventory={path}")
            return 0
        except (BronzeError, RuntimeError, KeyError, OSError) as exc:
            print(f"FAIL sync-bronze: {exc}", file=sys.stderr)
            return 2

    if args.action == "emit":
        try:
            require_free_gib(root, args.min_free_gib)
            corpus = args.corpus_version or CORPUS_VERSION_DEFAULT
            vehicles = (args.vehicle,) if args.vehicle else EMIT_ORDER
            receipts = []
            for vid in vehicles:
                print(f"emit start {vid}", flush=True)
                receipt = emit_vehicle(root, vid, corpus_version=corpus)
                receipts.append(receipt)
                print(
                    f"emit OK {vid} pages={receipt['pages_total']} "
                    f"empty={receipt['empty_extract_pages']} "
                    f"wall_s={receipt['wall_seconds']}",
                    flush=True,
                )
            print(json.dumps({"emits": len(receipts)}, indent=2))
            return 0
        except (EmitError, RuntimeError, KeyError, OSError) as exc:
            print(f"FAIL emit: {exc}", file=sys.stderr)
            return 2

    parser.error(f"unknown action: {args.action}")
    return 2
