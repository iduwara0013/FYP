"""Typed state shared across the LangGraph agent nodes."""
from __future__ import annotations

from typing import Any, TypedDict


class FarmerInput(TypedDict, total=False):
    farmer_id: str
    region: str
    district: str
    land_area_ha: float
    has_irrigation: bool
    season: str
    year: int
    preferred_crops: list[str]
    soil_type: str
    rainfall_mm: float
    temperature_c: float
    humidity_percent: float
    farmer_experience_yrs: int


class CropRecommendation(TypedDict, total=False):
    cropName: str
    recommendationScore: float
    predictedYieldTPerHa: float | None
    marketPriceRsPerKg: float | None
    estimatedDemandTonnes: float | None
    expectedSupplyTonnes: float
    demandGapTonnes: float | None
    competitionLevel: str
    expectedGrossRevenueRs: float | None
    weatherSuitability: float
    riskLevel: str
    explanation: str
    factors: dict[str, float]


class AgentState(TypedDict, total=False):
    """Mutable state that flows through the LangGraph nodes."""

    # Request
    farmer_input: FarmerInput

    # Data gathered by tools
    weather: dict[str, Any] | None
    crop_catalog: dict[str, Any]
    market_data: dict[str, Any]
    yield_data: dict[str, Any]
    demand_data: dict[str, Any]
    supply_data: dict[str, Any]
    farmer_selections: list[dict[str, Any]]

    # Intermediate
    candidate_crops: list[str]
    scored_crops: list[dict[str, Any]]

    # Output
    recommendations: list[CropRecommendation]
    top_crops: list[CropRecommendation]
    explanation: str
    errors: list[str]
    completed: bool