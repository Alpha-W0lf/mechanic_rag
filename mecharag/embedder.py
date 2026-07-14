"""Local embedding adapter via Ollama HTTP API."""

from __future__ import annotations

import os
from typing import Sequence

import requests


class EmbeddingError(RuntimeError):
    pass


class OllamaEmbedder:
    def __init__(
        self,
        *,
        base_url: str | None = None,
        model: str | None = None,
        dim: int | None = None,
        timeout_s: float = 60.0,
    ) -> None:
        self.base_url = (base_url or os.getenv("EMBEDDING_BASE_URL") or os.getenv("OLLAMA_BASE_URL") or "http://127.0.0.1:11434").rstrip("/")
        self.model = model or os.getenv("EMBEDDING_MODEL") or "nomic-embed-text"
        self.dim = int(dim or os.getenv("EMBEDDING_DIM") or 768)
        self.timeout_s = timeout_s

    def embed(self, texts: Sequence[str]) -> list[list[float]]:
        vectors: list[list[float]] = []
        for text in texts:
            resp = requests.post(
                f"{self.base_url}/api/embeddings",
                json={"model": self.model, "prompt": text},
                timeout=self.timeout_s,
            )
            if resp.status_code != 200:
                raise EmbeddingError(
                    f"Ollama embed failed ({resp.status_code}): {resp.text[:200]}"
                )
            data = resp.json()
            vec = data.get("embedding")
            if not isinstance(vec, list):
                raise EmbeddingError("Ollama response missing embedding list")
            if len(vec) != self.dim:
                raise EmbeddingError(
                    f"embedding dim mismatch: got {len(vec)}, expected {self.dim} "
                    f"(model={self.model})"
                )
            vectors.append(vec)
        return vectors
