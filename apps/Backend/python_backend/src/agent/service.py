"""High-level agent operations used by the API layer.

Composes the deterministic engine (recommendation_engine) with an optional LLM
explanation (llm_factory + prompts). When the LLM is unavailable the system
falls back to a deterministic, evidence-based explanation — it never fabricates
numbers.
"""
from __future__ import annotations

import re
import time
import uuid
from typing import Any

from langchain_core.messages import HumanMessage, SystemMessage

from src.agent import recommendation_engine
from src.agent.llm_factory import get_llm_or_none
from src.agent.prompts import SYSTEM_PROMPT, explanation_prompt, general_chat_prompt
from src.agent.schemas import (
    ChatResponse,
    CropPlanConfirmResponse,
    CropRecommendation,
    DataSource,
    RecommendationsResponse,
    WhatIfResult,
)
from src.agent.simulation import CropSnapshot, run_what_if
from src.core.logging import get_logger
from src.services import crop_plan_service

log = get_logger(__name__)

_REASONING_MARKERS = (
    "analyze user input",
    "identify key information",
    "draft construction",
    "check constraints",
    "thinking process",
    "provided data",
)


def _now() -> str:
    return time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime())


def _new_request_id() -> str:
    return f"REQ-{uuid.uuid4().hex[:12].upper()}"


def _clean_model_text(value: Any) -> str:
    """Return only user-facing prose and discard model reasoning artifacts."""
    if not isinstance(value, str):
        return ""

    text = value.strip()
    if not text:
        return ""

    # Some reasoning models include private work inside <think> tags. If a
    # closing tag exists, only content after it is eligible for the user. An
    # unclosed tag is unsafe/incomplete, so the caller must use its fallback.
    if re.search(r"</think\s*>", text, flags=re.IGNORECASE):
        text = re.split(r"</think\s*>", text, flags=re.IGNORECASE)[-1].strip()
    text = re.sub(
        r"<think\b[^>]*>.*?</think\s*>",
        "",
        text,
        flags=re.IGNORECASE | re.DOTALL,
    ).strip()
    if re.search(r"<think\b", text, flags=re.IGNORECASE):
        return ""

    lowered = text.lower()
    if any(marker in lowered for marker in _REASONING_MARKERS):
        return ""

    # The recommendation card expects a paragraph, not Markdown headings,
    # numbered drafts, or code fences.
    text = re.sub(r"```(?:\w+)?", "", text)
    text = re.sub(r"[*_]{1,3}", "", text)
    text = re.sub(r"^\s*(?:#{1,6}|\d+[.)]|[-•])\s*", "", text, flags=re.MULTILINE)
    text = re.sub(r"\s+", " ", text).strip()
    return text


def _fallback_explanation(crop_name: str, reason: str) -> str:
    reason_text = (reason or "available farm and market data support this option").strip()
    reason_text = reason_text.rstrip(".! ")
    return (
        f"{crop_name} is a suitable option because {reason_text.lower()}. "
        "Use this recommendation as a planning guide, because market prices "
        "and yields may change before harvest."
    )


def build_recommendations(
    *,
    region: str,
    district: str,
    land_area_ha: float,
    has_irrigation: bool,
    season: str,
    year: int,
    preferred_crops: list[str] | None = None,
) -> dict[str, Any]:
    return recommendation_engine.score_all_crops(
        region=region,
        district=district,
        land_area_ha=land_area_ha,
        has_irrigation=has_irrigation,
        season=season,
        year=year,
        preferred_crops=preferred_crops,
    )


def generate_explanation(
    crop_name: str,
    reason: str,
    factors: dict[str, Any],
    language: str = "en",
) -> str:
    """LLM explanation with a deterministic, numbers-based fallback."""
    fallback = _fallback_explanation(crop_name, reason)
    scored_obj = {
        "crop": crop_name,
        "reason": reason,
        "factors": factors,
    }
    if get_llm_or_none() is not None:
        try:
            model = get_llm_or_none()
            messages = [
                SystemMessage(content=SYSTEM_PROMPT),
                HumanMessage(
                    content=explanation_prompt(crop_name, language)
                    + "\n\nDeterministic data (do not alter):\n"
                    + str(scored_obj)
                ),
            ]
            response = model.invoke(messages)
            text = _clean_model_text(getattr(response, "content", None))
            if text:
                return text
        except Exception as error:  # noqa: BLE001
            log.warning("LLM explanation failed; using fallback: %s", error)

    return fallback


def generate_general_answer(message: str, language: str = "en") -> str:
    """LLM-backed general answer with a safe fallback when unavailable."""
    model = get_llm_or_none()
    if model is not None:
        try:
            messages = [
                SystemMessage(content=SYSTEM_PROMPT),
                HumanMessage(
                    content=general_chat_prompt(language) + "\n\nUser question:\n" + message
                ),
            ]
            response = model.invoke(messages)
            text = _clean_model_text(getattr(response, "content", None))
            if text:
                return text
        except Exception as error:  # noqa: BLE001
            log.warning("LLM general answer failed; using fallback: %s", error)

    return (
        "I can help you with crop recommendations, market prices, weather, and "
        "what-if simulations. Try asking 'what should I grow?', 'market prices', "
        "or 'what if I grow tomato?'."
    )


def _to_crop_recommendation(rec: dict[str, Any]) -> CropRecommendation:
    return CropRecommendation(
        cropId=rec["cropId"],
        cropName=rec["cropName"],
        score=rec["score"],
        predictedYield=rec.get("predictedYield"),
        marketPrice=rec.get("marketPrice"),
        expectedDemand=rec.get("expectedDemand"),
        expectedSupply=rec.get("expectedSupply"),
        demandGap=rec.get("demandGap"),
        expectedGrossRevenue=rec.get("expectedGrossRevenue"),
        competitionLevel=rec.get("competitionLevel"),
        riskLevel=rec.get("riskLevel"),
        reason=rec.get("reason", ""),
        dataStatus=rec.get("dataStatus", "UNAVAILABLE"),
        factors=rec.get("factors"),
    )


def respond_recommendations(
    *,
    farmer_id: str | None,
    region: str,
    district: str,
    land_area_ha: float,
    has_irrigation: bool,
    season: str,
    year: int,
    preferred_crops: list[str] | None,
    language: str,
) -> RecommendationsResponse:
    built = build_recommendations(
        region=region,
        district=district,
        land_area_ha=land_area_ha,
        has_irrigation=has_irrigation,
        season=season,
        year=year,
        preferred_crops=preferred_crops,
    )
    scored = built["scored"]
    recs = [_to_crop_recommendation(r) for r in scored]
    top = recs[:3] if recs else []

    for r in top:
        r.reason = generate_explanation(
            r.cropName,
            r.reason,
            r.factors.model_dump() if r.factors else {},
            language,
        )

    return RecommendationsResponse(
        requestId=_new_request_id(),
        farmerId=farmer_id,
        season=season,
        year=year,
        topRecommendations=top,
        allRecommendations=recs,
        dataSources=[DataSource(**d) for d in built["data_sources"]],
        warnings=built["warnings"],
        timestamp=_now(),
    )


def respond_chat(
    *,
    message: str,
    language: str,
    location: str,
    cultivated_area: float,
    farmer_id: str | None,
) -> ChatResponse:
    lower = message.lower()
    season = "Yala"
    year = int(time.strftime("%Y"))

    if "price" in lower or "market" in lower:
        response_type = "market_price"
    elif "what if" in lower or "if i grow" in lower:
        response_type = "what_if"
    elif "weather" in lower:
        response_type = "weather"
    elif any(w in lower for w in ["grow", "recommend", "plant", "what should i"]):
        response_type = "crop_recommendation"
    else:
        response_type = "general_question"

    built = build_recommendations(
        region=location,
        district=location,
        land_area_ha=cultivated_area,
        has_irrigation=True,
        season=season,
        year=year,
        preferred_crops=None,
    )
    scored = built["scored"]
    recs = [_to_crop_recommendation(r) for r in scored]
    top = recs[:3] if recs else []
    for r in top:
        r.reason = generate_explanation(
            r.cropName,
            r.reason,
            r.factors.model_dump() if r.factors else {},
            language,
        )

    # Only expose crop-recommendation tiles when the question actually asks for
    # recommendations or a what-if simulation. Other question types receive a
    # tailored text reply instead of always showing crop suggestions.
    expose_recommendations = response_type in ("crop_recommendation", "what_if")

    if response_type == "what_if" and top:
        f = top[0].factors
        snap = CropSnapshot(
            crop_id=top[0].cropId,
            crop_name=top[0].cropName,
            expected_demand=top[0].expectedDemand or 0.0,
            expected_supply=top[0].expectedSupply or 0.0,
            farmer_count=0,
            predicted_yield=top[0].predictedYield or 1.0,
            market_price=top[0].marketPrice or 0.0,
            weather_suitability=f.weatherScore if f else 50.0,
            risk_score=f.riskScore if f else 0.0,
        )
        sim = run_what_if(snap, cultivated_area)
        top[0].reason = sim.message
        reply = sim.message

    elif response_type == "crop_recommendation":
        if top:
            reply = (
                f"Based on your farm, the best option is {top[0].cropName} "
                f"with a score of {top[0].score:.0f}/100. Tap a crop below to "
                "open its growing plan."
            )
        else:
            reply = "I couldn't compute recommendations with the current information."

    elif response_type == "market_price":
        lines = [
            f"{r.cropName}: Rs.{r.marketPrice:.0f}/kg"
            for r in top
            if r.marketPrice is not None
        ]
        reply = (
            "Here are the latest market prices:\n" + "\n".join(lines)
            if lines
            else "Market price data is currently unavailable."
        )

    elif response_type == "weather":
        suitability = [
            f"{r.cropName} ({r.factors.weatherScore:.0f}/100)"
            for r in top
            if r.factors
        ]
        reply = (
            "Weather suitability for the current season:\n"
            + "\n".join(suitability)
            if suitability
            else "Live weather data was unavailable; recommendations use catalog suitability."
        )

    else:
        reply = generate_general_answer(message, language)

    return ChatResponse(
        requestId=_new_request_id(),
        message=reply,
        type=response_type,
        recommendations=top if expose_recommendations else [],
        dataSources=[DataSource(**d) for d in built["data_sources"]],
        warnings=built["warnings"],
        timestamp=_now(),
    )


def respond_what_if(
    *,
    crop_id: str,
    crop_name: str,
    cultivated_area: float,
    season: str,
    year: int,
    region: str,
    district: str,
    has_irrigation: bool,
    language: str,
) -> WhatIfResult:
    built = build_recommendations(
        region=region,
        district=district,
        land_area_ha=cultivated_area,
        has_irrigation=has_irrigation,
        season=season,
        year=year,
        preferred_crops=None,
    )
    match = next(
        (
            r
            for r in built["scored"]
            if r["cropId"] == crop_id or r["cropName"] == crop_id
        ),
        None,
    )
    if match is None:
        raise ValueError(
            f"Crop '{crop_id}' is not in the candidate catalog for {season}."
        )
    snap = CropSnapshot(
        crop_id=match["cropId"],
        crop_name=match["cropName"],
        expected_demand=match["expectedDemand"] or 0.0,
        expected_supply=match["expectedSupply"] or 0.0,
        farmer_count=0,
        predicted_yield=match["predictedYield"] or 1.0,
        market_price=match["marketPrice"] or 0.0,
        weather_suitability=match["factors"]["weatherScore"],
        risk_score=match["factors"]["riskScore"],
    )
    sim = run_what_if(snap, cultivated_area)
    return WhatIfResult(
        cropId=sim.crop_id,
        cropName=sim.crop_name,
        before={
            "supply": sim.before_supply,
            "gap": sim.before_gap,
            "score": sim.before_score,
            "competition": sim.before_competition,
        },
        after={
            "supply": sim.after_supply,
            "gap": sim.after_gap,
            "score": sim.after_score,
            "competition": sim.after_competition,
        },
        expectedProductionTonnes=sim.own_production_tonnes,
        expectedGrossRevenue=sim.revenue.expected_gross_revenue,
        message=sim.message,
    )


def confirm_crop_plan(
    *,
    farmer_id: str,
    crop_id: str,
    crop_name: str,
    season: str,
    year: int,
    cultivated_area: float,
    location: str,
    district: str,
    has_irrigation: bool,
) -> CropPlanConfirmResponse:
    predicted = build_recommendations(
        region=location,
        district=district,
        land_area_ha=cultivated_area,
        has_irrigation=has_irrigation,
        season=season,
        year=year,
        preferred_crops=None,
    )["scored"]
    match = next(
        (
            r
            for r in predicted
            if r["cropId"] == crop_id or r["cropName"] == crop_id
        ),
        None,
    )
    predicted_production = match["predictedYield"] * cultivated_area if match else 0.0

    plan = crop_plan_service.save_crop_plan(
        farmer_id=farmer_id,
        crop_id=crop_id,
        crop_name=crop_name,
        season=season,
        year=year,
        cultivated_area=cultivated_area,
        predicted_production=predicted_production,
        location=location,
        district=district,
        has_irrigation=has_irrigation,
    )
    supply_after = crop_plan_service.get_planned_supply(
        crop_id, season, year, location
    )
    return CropPlanConfirmResponse(
        success=True,
        cropPlanId=plan["id"],
        firestoreSaved=True,
        neo4jSynced=plan.get("syncStatus") == "synced",
        supplyAfter=float(supply_after.get("expectedProductionTonnes", 0.0)),
        competitionAfter=None,
        message="Crop plan saved and supply updated.",
    )
