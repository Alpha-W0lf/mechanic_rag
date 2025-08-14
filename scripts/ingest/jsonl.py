from __future__ import annotations

import json
from dataclasses import asdict, is_dataclass
from pathlib import Path
from typing import Iterable, Mapping, Any


def _to_jsonable(record: Any) -> Mapping[str, Any] | Any:
    if is_dataclass(record):
        return asdict(record)
    return record


def write_jsonl(path: Path, records: Iterable[Any]) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    with path.open("w", encoding="utf-8") as f:
        for rec in records:
            jsonable = _to_jsonable(rec)
            f.write(json.dumps(jsonable, ensure_ascii=False) + "\n")
