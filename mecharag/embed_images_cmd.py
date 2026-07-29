"""Batch embed page PNGs into chunk_image_embeddings (M2).

Business rules:
  - Only pages that already have text chunks (page_start set).
  - Embed once per unique (vehicle_id, document_id, page_start); upsert all
    chunk_ids on that page with the same vector (Option A paired text).
  - Reuse M1 asset_path / ensure_page_png; skip page if bronze missing and
    no cached PNG (do not invent a second asset tree).
  - Idempotent: skip rows already stored for the frozen model_id.
  - Default vehicle filter: cat:% (full personal garage). Optional prefixes.
"""

from __future__ import annotations

import argparse
import json
import os
import sys
import time
from pathlib import Path

import psycopg
from psycopg.rows import dict_row

from mecharag.clip_m2 import EMBED_DIM, MODEL_ID, encode_image_paths
from mecharag.page_assets import (
    asset_path,
    ensure_page_png,
    garage_root_from_env,
    resolve_bronze_pdf_from_provenance,
)

UPSERT_SQL = """
INSERT INTO chunk_image_embeddings (
  chunk_id, vehicle_id, document_id, page_start, page_end,
  embedding, embedding_model, embedding_dim, asset_locator
) VALUES (
  %(chunk_id)s, %(vehicle_id)s, %(document_id)s, %(page_start)s, %(page_end)s,
  %(embedding)s::vector, %(embedding_model)s, %(embedding_dim)s, %(asset_locator)s
)
ON CONFLICT (chunk_id) DO UPDATE SET
  embedding = EXCLUDED.embedding,
  embedding_model = EXCLUDED.embedding_model,
  embedding_dim = EXCLUDED.embedding_dim,
  asset_locator = EXCLUDED.asset_locator,
  page_end = EXCLUDED.page_end
"""


def _database_url(explicit: str | None) -> str:
    url = (explicit or os.environ.get("DATABASE_URL") or "").strip()
    if not url:
        raise SystemExit("DATABASE_URL required")
    # psycopg wants postgresql://
    if url.startswith("postgres://"):
        url = "postgresql://" + url[len("postgres://") :]
    return url


def _load_pages(
    conn: psycopg.Connection,
    prefixes: list[str],
    limit_pages: int | None,
) -> list[dict]:
    """Return one row per unique page with chunk_ids list."""
    clauses = []
    params: list[object] = []
    for i, pref in enumerate(prefixes):
        clauses.append(f"c.vehicle_id LIKE %s")
        params.append(pref if pref.endswith("%") else pref + "%")
    where = " OR ".join(clauses) if clauses else "TRUE"
    sql = f"""
    SELECT c.chunk_id, c.vehicle_id, c.document_id, c.page_start, c.page_end,
           d.provenance
    FROM chunks c
    JOIN documents d ON d.id = c.document_pk
    WHERE c.page_start IS NOT NULL
      AND ({where})
    ORDER BY c.vehicle_id, c.document_id, c.page_start, c.chunk_id
    """
    with conn.cursor(row_factory=dict_row) as cur:
        cur.execute(sql, params)
        rows = list(cur.fetchall())

    grouped: dict[tuple[str, str, int], dict] = {}
    for r in rows:
        key = (r["vehicle_id"], r["document_id"], int(r["page_start"]))
        if key not in grouped:
            grouped[key] = {
                "vehicle_id": r["vehicle_id"],
                "document_id": r["document_id"],
                "page_start": int(r["page_start"]),
                "page_end": r["page_end"],
                "provenance": r["provenance"],
                "chunk_ids": [],
            }
        grouped[key]["chunk_ids"].append(r["chunk_id"])

    pages = list(grouped.values())
    if limit_pages is not None:
        pages = pages[:limit_pages]
    return pages


def _existing_chunk_ids(conn: psycopg.Connection, model_id: str) -> set[str]:
    with conn.cursor() as cur:
        cur.execute(
            "SELECT chunk_id FROM chunk_image_embeddings WHERE embedding_model = %s",
            (model_id,),
        )
        return {r[0] for r in cur.fetchall()}


def run_embed(args: argparse.Namespace) -> int:
    garage = garage_root_from_env(args.garage_root)
    url = _database_url(args.database_url)
    prefixes = args.vehicle_prefix or ["cat:%"]
    batch = max(1, int(args.batch_size))

    stats = {
        "pages_total": 0,
        "pages_skipped_done": 0,
        "pages_skipped_no_png": 0,
        "pages_embedded": 0,
        "chunk_rows_upserted": 0,
        "errors": 0,
        "model_id": MODEL_ID,
        "garage_root": str(garage),
        "prefixes": prefixes,
    }

    t0 = time.perf_counter()
    with psycopg.connect(url) as conn:
        pages = _load_pages(conn, prefixes, args.limit_pages)
        stats["pages_total"] = len(pages)
        done = _existing_chunk_ids(conn, MODEL_ID) if not args.force else set()

        pending: list[dict] = []
        for page in pages:
            if (
                not args.force
                and page["chunk_ids"]
                and all(cid in done for cid in page["chunk_ids"])
            ):
                stats["pages_skipped_done"] += 1
                continue
            pending.append(page)

        if args.dry_run:
            stats["pages_pending"] = len(pending)
            stats["dry_run"] = True
            print(json.dumps(stats, indent=2))
            return 0

        # Warm CLIP once
        from mecharag.clip_m2 import load_clip

        load_clip()

        for i in range(0, len(pending), batch):
            chunk_pages = pending[i : i + batch]
            paths: list[Path] = []
            meta: list[dict] = []
            for page in chunk_pages:
                vid = page["vehicle_id"]
                did = page["document_id"]
                pnum = page["page_start"]
                out = asset_path(garage, vid, did, pnum)
                try:
                    if out.is_file() and out.stat().st_size > 0:
                        png = out
                    else:
                        bronze = resolve_bronze_pdf_from_provenance(
                            garage, page["provenance"]
                        )
                        if bronze is None:
                            stats["pages_skipped_no_png"] += 1
                            continue
                        png = ensure_page_png(
                            garage_root=garage,
                            bronze_pdf=bronze,
                            vehicle_id=vid,
                            document_id=did,
                            page=pnum,
                        )
                    paths.append(png)
                    meta.append(page)
                except Exception as e:
                    stats["errors"] += 1
                    print(
                        json.dumps(
                            {
                                "event": "m2_embed_page_error",
                                "vehicle_id": vid,
                                "document_id": did,
                                "page": pnum,
                                "error": str(e),
                            }
                        ),
                        flush=True,
                    )

            if not paths:
                continue

            try:
                vectors = encode_image_paths(paths)
            except Exception as e:
                stats["errors"] += 1
                print(
                    json.dumps({"event": "m2_embed_batch_error", "error": str(e)}),
                    flush=True,
                )
                continue

            with conn.cursor() as cur:
                for page, vec, png in zip(meta, vectors, paths):
                    if len(vec) != EMBED_DIM:
                        stats["errors"] += 1
                        continue
                    emb_lit = "[" + ",".join(str(float(x)) for x in vec) + "]"
                    locator = str(png.relative_to(garage)) if png.is_relative_to(garage) else str(png)
                    for cid in page["chunk_ids"]:
                        cur.execute(
                            UPSERT_SQL,
                            {
                                "chunk_id": cid,
                                "vehicle_id": page["vehicle_id"],
                                "document_id": page["document_id"],
                                "page_start": page["page_start"],
                                "page_end": page["page_end"],
                                "embedding": emb_lit,
                                "embedding_model": MODEL_ID,
                                "embedding_dim": EMBED_DIM,
                                "asset_locator": locator,
                            },
                        )
                        stats["chunk_rows_upserted"] += 1
                    stats["pages_embedded"] += 1
                conn.commit()

            print(
                json.dumps(
                    {
                        "event": "m2_embed_progress",
                        "done_pages": stats["pages_embedded"],
                        "skipped_done": stats["pages_skipped_done"],
                        "skipped_no_png": stats["pages_skipped_no_png"],
                        "errors": stats["errors"],
                        "batch_end": min(i + batch, len(pending)),
                        "pending_total": len(pending),
                    }
                ),
                flush=True,
            )

    stats["elapsed_s"] = round(time.perf_counter() - t0, 2)
    print(json.dumps({"event": "m2_embed_complete", **stats}, indent=2))
    return 0 if stats["errors"] == 0 else 1


def build_parser() -> argparse.ArgumentParser:
    p = argparse.ArgumentParser(
        description="M2: embed garage page PNGs into chunk_image_embeddings",
    )
    p.add_argument("--database-url", default=None)
    p.add_argument("--garage-root", default=None)
    p.add_argument(
        "--vehicle-prefix",
        action="append",
        default=None,
        help="Repeatable LIKE prefix (default: cat:%%). Example: fixture:",
    )
    p.add_argument("--limit-pages", type=int, default=None)
    p.add_argument("--batch-size", type=int, default=4)
    p.add_argument("--force", action="store_true", help="Re-embed even if present")
    p.add_argument("--dry-run", action="store_true")
    return p


def main(argv: list[str] | None = None) -> int:
    args = build_parser().parse_args(argv)
    return run_embed(args)


if __name__ == "__main__":
    raise SystemExit(main())
