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

    Uses RapidAPI ChatGPT when configured and falls back to deterministic
    extractive snippets if the key is missing or the provider is unavailable.
    """

    if not sources:
        return (
            "I could not find a relevant passage in the uploaded documents. "
            "Try uploading another PDF or asking a more specific question.",
            0.0,
        )

    if settings.LLM_PROVIDER == "rapidapi" and settings.RAPIDAPI_KEY:
        try:
            answer = await _rapidapi_answer(query, sources)
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


async def _rapidapi_answer(query: str, sources: list[Source]) -> str:
    context = "\n\n".join(
        f"Source {index}: {source.document_name}, page {source.page_number}\n"
        f"{source.chunk_text}"
        for index, source in enumerate(sources[:5], start=1)
    )
    system_prompt = (
        "You answer questions using only the provided document context. "
        "If the context does not contain the answer, say that clearly. "
        "Always cite sources inline using the format [filename, page N]."
    )
    payload = {
        "messages": [
            {
                "role": "user",
                "content": (
                    f"Question: {query}\n\n"
                    f"Document context:\n{context}\n\n"
                    "Write a concise answer with citations."
                ),
            }
        ],
        "system_prompt": system_prompt,
        "temperature": settings.LLM_TEMPERATURE,
        "top_k": settings.LLM_TOP_K,
        "top_p": settings.LLM_TOP_P,
        "max_tokens": settings.LLM_MAX_TOKENS,
        "web_access": False,
    }
    headers = {
        "x-rapidapi-key": settings.RAPIDAPI_KEY,
        "x-rapidapi-host": settings.RAPIDAPI_HOST,
        "Content-Type": "application/json",
    }
    url = f"https://{settings.RAPIDAPI_HOST}{settings.RAPIDAPI_PATH}"

    try:
        async with httpx.AsyncClient(timeout=45) as client:
            response = await client.post(url, headers=headers, json=payload)
            response.raise_for_status()
            data = response.json()
    except httpx.HTTPStatusError as exc:
        detail = exc.response.text[:500]
        raise LLMError("rapidapi", detail) from exc
    except (httpx.HTTPError, json.JSONDecodeError) as exc:
        raise LLMError("rapidapi", str(exc)) from exc

    answer = _extract_answer_text(data)
    if not answer:
        raise LLMError("rapidapi", f"Unexpected response shape: {data}")
    return answer


def _extract_answer_text(data: Any) -> str:
    if isinstance(data, str):
        return data.strip()
    if not isinstance(data, dict):
        return ""

    for key in ("result", "response", "answer", "text", "message"):
        value = data.get(key)
        if isinstance(value, str) and value.strip():
            return value.strip()
        if isinstance(value, dict):
            nested = _extract_answer_text(value)
            if nested:
                return nested

    choices = data.get("choices")
    if isinstance(choices, list) and choices:
        first = choices[0]
        if isinstance(first, dict):
            message = first.get("message")
            if isinstance(message, dict) and isinstance(message.get("content"), str):
                return message["content"].strip()
            if isinstance(first.get("text"), str):
                return first["text"].strip()

    return ""
