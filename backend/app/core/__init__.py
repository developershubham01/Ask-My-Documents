"""
Custom exception classes for the RAG application.

Provides typed exceptions that map to specific HTTP status codes,
enabling clean error handling throughout the application.
"""

from typing import Any, Optional


class RAGBaseException(Exception):
    """Base exception for all RAG application errors."""

    def __init__(
        self,
        message: str,
        status_code: int = 500,
        detail: Optional[dict[str, Any]] = None,
    ) -> None:
        self.message = message
        self.status_code = status_code
        self.detail = detail or {}
        super().__init__(self.message)


class DocumentNotFoundError(RAGBaseException):
    """Raised when a document is not found in the system."""

    def __init__(self, document_id: str) -> None:
        super().__init__(
            message=f"Document not found: {document_id}",
            status_code=404,
            detail={"document_id": document_id},
        )


class DocumentProcessingError(RAGBaseException):
    """Raised when document processing (PDF extraction, chunking) fails."""

    def __init__(self, filename: str, reason: str) -> None:
        super().__init__(
            message=f"Failed to process document '{filename}': {reason}",
            status_code=422,
            detail={"filename": filename, "reason": reason},
        )


class EmbeddingError(RAGBaseException):
    """Raised when embedding generation fails."""

    def __init__(self, reason: str) -> None:
        super().__init__(
            message=f"Embedding generation failed: {reason}",
            status_code=500,
            detail={"reason": reason},
        )


class VectorStoreError(RAGBaseException):
    """Raised when vector store operations fail."""

    def __init__(self, operation: str, reason: str) -> None:
        super().__init__(
            message=f"Vector store {operation} failed: {reason}",
            status_code=500,
            detail={"operation": operation, "reason": reason},
        )


class LLMError(RAGBaseException):
    """Raised when LLM API calls fail."""

    def __init__(self, provider: str, reason: str) -> None:
        super().__init__(
            message=f"LLM ({provider}) error: {reason}",
            status_code=502,
            detail={"provider": provider, "reason": reason},
        )


class FileValidationError(RAGBaseException):
    """Raised when uploaded file validation fails."""

    def __init__(self, reason: str) -> None:
        super().__init__(
            message=f"File validation failed: {reason}",
            status_code=400,
            detail={"reason": reason},
        )


class SearchError(RAGBaseException):
    """Raised when search operations fail."""

    def __init__(self, search_type: str, reason: str) -> None:
        super().__init__(
            message=f"Search ({search_type}) failed: {reason}",
            status_code=500,
            detail={"search_type": search_type, "reason": reason},
        )


class RateLimitError(RAGBaseException):
    """Raised when rate limit is exceeded."""

    def __init__(self) -> None:
        super().__init__(
            message="Rate limit exceeded. Please try again later.",
            status_code=429,
        )
