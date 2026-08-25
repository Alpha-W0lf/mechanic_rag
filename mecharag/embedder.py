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


class GeminiEmbedder:
    """Google Generative Language text embedding (gemini-embedding-001 @ 768)."""

    API_URL = "https://generativelanguage.googleapis.com/v1beta/models/{model}:embedContent"

    def __init__(
        self,
        *,
        api_key: str | None = None,
        model: str | None = None,
        dim: int | None = None,
        timeout_s: float = 60.0,
    ) -> None:
        self.api_key = api_key or os.getenv("GEMINI_API_KEY") or ""
        if not self.api_key:
            raise EmbeddingError("GEMINI_API_KEY not set")
        self.model = model or os.getenv("EMBEDDING_MODEL") or "gemini-embedding-001"
        self.dim = int(dim or os.getenv("EMBEDDING_DIM") or 768)
        self.timeout_s = timeout_s

    def embed(self, texts: Sequence[str]) -> list[list[float]]:
        import urllib.request
        import json as _json

        vectors: list[list[float]] = []
        url = self.API_URL.format(model=self.model)
        for text in texts:
            body = _json.dumps(
                {
                    "model": f"models/{self.model}",
                    "content": {"parts": [{"text": text}]},
                    "outputDimensionality": self.dim,
                }
            ).encode()
            req = urllib.request.Request(
                f"{url}?key={self.api_key}",
                data=body,
                headers={"Content-Type": "application/json"},
                method="POST",
            )
            with urllib.request.urlopen(req, timeout=self.timeout_s) as resp:
                data = _json.loads(resp.read())
            vec = (data.get("embedding") or {}).get("values")
            if not isinstance(vec, list):
                raise EmbeddingError("Gemini response missing embedding values")
            if len(vec) != self.dim:
                raise EmbeddingError(
                    f"embedding dim mismatch: got {len(vec)}, expected {self.dim} "
                    f"(model={self.model})"
                )
            vectors.append(vec)
        return vectors


def make_embedder():
    """Provider selection: MECHANIC_EMBEDDING_PROVIDER=gemini|ollama."""
    provider = (os.getenv("MECHANIC_EMBEDDING_PROVIDER") or "").strip().lower()
    if provider == "gemini":
        return GeminiEmbedder()
    return OllamaEmbedder()
