"""
Configuration management for the RAG application.

Uses Pydantic BaseSettings for environment variable loading with validation.
All configurable values are centralized here with sensible defaults.
"""

from pathlib import Path
from typing import Literal, Optional

from pydantic import Field, field_validator
from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    """Application settings loaded from environment variables."""

    # --- Application ---
    APP_NAME: str = "Ask My Documents"
    APP_VERSION: str = "1.0.0"
    DEBUG: bool = False
    HOST: str = "0.0.0.0"
    PORT: int = 8000
    CORS_ORIGINS: list[str] = [
        "http://localhost:5173",
        "http://127.0.0.1:5173",
        "http://localhost:3000",
        "http://127.0.0.1:3000",
    ]

    # --- Document Processing ---
    UPLOAD_DIR: str = "./data/uploads"
    MAX_FILE_SIZE_MB: int = 50
    ALLOWED_EXTENSIONS: list[str] = [".pdf"]
    CHUNK_SIZE: int = 500
    CHUNK_OVERLAP: int = 50
    MIN_CHUNK_SIZE: int = 50

    # --- Embedding ---
    EMBEDDING_MODEL: str = "BAAI/bge-small-en-v1.5"
    EMBEDDING_DIMENSION: int = 384
    EMBEDDING_BATCH_SIZE: int = 32
    EMBEDDING_DEVICE: str = "cpu"  # "cpu" or "cuda"

    # --- Vector Store ---
    CHROMA_PERSIST_DIR: str = "./data/chroma"
    CHROMA_COLLECTION_NAME: str = "documents"

    # --- Search ---
    DEFAULT_TOP_K: int = 5
    SEARCH_TOP_K: int = 20  # Retrieve more for reranking
    SCORE_THRESHOLD: float = 0.3
    VECTOR_WEIGHT: float = 0.7
    BM25_WEIGHT: float = 0.3

    # --- Reranker ---
    RERANKER_MODEL: str = "cross-encoder/ms-marco-MiniLM-L-6-v2"
    RERANKER_TOP_K: int = 5
    RERANKER_THRESHOLD: float = 0.1

    # --- LLM ---
    LLM_PROVIDER: Literal["rapidapi", "openai", "ollama"] = "rapidapi"

    # RapidAPI ChatGPT
    RAPIDAPI_KEY: str = ""
    RAPIDAPI_HOST: str = "chatgpt-42.p.rapidapi.com"
    RAPIDAPI_PATH: str = "/conversationgpt4-2"

    # OpenAI (alternative)
    OPENAI_API_KEY: Optional[str] = None
    OPENAI_MODEL: str = "gpt-3.5-turbo"

    # Ollama (alternative)
    OLLAMA_BASE_URL: str = "http://localhost:11434"
    OLLAMA_MODEL: str = "llama3"

    # LLM generation params
    LLM_TEMPERATURE: float = 0.7
    LLM_MAX_TOKENS: int = 1024
    LLM_TOP_P: float = 0.9
    LLM_TOP_K: int = 5
    LLM_RETRY_ATTEMPTS: int = 3
    LLM_RETRY_DELAY: float = 1.0

    # --- BM25 ---
    BM25_INDEX_DIR: str = "./data/bm25"

    # --- Logging ---
    LOG_LEVEL: str = "INFO"
    LOG_FORMAT: Literal["json", "console"] = "console"

    # --- Rate Limiting ---
    RATE_LIMIT_PER_MINUTE: int = 100

    @field_validator("UPLOAD_DIR", "CHROMA_PERSIST_DIR", "BM25_INDEX_DIR")
    @classmethod
    def ensure_dirs_exist(cls, v: str) -> str:
        """Create directories if they don't exist."""
        Path(v).mkdir(parents=True, exist_ok=True)
        return v

    @field_validator("DEBUG", mode="before")
    @classmethod
    def parse_debug(cls, v: object) -> object:
        """Accept noisy host DEBUG values like 'release' as disabled debug mode."""
        if isinstance(v, str):
            normalized = v.strip().lower()
            if normalized in {"1", "true", "yes", "on", "debug"}:
                return True
            if normalized in {"0", "false", "no", "off", "release", "production"}:
                return False
        return v

    model_config = {
        "env_file": ".env",
        "env_file_encoding": "utf-8",
        "case_sensitive": True,
    }


# Global settings instance
settings = Settings()
