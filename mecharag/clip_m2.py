"""M2 CLIP helpers — optional [m2] extra (torch/transformers/pillow).

Business rules:
  - Model ID frozen: openai/clip-vit-base-patch32 → 512-d.
  - Image and text towers share that model; L2-normalize before store/query.
  - Fail closed on dim != 512.
  - Import of torch/transformers is lazy so default install stays light.
"""

from __future__ import annotations

from pathlib import Path
from typing import Any

MODEL_ID = "openai/clip-vit-base-patch32"
EMBED_DIM = 512

_model: Any = None
_processor: Any = None
_device: str | None = None


def _as_feat_tensor(feats: Any) -> Any:
    """transformers 5.x may return BaseModelOutputWithPooling instead of a Tensor."""
    if hasattr(feats, "pooler_output") and feats.pooler_output is not None:
        return feats.pooler_output
    if hasattr(feats, "last_hidden_state"):
        return feats.last_hidden_state[:, 0, :]
    return feats


def _require_torch():
    try:
        import torch
        from PIL import Image  # noqa: F401
        from transformers import CLIPModel, CLIPProcessor
    except ImportError as e:
        raise ImportError(
            "M2 CLIP requires optional extra [m2]: "
            "uv pip install 'mecharag[m2]' (torch, transformers, pillow)"
        ) from e
    return torch, Image, CLIPModel, CLIPProcessor


def load_clip(device: str | None = None) -> tuple[Any, Any, str]:
    """Load CLIP once per process. Returns (model, processor, device)."""
    global _model, _processor, _device
    if _model is not None and _processor is not None and _device is not None:
        return _model, _processor, _device

    torch, _Image, CLIPModel, CLIPProcessor = _require_torch()
    if device is None:
        device = "mps" if torch.backends.mps.is_available() else "cpu"
    try:
        processor = CLIPProcessor.from_pretrained(MODEL_ID, local_files_only=True)
        model = CLIPModel.from_pretrained(MODEL_ID, local_files_only=True).to(device)
    except Exception:
        processor = CLIPProcessor.from_pretrained(MODEL_ID)
        model = CLIPModel.from_pretrained(MODEL_ID).to(device)
    model.eval()
    _model, _processor, _device = model, processor, device
    return model, processor, device


def encode_image_paths(paths: list[Path]) -> list[list[float]]:
    """Embed RGB page PNGs → L2-normalized 512-d vectors (one per path)."""
    if not paths:
        return []
    torch, Image, _CLIPModel, _CLIPProcessor = _require_torch()
    model, processor, device = load_clip()
    images = [Image.open(p).convert("RGB") for p in paths]
    inputs = processor(images=images, return_tensors="pt")
    inputs = {k: v.to(device) for k, v in inputs.items()}
    with torch.no_grad():
        feats = _as_feat_tensor(model.get_image_features(**inputs))
        feats = torch.nn.functional.normalize(feats, dim=-1)
    if feats.shape[-1] != EMBED_DIM:
        raise ValueError(f"image embed dim {feats.shape[-1]} != {EMBED_DIM}")
    return feats.detach().cpu().tolist()


def encode_text(text: str) -> list[float]:
    """Embed query text with CLIP text tower → L2-normalized 512-d vector."""
    q = (text or "").strip()
    if not q:
        raise ValueError("empty query text")
    torch, _Image, _CLIPModel, _CLIPProcessor = _require_torch()
    model, processor, device = load_clip()
    inputs = processor(text=[q], return_tensors="pt", padding=True, truncation=True)
    inputs = {k: v.to(device) for k, v in inputs.items()}
    with torch.no_grad():
        feats = _as_feat_tensor(model.get_text_features(**inputs))
        feats = torch.nn.functional.normalize(feats, dim=-1)
    if feats.shape[-1] != EMBED_DIM:
        raise ValueError(f"text embed dim {feats.shape[-1]} != {EMBED_DIM}")
    return feats[0].detach().cpu().tolist()
