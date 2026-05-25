"""Local PDF ingestion, chunk storage, and lightweight retrieval.

This implementation is intentionally dependency-light so the project runs on a
fresh machine while still exposing the same API shape as the fuller RAG plan.
It can later be swapped for ChromaDB and embedding services behind this module.
"""

from __future__ import annotations

import json
import math
import re
import shutil
import time
import uuid
from collections import Counter
from dataclasses import dataclass
from datetime import UTC, datetime
from pathlib import Path
from threading import RLock
from typing import Any

from fastapi import UploadFile
from pypdf import PdfReader

from app.config import settings
from app.core.exceptions import (
    DocumentNotFoundError,
    DocumentProcessingError,
    FileValidationError,
)
from app.models import DocumentSummary, Source, UploadResponse


TOKEN_RE = re.compile(r"[a-zA-Z0-9][a-zA-Z0-9'-]*")


@dataclass(frozen=True)
class SearchHit:
    source: Source
    score: float


class DocumentStore:
    """Persistent JSON-backed document index."""

    def __init__(self) -> None:
        self.upload_dir = Path(settings.UPLOAD_DIR)
        self.data_dir = self.upload_dir.parent
        self.index_path = self.data_dir / "index.json"
        self.lock = RLock()
        self.data_dir.mkdir(parents=True, exist_ok=True)
        self.upload_dir.mkdir(parents=True, exist_ok=True)
        self._state: dict[str, Any] = {"documents": {}, "chunks": []}
        self._load()

    def _load(self) -> None:
        if not self.index_path.exists():
            return
        with self.index_path.open("r", encoding="utf-8") as f:
            loaded = json.load(f)
        self._state = {
            "documents": loaded.get("documents", {}),
            "chunks": loaded.get("chunks", []),
        }

    def _save(self) -> None:
        tmp_path = self.index_path.with_suffix(".tmp")
        with tmp_path.open("w", encoding="utf-8") as f:
            json.dump(self._state, f, indent=2, ensure_ascii=False)
        tmp_path.replace(self.index_path)

    def stats(self) -> tuple[int, int]:
        with self.lock:
            return len(self._state["documents"]), len(self._state["chunks"])

    def list_documents(self) -> list[DocumentSummary]:
        with self.lock:
            docs = list(self._state["documents"].values())
        docs.sort(key=lambda item: item["uploaded_at"], reverse=True)
        return [DocumentSummary(**doc) for doc in docs]

    def get_document_file(self, document_id: str) -> tuple[Path, str]:
        with self.lock:
            doc = self._state["documents"].get(document_id)
            if doc is None:
                raise DocumentNotFoundError(document_id)

        stored_path = Path(doc.get("path", "")).resolve()
        upload_root = self.upload_dir.resolve()
        if not stored_path.is_file() or upload_root not in stored_path.parents:
            raise DocumentNotFoundError(document_id)

        return stored_path, doc["filename"]

    async def add_upload(self, upload: UploadFile) -> UploadResponse:
        start = time.perf_counter()
        filename = Path(upload.filename or "document.pdf").name
        self._validate_filename(filename)

        document_id = uuid.uuid4().hex
        stored_name = f"{document_id}_{filename}"
        stored_path = self.upload_dir / stored_name

        try:
            await self._save_upload(upload, stored_path)
            pages = self._extract_pages(stored_path, filename)
            chunks = self._chunk_pages(document_id, filename, pages)
            if not chunks:
                raise DocumentProcessingError(filename, "No readable text was found")

            doc = {
                "document_id": document_id,
                "filename": filename,
                "status": "ready",
                "num_pages": len(pages),
                "num_chunks": len(chunks),
                "uploaded_at": datetime.now(UTC).isoformat(),
                "error": None,
                "path": str(stored_path),
            }
            with self.lock:
                self._state["documents"][document_id] = doc
                self._state["chunks"].extend(chunks)
                self._save()

            elapsed = (time.perf_counter() - start) * 1000
            public_doc = {key: doc[key] for key in DocumentSummary.model_fields}
            return UploadResponse(**public_doc, processing_time_ms=round(elapsed, 2))
        except Exception:
            stored_path.unlink(missing_ok=True)
            raise

    async def _save_upload(self, upload: UploadFile, destination: Path) -> None:
        size = 0
        first = True
        max_size = settings.MAX_FILE_SIZE_MB * 1024 * 1024

        with destination.open("wb") as f:
            while chunk := await upload.read(1024 * 1024):
                if first:
                    first = False
                    if not chunk.startswith(b"%PDF"):
                        raise FileValidationError("Only valid PDF files are supported")
                size += len(chunk)
                if size > max_size:
                    raise FileValidationError(
                        f"File exceeds {settings.MAX_FILE_SIZE_MB}MB limit"
                    )
                f.write(chunk)

        if size == 0:
            raise FileValidationError("Uploaded file is empty")

    def _validate_filename(self, filename: str) -> None:
        suffix = Path(filename).suffix.lower()
        if suffix not in settings.ALLOWED_EXTENSIONS:
            allowed = ", ".join(settings.ALLOWED_EXTENSIONS)
            raise FileValidationError(f"Unsupported file type. Allowed: {allowed}")

    def _extract_pages(self, path: Path, filename: str) -> list[dict[str, Any]]:
        try:
            reader = PdfReader(str(path))
            if reader.is_encrypted:
                try:
                    reader.decrypt("")
                except Exception as exc:
                    raise DocumentProcessingError(filename, "Encrypted PDF") from exc

            pages = []
            for index, page in enumerate(reader.pages, start=1):
                text = page.extract_text() or ""
                text = re.sub(r"\s+", " ", text).strip()
                if text:
                    pages.append({"page_number": index, "text": text})
            return pages
        except DocumentProcessingError:
            raise
        except Exception as exc:
            raise DocumentProcessingError(filename, str(exc)) from exc

    def _chunk_pages(
        self,
        document_id: str,
        filename: str,
        pages: list[dict[str, Any]],
    ) -> list[dict[str, Any]]:
        chunks: list[dict[str, Any]] = []
        for page in pages:
            text = page["text"]
            start = 0
            while start < len(text):
                end = min(start + settings.CHUNK_SIZE, len(text))
                if end < len(text):
                    boundary = max(
                        text.rfind(". ", start, end),
                        text.rfind("\n", start, end),
                        text.rfind(" ", start, end),
                    )
                    if boundary > start + settings.MIN_CHUNK_SIZE:
                        end = boundary + 1

                chunk_text = text[start:end].strip()
                if len(chunk_text) >= settings.MIN_CHUNK_SIZE:
                    chunks.append(
                        {
                            "chunk_id": uuid.uuid4().hex,
                            "document_id": document_id,
                            "document_name": filename,
                            "page_number": page["page_number"],
                            "chunk_index": len(chunks),
                            "text": chunk_text,
                            "tokens": _tokens(chunk_text),
                        }
                    )

                if end >= len(text):
                    break
                start = max(end - settings.CHUNK_OVERLAP, start + 1)
        return chunks

    def delete_document(self, document_id: str) -> None:
        with self.lock:
            doc = self._state["documents"].pop(document_id, None)
            if doc is None:
                raise DocumentNotFoundError(document_id)
            self._state["chunks"] = [
                chunk
                for chunk in self._state["chunks"]
                if chunk["document_id"] != document_id
            ]
            self._save()

        path = doc.get("path")
        if path:
            Path(path).unlink(missing_ok=True)

    def clear(self) -> None:
        with self.lock:
            self._state = {"documents": {}, "chunks": []}
            self._save()
        if self.upload_dir.exists():
            for item in self.upload_dir.iterdir():
                if item.is_file():
                    item.unlink(missing_ok=True)
                elif item.is_dir():
                    shutil.rmtree(item)

    def search(self, query: str, top_k: int, threshold: float = 0.0) -> list[SearchHit]:
        query_tokens = _tokens(query)
        if not query_tokens:
            return []

        with self.lock:
            chunks = list(self._state["chunks"])

        if not chunks:
            return []

        doc_freq = Counter()
        for chunk in chunks:
            doc_freq.update(set(chunk.get("tokens") or _tokens(chunk["text"])))

        query_counts = Counter(query_tokens)
        scored: list[SearchHit] = []
        for chunk in chunks:
            chunk_tokens = chunk.get("tokens") or _tokens(chunk["text"])
            chunk_counts = Counter(chunk_tokens)
            raw = 0.0
            for token, q_count in query_counts.items():
                if token not in chunk_counts:
                    continue
                idf = math.log((1 + len(chunks)) / (1 + doc_freq[token])) + 1
                raw += q_count * chunk_counts[token] * idf

            if raw <= 0:
                continue

            norm = raw / math.sqrt(max(1, len(chunk_tokens)))
            source = Source(
                document_id=chunk["document_id"],
                document_name=chunk["document_name"],
                page_number=chunk["page_number"],
                chunk_text=chunk["text"],
                relevance_score=0.0,
            )
            scored.append(SearchHit(source=source, score=norm))

        if not scored:
            return []

        max_score = max(hit.score for hit in scored)
        normalized = []
        for hit in scored:
            score = hit.score / max_score if max_score else 0.0
            if score >= threshold:
                hit.source.relevance_score = round(score, 4)
                normalized.append(SearchHit(source=hit.source, score=score))

        normalized.sort(key=lambda hit: hit.score, reverse=True)
        return normalized[:top_k]


def _tokens(text: str) -> list[str]:
    return [match.group(0).lower() for match in TOKEN_RE.finditer(text)]
