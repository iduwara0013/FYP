"""FastAPI server exposing the LangGraph crop recommendation agent."""
from __future__ import annotations

from typing import Annotated, Any

import os

from fastapi import Depends, FastAPI, Header, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

from src.agent import service
from src.agent.llm_factory import is_llm_configured
from src.agent.schemas import (
    ChatMessageRequest,
    ChatResponse,
    CropPlanConfirmRequest,
    CropPlanConfirmResponse,
    RecommendationRequest,
    RecommendationsResponse,
    WhatIfRequest,
    WhatIfResult,
)
from src.agent.graph import run_recommendation_agent
from src.core.config import settings
from src.services.neo4j_service import neo4j_service

# Optional shared-secret auth. When API_AUTH_TOKEN is empty the API is open
# (development/trusted-network). Set it to require `Authorization: Bearer <token>`.
API_AUTH_TOKEN = os.getenv("API_AUTH_TOKEN", "").strip()


def require_auth(authorization: Annotated[str | None, Header()] = None) -> None:
    if not API_AUTH_TOKEN:
        return
    if authorization != f"Bearer {API_AUTH_TOKEN}":
        raise HTTPException(status_code=401, detail="Unauthorized")

app = FastAPI(title="SmartCrop AI Agent", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


class RecommendationRequest(BaseModel):
    farmer_id: str | None = None
    region: str = "Kandy"
    district: str = "Kandy"
    land_area_ha: float = 1.0
    has_irrigation: bool = True
    season: str = "Yala"
    year: int = 2026
    preferred_crops: list[str] | None = None


@app.get("/health")
def health():
    return {"status": "ok", "service": "smartcrop-agent"}


@app.post("/recommend")
def recommend(payload: RecommendationRequest) -> dict[str, Any]:
    """Run the LangGraph agent and return top crop recommendations."""
    farmer_input = payload.model_dump()
    return run_recommendation_agent(farmer_input)


@app.get("/tools")
def list_tools():
    """List available LangChain tools registered with the agent."""
    from src.agent.tools import get_all_tools

    return {"tools": [tool.name for tool in get_all_tools()]}

# ---------------------------------------------------------------- AI endpoints

@app.post("/api/ai/chat", response_model=ChatResponse)
def ai_chat(payload: ChatMessageRequest, _: None = Depends(require_auth)):
    """Agentic chat: understand request, run conditional tools, return response."""
    try:
        return service.respond_chat(
            message=payload.message,
            language=payload.language,
            location=payload.location,
            cultivated_area=payload.cultivatedArea,
            farmer_id=None,
        )
    except Exception as error:  # noqa: BLE001
        raise HTTPException(status_code=500, detail=str(error)) from error


@app.post("/api/ai/recommendations", response_model=RecommendationsResponse)
def ai_recommendations(payload: RecommendationRequest, _: None = Depends(require_auth)):
    """Full deterministic recommendation run with LLM explanations."""
    try:
        return service.respond_recommendations(
            farmer_id=payload.farmerId,
            region=payload.region,
            district=payload.district,
            land_area_ha=payload.landAreaHa,
            has_irrigation=payload.hasIrrigation,
            season=payload.season,
            year=payload.year,
            preferred_crops=payload.preferredCrops,
            language=payload.language,
        )
    except Exception as error:  # noqa: BLE001
        raise HTTPException(status_code=500, detail=str(error)) from error


@app.post("/api/ai/what-if", response_model=WhatIfResult)
def ai_what_if(payload: WhatIfRequest, _: None = Depends(require_auth)):
    """Simulate the farmer's own crop choice and show before/after impact."""
    try:
        return service.respond_what_if(
            crop_id=payload.cropId,
            crop_name=payload.cropId,
            cultivated_area=payload.cultivatedArea,
            season=payload.season,
            year=2026,
            region=payload.location,
            district=payload.district,
            has_irrigation=payload.hasIrrigation,
            language=payload.language,
        )
    except ValueError as error:
        raise HTTPException(status_code=404, detail=str(error)) from error
    except Exception as error:  # noqa: BLE001
        raise HTTPException(status_code=500, detail=str(error)) from error


@app.post("/api/ai/crop-plan/confirm", response_model=CropPlanConfirmResponse)
def ai_confirm(payload: CropPlanConfirmRequest, _: None = Depends(require_auth)):
    """Save CropPlan to Firestore, then synchronize Neo4j, then update supply."""
    try:
        return service.confirm_crop_plan(
            farmer_id=payload.farmerId,
            crop_id=payload.cropId,
            crop_name=payload.cropId,
            season=payload.season,
            year=payload.year,
            cultivated_area=payload.cultivatedArea,
            location=payload.location,
            district=payload.district,
            has_irrigation=payload.hasIrrigation,
        )
    except Exception as error:  # noqa: BLE001
        raise HTTPException(status_code=500, detail=str(error)) from error


@app.get("/api/ai/recommendations/{farmerId}", response_model=RecommendationsResponse)
def ai_recommendations_by_farmer(
    farmerId: str,
    region: str = "Kandy",
    season: str = "Yala",
    year: int = 2026,
    _: None = Depends(require_auth),
):
    """Recalculate recommendations for a farmer (region via query param)."""
    try:
        return service.respond_recommendations(
            farmer_id=farmerId,
            region=region,
            district=region,
            land_area_ha=1.0,
            has_irrigation=True,
            season=season,
            year=year,
            preferred_crops=None,
            language="en",
        )
    except Exception as error:  # noqa: BLE001
        raise HTTPException(status_code=500, detail=str(error)) from error


@app.get("/api/ai/health")
def ai_health(_: None = Depends(require_auth)):
    """Health + integration status (LLM, Neo4j). Never exposes secrets."""
    return {
        "status": "ok",
        "service": "smartcrop-agent",
        "llm": {"provider": settings.llm.provider, "enabled": is_llm_configured()},
        "neo4j": neo4j_service.health(),
        "demoMode": settings.demo_mode,
    }
