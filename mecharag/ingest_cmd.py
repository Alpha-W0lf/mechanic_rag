"""mecharag ingest command."""

from __future__ import annotations

import logging
import os
import uuid
from dataclasses import dataclass
from pathlib import Path
from typing import Any

import psycopg
from dotenv import load_dotenv

from mecharag.chunking import chunk_manifest_units
from mecharag.db_upsert import content_hash_exists, upsert_document_version
from mecharag.embedder import OllamaEmbedder, make_embedder
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

DOC_PROGRESS_EVERY = 1
CHUNK_PROGRESS_EVERY = 100


@dataclass(frozen=True)
class IngestItem:
    """One flat Contract 7.2 document manifest ready to index."""

    manifest: dict[str, Any]
    error_path: str


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


def _embed_with_progress(
    embedder: OllamaEmbedder,
    drafts: list[Any],
    *,
    document_id: str,
    chunk_progress_every: int,
) -> list[list[float]]:
    """Embed all chunk texts; log progress on large documents."""
    texts = [d.content for d in drafts]
    total = len(texts)
    if chunk_progress_every < 1 or total <= chunk_progress_every:
        return embedder.embed(texts)

    vectors: list[list[float]] = []
    for i, text in enumerate(texts, start=1):
        vectors.extend(embedder.embed([text]))
        if i % chunk_progress_every == 0 or i == total:
            logger.info(
                "embed progress document_id=%s chunks=%s/%s",
                document_id,
                i,
                total,
            )
    return vectors


def _upsert_loaded_documents(
    conn: Any,
    embedder: OllamaEmbedder,
    items: list[IngestItem],
    *,
    doc_progress_every: int = DOC_PROGRESS_EVERY,
    chunk_progress_every: int = CHUNK_PROGRESS_EVERY,
) -> tuple[int, int, int]:
    """Index each loaded document; isolate failures per document.

    Business rule (inputs → outcomes):
    - If ``(vehicle_id, document_id, content_hash)`` already exists →
      **skipped** without chunk/embed (idempotent cheap re-run).
    - Else chunk → embed → ``upsert_document_version`` → inserted|skipped.
    - Empty chunk lists fail that item only; siblings continue.
    - Returns ``(inserted, skipped, failed)``.
    """
    inserted = skipped = failed = 0
    total = len(items)
    for i, item in enumerate(items, start=1):
        try:
            manifest = item.manifest
            vehicle_id = str(manifest["vehicle_id"])
            document_id = str(manifest["document_id"])
            content_hash = str(manifest["content_hash"])
            if content_hash_exists(conn, vehicle_id, document_id, content_hash):
                skipped += 1
                logger.info(
                    "doc=%s vehicle=%s hash=%s status=skipped chunks=0 "
                    "(unchanged; skip before embed)",
                    document_id,
                    vehicle_id,
                    content_hash[:12],
                )
            else:
                drafts = chunk_manifest_units(
                    document_id,
                    manifest["artifact_version"],
                    manifest["units"],
                )
                if not drafts:
                    raise ValueError("no chunks produced")
                embeddings = _embed_with_progress(
                    embedder,
                    drafts,
                    document_id=document_id,
                    chunk_progress_every=chunk_progress_every,
                )
                status = upsert_document_version(
                    conn,
                    manifest=manifest,
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
                    document_id,
                    vehicle_id,
                    content_hash[:12],
                    status,
                    len(drafts),
                )
        except Exception:  # noqa: BLE001 — per-doc isolation
            failed += 1
            logger.exception("document failed path=%s", item.error_path)
        if doc_progress_every >= 1 and (
            i % doc_progress_every == 0 or i == total
        ):
            logger.info(
                "ingest progress docs=%s/%s inserted=%s skipped=%s failed=%s",
                i,
                total,
                inserted,
                skipped,
                failed,
            )
    return inserted, skipped, failed


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

    embedder = make_embedder()
    inserted = skipped = failed = 0
    try:
        with psycopg.connect(database_url) as conn:
            items: list[IngestItem] = []
            for mpath in manifests:
                try:
                    doc = source.load_one(mpath)
                    items.append(
                        IngestItem(manifest=doc.manifest, error_path=str(mpath))
                    )
                except Exception:  # noqa: BLE001 — isolate load failures
                    failed += 1
                    logger.exception("document failed path=%s", mpath)
            up_i, up_s, up_f = _upsert_loaded_documents(conn, embedder, items)
            inserted += up_i
            skipped += up_s
            failed += up_f
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

    items = [
        IngestItem(manifest=doc.manifest, error_path=str(doc.release_path))
        for doc in documents
    ]
    embedder = make_embedder()
    try:
        with psycopg.connect(database_url) as conn:
            inserted, skipped, failed = _upsert_loaded_documents(
                conn, embedder, items
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
