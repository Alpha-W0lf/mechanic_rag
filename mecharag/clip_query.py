"""CLI: encode one query string with CLIP text tower (M2 ask path).

Stdout: single JSON object {"embedding":[...],"dim":512,"model":"..."}
Exit 0 on success; non-zero on missing deps / encode failure.
"""

from __future__ import annotations

import argparse
import json
import sys

from mecharag.clip_m2 import EMBED_DIM, MODEL_ID, encode_text


def main(argv: list[str] | None = None) -> int:
    p = argparse.ArgumentParser(description="M2 CLIP text query embed")
    p.add_argument("--text", required=True, help="Query text")
    args = p.parse_args(argv)
    try:
        emb = encode_text(args.text)
    except Exception as e:
        print(json.dumps({"error": str(e)}), file=sys.stderr)
        return 2
    print(
        json.dumps(
            {
                "embedding": emb,
                "dim": EMBED_DIM,
                "model": MODEL_ID,
            }
        )
    )
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
