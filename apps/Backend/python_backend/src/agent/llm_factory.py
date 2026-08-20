"""LLM provider abstraction.

Returns a configured LangChain chat model based on LLM_PROVIDER:
- "groq"    -> ChatGroq    (uses GROQ_API_KEY / GROQ_MODEL)
- "openai"  -> ChatOpenAI  (uses OPENAI_API_KEY / OPENAI_MODEL)

If the selected provider is not configured, get_llm() raises a clear error and
get_llm_or_none() returns None so the agent can fall back to a deterministic
explanation without crashing.
"""
from __future__ import annotations

import os
from typing import Any

from src.core.config import settings
from src.core.logging import get_logger

log = get_logger(__name__)


def is_llm_configured() -> bool:
    return settings.llm.enabled


def get_llm() -> Any:
    """Return the configured LangChain chat model. Raises when unconfigured."""
    if not settings.llm.enabled:
        raise RuntimeError(settings.llm.reason)

    if settings.llm.provider == "groq":
        from langchain_groq import ChatGroq

        return ChatGroq(
            model=settings.llm.groq_model,
            api_key=os.getenv("GROQ_API_KEY", ""),
            temperature=settings.llm.temperature,
        )

    from langchain_openai import ChatOpenAI

    return ChatOpenAI(
        model=settings.llm.openai_model,
        temperature=settings.llm.temperature,
    )


def get_llm_or_none() -> Any | None:
    try:
        return get_llm()
    except Exception as error:  # noqa: BLE001 - degrade to deterministic fallback
        log.info("LLM unavailable, using deterministic fallback: %s", error)
        return None
