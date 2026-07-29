"""Unit tests for M2 multi-list RRF parity helpers (Python side smoke)."""

from mecharag.clip_m2 import EMBED_DIM, MODEL_ID


def test_clip_freeze_constants():
    assert MODEL_ID == "openai/clip-vit-base-patch32"
    assert EMBED_DIM == 512
