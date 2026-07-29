#!/usr/bin/env python3
"""Planning spike only — M2 fixture image embed (Ready gate).

Not product code. Records model_id, dim, latency for Ready freeze.
Usage (after torch+transformers installed in .venv):
  .venv/bin/python scripts/spike_m2_fixture_embed.py
"""

from __future__ import annotations

import json
import time
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
PNG_DIR = ROOT / "output" / "images" / "Honda_s2000_owners_manual_2001"
OUT = ROOT / "docs" / "2026-07-26_spike_evidence_m2_fixture_embed.json"
MODEL_ID = "openai/clip-vit-base-patch32"
N_PAGES = 5


def _as_feat_tensor(feats):
    """transformers 5.x may return BaseModelOutputWithPooling instead of a Tensor."""
    if hasattr(feats, "pooler_output") and feats.pooler_output is not None:
        return feats.pooler_output
    if hasattr(feats, "last_hidden_state"):
        return feats.last_hidden_state[:, 0, :]
    return feats


def main() -> int:
    try:
        import torch
        from PIL import Image
        from transformers import CLIPModel, CLIPProcessor
    except ImportError as e:
        print(f"MISSING_DEP: {e}")
        print("Install spike deps: uv pip install torch transformers pillow")
        return 2

    pngs = sorted(PNG_DIR.glob("page_*.png"))[:N_PAGES]
    if len(pngs) < N_PAGES:
        print(f"NEED_PNGS: found {len(pngs)} under {PNG_DIR}")
        return 3

    device = "mps" if torch.backends.mps.is_available() else "cpu"
    t0 = time.perf_counter()
    try:
        processor = CLIPProcessor.from_pretrained(MODEL_ID, local_files_only=True)
        model = CLIPModel.from_pretrained(MODEL_ID, local_files_only=True).to(device)
    except Exception:
        processor = CLIPProcessor.from_pretrained(MODEL_ID)
        model = CLIPModel.from_pretrained(MODEL_ID).to(device)
    model.eval()
    load_s = time.perf_counter() - t0

    dims: list[int] = []
    latencies: list[float] = []
    with torch.no_grad():
        for p in pngs:
            img = Image.open(p).convert("RGB")
            inputs = processor(images=img, return_tensors="pt")
            inputs = {k: v.to(device) for k, v in inputs.items()}
            t1 = time.perf_counter()
            feats = _as_feat_tensor(model.get_image_features(**inputs))
            latencies.append(time.perf_counter() - t1)
            dims.append(int(feats.shape[-1]))

    # text tower smoke (query path candidate)
    t2 = time.perf_counter()
    text_in = processor(text=["belt routing diagram"], return_tensors="pt", padding=True)
    text_in = {k: v.to(device) for k, v in text_in.items()}
    with torch.no_grad():
        text_feats = _as_feat_tensor(model.get_text_features(**text_in))
    text_s = time.perf_counter() - t2
    text_dim = int(text_feats.shape[-1])

    evidence = {
        "spike": "m2_fixture_embed",
        "date_local_hint": "2026-07-26",
        "model_id": MODEL_ID,
        "device": device,
        "n_pages": len(pngs),
        "png_paths": [str(p.relative_to(ROOT)) for p in pngs],
        "image_embedding_dim": dims[0] if dims else None,
        "text_embedding_dim": text_dim,
        "dim_consistent": len(set(dims)) == 1 and dims[0] == text_dim,
        "load_seconds": round(load_s, 3),
        "per_image_seconds": [round(x, 4) for x in latencies],
        "p95_image_seconds_approx": round(sorted(latencies)[int(0.95 * (len(latencies) - 1))], 4),
        "text_query_seconds": round(text_s, 4),
        "query_tower": "clip_text_tower_same_model",
        "side_table_dim_recommendation": dims[0] if dims else None,
        "notes": "Planning spike only; not wired into ask. Prefer this model_id for M2 Ready freeze if dim_consistent.",
    }
    OUT.write_text(json.dumps(evidence, indent=2) + "\n")
    print(json.dumps(evidence, indent=2))
    print(f"WROTE {OUT}")
    return 0 if evidence.get("dim_consistent") else 4


if __name__ == "__main__":
    raise SystemExit(main())
