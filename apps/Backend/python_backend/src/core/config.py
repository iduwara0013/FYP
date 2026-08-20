"""Central application configuration.

All privileged settings (LLM keys, Neo4j credentials, demo mode, scoring
weights) are read from environment variables. Nothing here is ever sent to
the React Native client.
"""
from __future__ import annotations

import os
from dataclasses import dataclass
from pathlib import Path


def _load_dotenv() -> None:
    """Best-effort load of a .env file from the python_backend folder.

    Uses only the standard library so the agent server runs even before
    python-dotenv is installed. Skips silently if the file is missing.
    """
    env_path = Path(__file__).resolve().parents[2] / ".env"
    if not env_path.exists():
        return
    try:
        for raw_line in env_path.read_text(encoding="utf-8").splitlines():
            line = raw_line.strip()
            if not line or line.startswith("#") or "=" not in line:
                continue
            key, _, value = line.partition("=")
            key = key.strip()
            value = value.strip().strip("\"'")
            if key and not os.environ.get(key):
                os.environ[key] = value
    except OSError:
        return


_load_dotenv()


def _env_bool(name: str, default: bool = False) -> bool:
    value = os.getenv(name)
    if value is None:
        return default
    return value.strip().lower() in {"1", "true", "yes", "on"}


def _env_float(name: str, default: float) -> float:
    try:
        return float(os.getenv(name, str(default)))
    except (TypeError, ValueError):
        return default


def _env_int(name: str, default: int) -> int:
    try:
        return int(os.getenv(name, str(default)))
    except (TypeError, ValueError):
        return default


@dataclass(frozen=True)
class ScoringWeights:
    """Deterministic recommendation weights (sum to 1.0)."""

    YIELD_WEIGHT: float = 0.15
    PRICE_WEIGHT: float = 0.15
    DEMAND_WEIGHT: float = 0.20
    SUPPLY_GAP_WEIGHT: float = 0.20
    COMPETITION_WEIGHT: float = 0.10
    WEATHER_WEIGHT: float = 0.10
    REVENUE_WEIGHT: float = 0.05
    RISK_WEIGHT: float = 0.05

    def as_factor_map(self) -> dict[str, float]:
        return {
            "yield": self.YIELD_WEIGHT * 100,
            "price": self.PRICE_WEIGHT * 100,
            "demand": self.DEMAND_WEIGHT * 100,
            "supplyGap": self.SUPPLY_GAP_WEIGHT * 100,
            "competition": self.COMPETITION_WEIGHT * 100,
            "weather": self.WEATHER_WEIGHT * 100,
            "revenue": self.REVENUE_WEIGHT * 100,
            "risk": self.RISK_WEIGHT * 100,
        }


@dataclass(frozen=True)
class LLMConfig:
    provider: str
    openai_model: str
    groq_model: str
    temperature: float
    enabled: bool
    reason: str = ""


@dataclass(frozen=True)
class Neo4jConfig:
    uri: str
    username: str
    password: str
    database: str
    configured: bool = False


@dataclass
class Settings:
    app_env: str
    demo_mode: bool
    spring_backend_url: str
    weights: ScoringWeights
    llm: LLMConfig
    neo4j: Neo4jConfig
    agent_timeout_seconds: int
    firestore_credentials_path: str


def _build_llm_config() -> LLMConfig:
    provider = os.getenv("LLM_PROVIDER", "openai").strip().lower()
    openai_key = os.getenv("OPENAI_API_KEY", "").strip()
    groq_key = os.getenv("GROQ_API_KEY", "").strip()
    temperature = _env_float("LLM_TEMPERATURE", 0.3)
    openai_model = os.getenv("OPENAI_MODEL", "gpt-4o-mini")
    groq_model = os.getenv("GROQ_MODEL", "llama-3.1-8b-instant")

    if provider == "groq":
        if groq_key:
            return LLMConfig(
                provider="groq",
                openai_model=openai_model,
                groq_model=groq_model,
                temperature=temperature,
                enabled=True,
            )
        return LLMConfig(
            provider="groq",
            openai_model=openai_model,
            groq_model=groq_model,
            temperature=temperature,
            enabled=False,
            reason="GROQ_API_KEY was not provided.",
        )

    if openai_key:
        return LLMConfig(
            provider="openai",
            openai_model=openai_model,
            groq_model=groq_model,
            temperature=temperature,
            enabled=True,
        )
    return LLMConfig(
        provider="openai",
        openai_model=openai_model,
        groq_model=groq_model,
        temperature=temperature,
        enabled=False,
        reason="Neither OPENAI_API_KEY nor GROQ_API_KEY was provided.",
    )


def _build_neo4j_config() -> Neo4jConfig:
    return Neo4jConfig(
        uri=os.getenv("NEO4J_URI", "bolt://localhost:7687").strip(),
        username=os.getenv("NEO4J_USERNAME", "").strip(),
        password=os.getenv("NEO4J_PASSWORD", "").strip(),
        database=os.getenv("NEO4J_DATABASE", "neo4j").strip(),
        configured=bool(
            os.getenv("NEO4J_URI", "").strip()
            and os.getenv("NEO4J_USERNAME", "").strip()
            and os.getenv("NEO4J_PASSWORD", "").strip() != ""
        ),
    )


# ===== Firebase (backend service account) =====
def load_settings() -> Settings:
    backend_dir = Path(__file__).resolve().parents[2]
    spring_backend_url = os.getenv(
        "SPRING_BACKEND_URL", "http://127.0.0.1:8080"
    ).strip()

    # Resolve relative credential paths against the python_backend folder so the
    # server works regardless of the process working directory.
    def resolve_relative(raw: str, default: str) -> str:
        path = Path(raw if raw else default)
        return str(path if path.is_absolute() else backend_dir / path)

    firestore_path = resolve_relative(
        os.getenv("FIREBASE_CREDENTIALS_PATH", ""),
        str(backend_dir / "firebase-service-account.json"),
    )

    return Settings(
        app_env=os.getenv("APP_ENV", "development").strip(),
        demo_mode=_env_bool("DEMO_MODE", False),
        spring_backend_url=spring_backend_url,
        weights=ScoringWeights(),
        llm=_build_llm_config(),
        neo4j=_build_neo4j_config(),
        agent_timeout_seconds=_env_int("AGENT_TIMEOUT_SECONDS", 60),
        firestore_credentials_path=firestore_path,
    )


# Single shared settings instance (protects credentials from being re-read).
settings = load_settings()
