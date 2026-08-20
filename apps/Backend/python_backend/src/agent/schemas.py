"""Pydantic schemas shared across the agent API and the LangGraph state."""
from __future__ import annotations

from datetime import datetime
from typing import Any, Literal

from pydantic import BaseModel, Field

DataStatus = Literal["REAL", "ESTIMATED", "DEMO", "UNAVAILABLE"]
ResponseType = Literal[
    "general_question",
    "crop_recommendation",
    "crop_information",
    "market_price",
    "weather",
    "what_if",
    "crop_plan_confirmation",
    "error",
]


class ChatMessageRequest(BaseModel):
    message: str = Field(..., min_length=1, max_length=4000)
    language: Literal["en", "si"] = "en"
    location: str = "Kandy"
    cultivatedArea: float = Field(1.0, gt=0)
    season: Literal["Yala", "Maha", "next"] = "next"


class RecommendationRequest(BaseModel):
    farmerId: str | None = None
    region: str = "Kandy"
    district: str = "Kandy"
    landAreaHa: float = Field(1.0, gt=0)
    hasIrrigation: bool = True
    season: Literal["Yala", "Maha"] = "Yala"
    year: int = 2026
    preferredCrops: list[str] | None = None
    language: Literal["en", "si"] = "en"


class WhatIfRequest(BaseModel):
    cropId: str
    cultivatedArea: float = Field(1.0, gt=0)
    season: Literal["Yala", "Maha"] = "Yala"
    location: str = "Kandy"
    district: str = "Kandy"
    hasIrrigation: bool = True
    farmerId: str | None = None
    language: Literal["en", "si"] = "en"


class CropPlanConfirmRequest(BaseModel):
    farmerId: str
    cropId: str
    season: Literal["Yala", "Maha"]
    year: int = 2026
    cultivatedArea: float = Field(..., gt=0)
    location: str = "Kandy"
    district: str = "Kandy"
    hasIrrigation: bool = True


class FactorScoresModel(BaseModel):
    yieldScore: float
    priceScore: float
    demandScore: float
    supplyGapScore: float
    competitionScore: float
    weatherScore: float
    revenueScore: float
    riskScore: float


class CropRecommendation(BaseModel):
    cropId: str
    cropName: str
    score: float = Field(..., ge=0, le=100)
    predictedYield: float | None = None
    marketPrice: float | None = None
    expectedDemand: float | None = None
    expectedSupply: float | None = None
    demandGap: float | None = None
    expectedGrossRevenue: float | None = None
    competitionLevel: str | None = None
    riskLevel: str | None = None
    reason: str = ""
    dataStatus: DataStatus
    factors: FactorScoresModel | None = None


class DataSource(BaseModel):
    source: str
    timestamp: str
    status: DataStatus
    url: str = ""


class ChatResponse(BaseModel):
    requestId: str
    message: str
    type: ResponseType
    recommendations: list[CropRecommendation] = []
    dataSources: list[DataSource] = []
    warnings: list[str] = []
    timestamp: str = Field(default_factory=lambda: datetime.utcnow().isoformat() + "Z")


class RecommendationsResponse(BaseModel):
    requestId: str
    farmerId: str | None = None
    season: str
    year: int
    topRecommendations: list[CropRecommendation] = []
    allRecommendations: list[CropRecommendation] = []
    dataSources: list[DataSource] = []
    warnings: list[str] = []
    timestamp: str = Field(default_factory=lambda: datetime.utcnow().isoformat() + "Z")


class WhatIfResult(BaseModel):
    cropId: str
    cropName: str
    before: dict[str, Any]
    after: dict[str, Any]
    expectedProductionTonnes: float
    expectedGrossRevenue: float
    message: str
    simulation: bool = True


class CropPlanConfirmResponse(BaseModel):
    success: bool
    cropPlanId: str | None = None
    firestoreSaved: bool = False
    neo4jSynced: bool = False
    supplyAfter: float = 0.0
    competitionAfter: str | None = None
    message: str = ""
