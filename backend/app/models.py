"""Shared response and request models for the document Q&A API."""

from typing import Literal

from pydantic import BaseModel, Field


class QueryRequest(BaseModel):
    query: str = Field(..., min_length=2, max_length=1000)
    top_k: int = Field(default=5, ge=1, le=20)
    threshold: float = Field(default=0.0, ge=0.0, le=1.0)


class Source(BaseModel):
    document_id: str
    document_name: str
    page_number: int
    chunk_text: str
    relevance_score: float


class QueryResponse(BaseModel):
    answer: str
    sources: list[Source]
    confidence: float
    query_id: str
    processing_time_ms: float


class DocumentSummary(BaseModel):
    document_id: str
    filename: str
    status: Literal["ready", "error"]
    num_pages: int
    num_chunks: int
    uploaded_at: str
    error: str | None = None


class UploadResponse(DocumentSummary):
    processing_time_ms: float


class HealthResponse(BaseModel):
    status: Literal["ok"]
    app_name: str
    version: str
    documents: int
    chunks: int
