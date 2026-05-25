"""Answer generation for retrieved document chunks."""

from __future__ import annotations

import json
from textwrap import shorten
from typing import Any

import httpx

from app.config import settings
from app.core.exceptions import LLMError
from app.models import Source


async def build_answer(query: str, sources: list[Source]) -> tuple[str, float]:
    """Create a cited answer from retrieved chunks.

    Uses the configured LLM provider when available and falls back to
    deterministic extractive snippets if the provider is unavailable.
    """

    if not sources:
        return (
            "I could not find a relevant passage in the uploaded documents. "
            "Try uploading another PDF or asking a more specific question.",
            0.0,
        )

    if settings.LLM_PROVIDER == "gemini" and settings.GEMINI_API_KEY:
        try:
            answer = await _gemini_answer(query, sources)
            best_score = max(source.relevance_score for source in sources)
            return answer, round(min(0.95, 0.5 + best_score * 0.45), 2)
        except LLMError:
            pass

    return _extractive_answer(sources)


def _extractive_answer(sources: list[Source]) -> tuple[str, float]:
    intro = "Based on the uploaded documents, the most relevant evidence is:"
    lines = [intro]

    for index, source in enumerate(sources[:3], start=1):
        snippet = shorten(source.chunk_text, width=420, placeholder="...")
        lines.append(
            f"{index}. {snippet} "
            f"[{source.document_name}, page {source.page_number}]"
        )

    if len(sources) > 3:
        lines.append(f"I found {len(sources)} relevant passages in total.")

    best_score = max(source.relevance_score for source in sources)
    confidence = round(min(0.95, 0.45 + best_score * 0.5), 2)
    return "\n\n".join(lines), confidence


async def _gemini_answer(query: str, sources: list[Source]) -> str:
    context = "\n\n".join(
        f"Source {index}: {source.document_name}, page {source.page_number}\n"
        f"{source.chunk_text}"
        for index, source in enumerate(sources[:5], start=1)
    )
    prompt = (
        "You answer questions using only the provided document context. "
        "If the context does not contain the answer, say that clearly. "
        "Always cite sources inline using the format [filename, page N].\n\n"
        f"Question: {query}\n\n"
        f"Document context:\n{context}\n\n"
        "Write a concise answer with citations."
    )
    payload = {
        "contents": [
            {
                "role": "user",
                "parts": [{"text": prompt}],
            }
        ],
        "generationConfig": {
            "temperature": settings.LLM_TEMPERATURE,
            "topP": settings.LLM_TOP_P,
            "topK": settings.LLM_TOP_K,
            "maxOutputTokens": settings.LLM_MAX_TOKENS,
        },
    }
    url = (
        "https://generativelanguage.googleapis.com/v1beta/models/"
        f"{settings.GEMINI_MODEL}:generateContent"
    )

    try:
        async with httpx.AsyncClient(timeout=45) as client:
            response = await client.post(
                url,
                params={"key": settings.GEMINI_API_KEY},
                json=payload,
            )
            response.raise_for_status()
            data = response.json()
    except httpx.HTTPStatusError as exc:
        detail = exc.response.text[:500]
        raise LLMError("gemini", detail) from exc
    except (httpx.HTTPError, json.JSONDecodeError) as exc:
        raise LLMError("gemini", str(exc)) from exc

    answer = _extract_gemini_text(data)
    if not answer:
        raise LLMError("gemini", f"Unexpected response shape: {data}")
    return answer


def _extract_gemini_text(data: Any) -> str:
    if not isinstance(data, dict):
        return ""

    candidates = data.get("candidates")
    if not isinstance(candidates, list) or not candidates:
        return ""

    content = candidates[0].get("content")
    if not isinstance(content, dict):
        return ""

    parts = content.get("parts")
    if not isinstance(parts, list):
        return ""

    text_parts = [
        part.get("text", "").strip()
        for part in parts
        if isinstance(part, dict) and isinstance(part.get("text"), str)
    ]
    return "\n".join(part for part in text_parts if part)
