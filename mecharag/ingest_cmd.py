"""mecharag ingest command."""

from __future__ import annotations

import logging
import os
import uuid
from pathlib import Path

import psycopg
from dotenv import load_dotenv

from mecharag.chunking import chunk_manifest_units
from mecharag.db_upsert import upsert_document_version
from mecharag.embedder import OllamaEmbedder
from mecharag.fixture_source import FixtureSource, FixtureSourceError

logger = logging.getLogger(__name__)


def run_ingest(args) -> int:
    load_dotenv()
    load_dotenv("web/.env.local")

    run_id = str(uuid.uuid4())
    logging.basicConfig(level=logging.INFO, format="%(levelname)s %(message)s")
    logger.info("ingest start run_id=%s source=%s", run_id, args.source)

    if args.source not in ("fixtures", "fixture", "FixtureSource"):
        logger.error("unsupported --source %s (Guide 01: fixtures only)", args.source)
        return 2

    root = Path(args.root or os.getenv("FIXTURE_ROOT") or "fixtures").resolve()
    database_url = (
        args.database_url
        or os.getenv("DATABASE_URL")
        or "postgres://mechanic:mechanic@localhost:5433/mechanic_rag"
    )

    source = FixtureSource(root)
    try:
        manifests = source.discover()
    except FixtureSourceError as exc:
        logger.error("discover failed: %s", exc)
        return 1

    if not manifests:
        logger.error("no manifests under %s", root)
        return 1

    embedder = OllamaEmbedder()
    inserted = skipped = failed = 0

    try:
        with psycopg.connect(database_url) as conn:
            for mpath in manifests:
                try:
                    doc = source.load_one(mpath)
                    # Validate full manifest before writes (already in load_one)
                    drafts = chunk_manifest_units(
                        doc.manifest["document_id"],
                        doc.manifest["artifact_version"],
                        doc.manifest["units"],
                    )
                    if not drafts:
                        raise FixtureSourceError("no chunks produced")
                    embeddings = embedder.embed([d.content for d in drafts])
                    status = upsert_document_version(
                        conn,
                        manifest=doc.manifest,
                        chunks=drafts,
                        embeddings=embeddings,
                        embedding_model=embedder.model,
                        embedding_dim=embedder.dim,
                    )
                    if status == "inserted":
                        inserted += 1
                    else:
                        skipped += 1
                    logger.info(
                        "doc=%s hash=%s status=%s chunks=%s",
                        doc.manifest["document_id"],
                        doc.manifest["content_hash"][:12],
                        status,
                        len(drafts),
                    )
                except Exception as exc:  # noqa: BLE001 — per-doc isolation
                    failed += 1
                    logger.exception("document failed path=%s err=%s", mpath, exc)
                    # Prior indexed version remains queryable (no partial new version)
    except Exception as exc:  # noqa: BLE001
        logger.exception("ingest aborted: %s", exc)
        return 1

    logger.info(
        "ingest done run_id=%s inserted=%s skipped=%s failed=%s",
        run_id,
        inserted,
        skipped,
        failed,
    )
    return 0 if failed == 0 else 1
