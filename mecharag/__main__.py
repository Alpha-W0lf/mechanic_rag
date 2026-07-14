"""mecharag CLI entrypoints: ingest, eval."""

from __future__ import annotations

import argparse
import sys


def main(argv: list[str] | None = None) -> int:
    parser = argparse.ArgumentParser(
        prog="mecharag",
        description="Mechanic RAG offline ingest and eval CLI",
    )
    sub = parser.add_subparsers(dest="command", required=True)

    ingest_p = sub.add_parser("ingest", help="Ingest fixtures (or allowlisted source)")
    ingest_p.add_argument(
        "--source",
        default="fixtures",
        help="Source adapter name (fixtures). Default: fixtures",
    )
    ingest_p.add_argument(
        "--root",
        default=None,
        help="Fixture root directory (default: FIXTURE_ROOT or ./fixtures)",
    )
    ingest_p.add_argument(
        "--database-url",
        default=None,
        help="Postgres URL (default: DATABASE_URL)",
    )

    eval_p = sub.add_parser("eval", help="Run golden fixture eval harness")
    eval_p.add_argument(
        "--golden",
        default="evals",
        help="Path to golden cases directory or JSONL (default: evals/)",
    )
    eval_p.add_argument(
        "--database-url",
        default=None,
        help="Postgres URL (default: DATABASE_URL)",
    )
    eval_p.add_argument(
        "--ask-url",
        default="http://127.0.0.1:3000/api/ask",
        help="Ask API base for optional full-ask checks",
    )
    eval_p.add_argument(
        "--retrieval-only",
        action="store_true",
        help="Score retrieval from DB only (no HTTP ask / no CE)",
    )
    eval_p.add_argument(
        "--compare-ce",
        action="store_true",
        default=True,
        help="Compare RRF-only vs ask-with-CE when ask-url is used (default on)",
    )

    args = parser.parse_args(argv)

    if args.command == "ingest":
        from mecharag.ingest_cmd import run_ingest

        return run_ingest(args)
    if args.command == "eval":
        from mecharag.eval_cmd import run_eval

        return run_eval(args)
    parser.error(f"unknown command: {args.command}")
    return 2


if __name__ == "__main__":
    raise SystemExit(main())
