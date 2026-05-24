"""FastAPI entry point for Ask My Documents."""

from __future__ import annotations

import time
import uuid

from fastapi import FastAPI, File, Query, Request, UploadFile
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

from app.config import settings
from app.core.exceptions import RAGBaseException
from app.models import HealthResponse, QueryRequest, QueryResponse
from app.services.answer_service import build_answer
from app.services.document_store import DocumentStore

store = DocumentStore()


def create_app() -> FastAPI:
    app = FastAPI(title=settings.APP_NAME, version=settings.APP_VERSION)

    app.add_middleware(
        CORSMiddleware,
        allow_origins=settings.CORS_ORIGINS,
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )

    @app.middleware("http")
    async def add_request_id(request: Request, call_next):
        request_id = request.headers.get("X-Request-ID", uuid.uuid4().hex)
        response = await call_next(request)
        response.headers["X-Request-ID"] = request_id
        return response

    @app.exception_handler(RAGBaseException)
    async def rag_exception_handler(_: Request, exc: RAGBaseException):
        return JSONResponse(
            status_code=exc.status_code,
            content={"error": exc.message, "detail": exc.detail},
        )

    @app.exception_handler(Exception)
    async def unhandled_exception_handler(_: Request, exc: Exception):
        return JSONResponse(
            status_code=500,
            content={"error": "Unexpected server error", "detail": str(exc)},
        )

    @app.get("/api/v1/health", response_model=HealthResponse)
    async def health() -> HealthResponse:
        documents, chunks = store.stats()
        return HealthResponse(
            status="ok",
            app_name=settings.APP_NAME,
            version=settings.APP_VERSION,
            documents=documents,
            chunks=chunks,
        )

    @app.post("/api/v1/upload")
    async def upload_documents(files: list[UploadFile] = File(...)):
        uploads = []
        for file in files:
            uploads.append(await store.add_upload(file))
        return {"documents": uploads}

    @app.get("/api/v1/documents")
    async def list_documents():
        return {"documents": store.list_documents()}

    @app.delete("/api/v1/documents/{document_id}")
    async def delete_document(document_id: str):
        store.delete_document(document_id)
        return {"status": "deleted", "document_id": document_id}

    @app.post("/api/v1/query", response_model=QueryResponse)
    async def query_documents(
        payload: QueryRequest,
        stream: bool = Query(default=False),
    ) -> QueryResponse:
        start = time.perf_counter()
        hits = store.search(payload.query, payload.top_k, payload.threshold)
        sources = [hit.source for hit in hits]
        answer, confidence = await build_answer(payload.query, sources)
        elapsed = (time.perf_counter() - start) * 1000
        return QueryResponse(
            answer=answer,
            sources=sources,
            confidence=confidence,
            query_id=uuid.uuid4().hex,
            processing_time_ms=round(elapsed, 2),
        )

    return app


app = create_app()
