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
from mecharag.gold_status import (
    GoldStatusError,
    collect_gold_status,
    honesty_log_message,
    soft_adjust_honesty_log_message,
)
from mecharag.private_gold_source import PrivateGoldSource, PrivateGoldSourceError

logger = logging.getLogger(__name__)

FIXTURE_SOURCES = frozenset({"fixtures", "fixture", "FixtureSource"})
PRIVATE_SOURCES = frozenset({"private-gold", "private_gold", "PrivateGoldSource"})


def run_ingest(args) -> int:
    load_dotenv()
    load_dotenv("web/.env.local")

    run_id = str(uuid.uuid4())
    logging.basicConfig(level=logging.INFO, format="%(levelname)s %(message)s")
    logger.info("ingest start run_id=%s source=%s", run_id, args.source)

    database_url = (
        args.database_url
        or os.getenv("DATABASE_URL")
        or "postgres://mechanic:mechanic@localhost:5433/mechanic_rag"
    )

    if args.source in FIXTURE_SOURCES:
        return _ingest_fixtures(args, run_id, database_url)
    if args.source in PRIVATE_SOURCES:
        return _ingest_private_gold(args, run_id, database_url)

    logger.error(
        "unsupported --source %s (use fixtures | private-gold)",
        args.source,
    )
    return 2


def _ingest_fixtures(args, run_id: str, database_url: str) -> int:
    root = Path(args.root or os.getenv("FIXTURE_ROOT") or "fixtures").resolve()
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


def _resolve_private_gold_root(args) -> Path:
    raw = args.root or os.getenv("MECHANIC_PRIVATE_GOLD_ROOT")
    if not raw:
        raise PrivateGoldSourceError(
            "MECHANIC_PRIVATE_GOLD_ROOT required for --source private-gold "
            "(or pass --root); refusing silent fixtures fallthrough"
        )
    root = Path(raw).expanduser().resolve()
    fixtures_default = Path("fixtures").resolve()
    try:
        root.relative_to(fixtures_default)
    except ValueError:
        return root
    raise PrivateGoldSourceError(
        f"private-gold root must not be default fixtures/: {root}"
    )


def _ingest_private_gold(args, run_id: str, database_url: str) -> int:
    try:
        root = _resolve_private_gold_root(args)
        source = PrivateGoldSource(root)
        releases = source.discover()
        for path, status in collect_gold_status(root, release_paths=releases):
            logger.info("%s", honesty_log_message(status, path))
        documents = source.load_all()
        if source.last_soft_adjust_status is not None:
            sa_path, sa_status = source.last_soft_adjust_status
            logger.info(
                "%s", soft_adjust_honesty_log_message(sa_status, sa_path)
            )
    except (PrivateGoldSourceError, GoldStatusError) as exc:
        logger.error("%s", exc)
        return 2

    if not documents:
        logger.error("no Contract 7.2 documents under %s", root)
        return 1

    vehicle_ids = {str(d.manifest["vehicle_id"]) for d in documents}
    logger.info(
        "private-gold vehicles=%s count=%s",
        sorted(vehicle_ids),
        len(vehicle_ids),
    )

    embedder = OllamaEmbedder()
    inserted = skipped = failed = 0

    try:
        with psycopg.connect(database_url) as conn:
            for doc in documents:
                try:
                    drafts = chunk_manifest_units(
                        doc.manifest["document_id"],
                        doc.manifest["artifact_version"],
                        doc.manifest["units"],
                    )
                    if not drafts:
                        raise PrivateGoldSourceError("no chunks produced")
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
                        "doc=%s vehicle=%s hash=%s status=%s chunks=%s",
                        doc.manifest["document_id"],
                        doc.manifest["vehicle_id"],
                        doc.manifest["content_hash"][:12],
                        status,
                        len(drafts),
                    )
                except Exception as exc:  # noqa: BLE001 — per-doc isolation
                    failed += 1
                    logger.exception(
                        "document failed path=%s err=%s",
                        doc.release_path,
                        exc,
                    )
    except Exception as exc:  # noqa: BLE001
        logger.exception("ingest aborted: %s", exc)
        return 1

    logger.info(
        "ingest done run_id=%s inserted=%s skipped=%s failed=%s vehicles=%s",
        run_id,
        inserted,
        skipped,
        failed,
        len(vehicle_ids),
    )
    return 0 if failed == 0 else 1
