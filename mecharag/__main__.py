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

    ingest_p = sub.add_parser(
        "ingest",
        help="Ingest fixtures or private Gold (PrivateGoldSource)",
    )
    ingest_p.add_argument(
        "--source",
        default="fixtures",
        help=(
            "Source adapter: fixtures | private-gold "
            "(aliases: FixtureSource, PrivateGoldSource, private_gold). "
            "Default: fixtures"
        ),
    )
    ingest_p.add_argument(
        "--root",
        default=None,
        help=(
            "Root directory: FIXTURE_ROOT/./fixtures for fixtures; "
            "MECHANIC_PRIVATE_GOLD_ROOT for private-gold (required if unset)"
        ),
    )
    ingest_p.add_argument(
        "--database-url",
        default=None,
        help="Postgres URL (default: DATABASE_URL)",
    )

    eval_p = sub.add_parser(
        "eval",
        help="Run golden fixture eval harness",
        formatter_class=argparse.RawDescriptionHelpFormatter,
        epilog=(
            "Paired ask ablation (Guide 02):\n"
            "  1. Start CE-on Next: MECHANIC_DIAGNOSTICS=1 (FORCE_RRF_ONLY unset)\n"
            "     e.g. cd web && pnpm dev   # port 3000\n"
            "  2. Start RRF-only Next: MECHANIC_FORCE_RRF_ONLY=1 MECHANIC_DIAGNOSTICS=1\n"
            "     e.g. cd web && PORT=3001 MECHANIC_FORCE_RRF_ONLY=1 pnpm dev\n"
            "  3. mecharag eval --golden evals/ \\\n"
            "       --ask-url http://127.0.0.1:3000/api/ask \\\n"
            "       --ask-url-rrf-only http://127.0.0.1:3001/api/ask\n"
            "  SECTION_DEDUP_ENABLED must be identical on both processes.\n"
            "  Without --ask-url-rrf-only, paired metrics are skipped (CE-on arm only).\n"
            "  Use --no-paired-ask to silence the paired-ablation warning."
        ),
    )
    eval_p.add_argument(
        "--golden",
        default="evals",
        help="Path to golden cases directory or JSON (default: evals/)",
    )
    eval_p.add_argument(
        "--database-url",
        default=None,
        help="Postgres URL (default: DATABASE_URL)",
    )
    eval_p.add_argument(
        "--ask-url",
        default="http://127.0.0.1:3000/api/ask",
        help="Ask API for CE-on arm (FORCE_RRF_ONLY unset)",
    )
    eval_p.add_argument(
        "--ask-url-rrf-only",
        default=None,
        help=(
            "Ask API for forced RRF-only arm (Next with MECHANIC_FORCE_RRF_ONLY=1). "
            "Required for paired ask ablation metrics."
        ),
    )
    eval_p.add_argument(
        "--retrieval-only",
        action="store_true",
        help="Score lexical FTS proxy from DB only (no HTTP ask)",
    )
    eval_p.add_argument(
        "--no-paired-ask",
        action="store_true",
        help="Skip paired CE-on vs RRF-only asks even if --ask-url-rrf-only is set",
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
