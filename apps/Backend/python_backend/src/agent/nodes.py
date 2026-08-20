"""LangGraph nodes for the crop recommendation pipeline."""
from __future__ import annotations

from typing import Any

from src.agent.state import AgentState
from src.agent.tools import CROP_CATALOG, get_weather, get_market_prices, predict_crop_yield, predict_crop_price, estimate_demand, get_crop_plans


def collect_context_node(state: AgentState) -> dict[str, Any]:
    """Gather farmer context, weather, and market data."""
    farmer_input = state.get("farmer_input", {})
    region = farmer_input.get("region", "Kandy")
    season = farmer_input.get("season", "Yala")

    weather = None
    try:
        weather = get_weather.invoke({"region": region})
    except Exception:
        weather = None

    market_prices = {}
    try:
        market_prices = get_market_prices.invoke({})
    except Exception:
        market_prices = {}

    crop_plans = []
    try:
        crop_plans = get_crop_plans.invoke({"season": season})
    except Exception:
        crop_plans = []

    return {
        "weather": weather,
        "market_data": market_prices,
        "farmer_selections": crop_plans,
        "candidate_crops": list(CROP_CATALOG.keys()),
    }


def score_crops_node(state: AgentState) -> dict[str, Any]:
    """Score all candidate crops using yield, price, demand, supply, and weather."""
    farmer_input = state.get("farmer_input", {})
    region = farmer_input.get("region", "Kandy")
    district = farmer_input.get("district", "Kandy")
    land_area_ha = farmer_input.get("land_area_ha", 1.0)
    season = farmer_input.get("season", "Yala")
    year = farmer_input.get("year", 2026)
    irrigation = "Irrigated" if farmer_input.get("has_irrigation", True) else "Rainfed"
    weather = state.get("weather") or {}
    market_prices = state.get("market_data") or {}
    crop_plans = state.get("farmer_selections") or []

    # Calculate expected supply per crop from existing plans
    supply_by_crop: dict[str, float] = {}
    farmer_count_by_crop: dict[str, int] = {}
    for plan in crop_plans:
        crop_name = plan.get("cropName") or plan.get("crop")
        production = float(plan.get("expectedProductionTonnes", 0))
        supply_by_crop[crop_name] = supply_by_crop.get(crop_name, 0) + production
        farmer_count_by_crop[crop_name] = farmer_count_by_crop.get(crop_name, 0) + 1

    scored: list[dict[str, Any]] = []

    for crop_name in state.get("candidate_crops", []):
        catalog = CROP_CATALOG.get(crop_name, {})
        if season not in catalog.get("seasons", ["Yala", "Maha"]):
            continue

        # Yield prediction
        yield_result = predict_crop_yield.invoke({
            "crop": crop_name,
            "region": region,
            "district": district,
            "land_area_ha": land_area_ha,
            "season": season,
            "irrigation": irrigation,
            "rainfall_mm": weather.get("rainfall_mm", 150.0),
            "temperature_c": weather.get("temperature_c", 28.0),
            "humidity_percent": weather.get("humidity_percent", 75.0),
        })
        predicted_yield = float(yield_result.get("predictedYieldTPerHa", catalog.get("baseYieldTPerHa", 10.0)))

        # Price
        price_result = predict_crop_price.invoke({
            "crop": crop_name,
            "region": region,
            "season": season,
            "year": year,
        })
        price = float(price_result.get("marketPriceRsPerKg", catalog.get("typicalPriceRsPerKg", 150.0)))

        # Demand
        demand_result = estimate_demand.invoke({"crop": crop_name, "season": season})
        demand = float(demand_result.get("estimatedDemandTonnes", 20.0))

        # Supply
        supply = supply_by_crop.get(crop_name, 0.0)
        farmer_count = farmer_count_by_crop.get(crop_name, 0)

        # Weather suitability
        weather_suitability = catalog.get("weatherSuitability", {}).get(season, 50.0)

        # Demand gap
        demand_gap = demand - supply

        # Competition score (0-100, lower farmer count = higher score)
        competition_score = max(0, min(100, 100 - farmer_count * 5))

        # Supply gap score
        supply_gap_score = max(0, min(100, 50 + (demand_gap / demand) * 50)) if demand > 0 else 50

        # Revenue
        expected_revenue = predicted_yield * 1000 * land_area_ha * price

        # Risk score
        risk_score = 0.0
        if farmer_count >= 30 or (demand > 0 and demand_gap < 0):
            risk_score += 30
        if weather_suitability < 50:
            risk_score += 20
        if price <= 0:
            risk_score += 10

        # Final weighted score
        final_score = (
            min(100, predicted_yield / 20 * 100) * 0.15 +
            min(100, price / 300 * 100) * 0.15 +
            min(100, demand / 120 * 100) * 0.20 +
            supply_gap_score * 0.20 +
            competition_score * 0.10 +
            weather_suitability * 0.10 +
            min(100, expected_revenue / 1000000 * 100) * 0.05 -
            risk_score * 0.05
        )
        final_score = max(0, min(100, round(final_score)))

        # Competition level
        if farmer_count >= 30 or (demand > 0 and demand_gap / demand < 0.1):
            competition_level = "High"
        elif farmer_count >= 10 or (demand > 0 and demand_gap / demand < 0.3):
            competition_level = "Medium"
        else:
            competition_level = "Low"

        # Risk level
        if risk_score >= 60:
            risk_level = "High"
        elif risk_score >= 30:
            risk_level = "Medium"
        else:
            risk_level = "Low"

        scored.append({
            "cropName": crop_name,
            "recommendationScore": final_score,
            "predictedYieldTPerHa": round(predicted_yield, 2),
            "marketPriceRsPerKg": round(price, 2),
            "estimatedDemandTonnes": round(demand, 1),
            "expectedSupplyTonnes": round(supply, 1),
            "demandGapTonnes": round(demand_gap, 1),
            "competitionLevel": competition_level,
            "expectedGrossRevenueRs": round(expected_revenue, 2),
            "weatherSuitability": weather_suitability,
            "riskLevel": risk_level,
            "factors": {
                "yieldScore": round(min(100, predicted_yield / 20 * 100), 1),
                "priceScore": round(min(100, price / 300 * 100), 1),
                "demandScore": round(min(100, demand / 120 * 100), 1),
                "supplyGapScore": round(supply_gap_score, 1),
                "competitionScore": round(competition_score, 1),
                "weatherScore": weather_suitability,
                "revenueScore": round(min(100, expected_revenue / 1000000 * 100), 1),
                "riskScore": risk_score,
            },
        })

    scored.sort(key=lambda r: r["recommendationScore"], reverse=True)
    return {"scored_crops": scored}


def rank_crops_node(state: AgentState) -> dict[str, Any]:
    """Rank crops and select the top 3."""
    scored = state.get("scored_crops", [])
    top = scored[:3]
    return {"recommendations": scored, "top_crops": top}


def explain_node(state: AgentState) -> dict[str, Any]:
    """Generate farmer-friendly explanations for the top crops."""
    top = state.get("top_crops", [])
    explanations: list[dict[str, Any]] = []

    for rec in top:
        parts: list[str] = []
        if rec.get("demandGapTonnes", 0) > 0:
            parts.append(f"expected demand exceeds supply by {rec['demandGapTonnes']} tonnes")
        if rec.get("marketPriceRsPerKg", 0) >= 150:
            parts.append(f"market price is favorable at Rs.{rec['marketPriceRsPerKg']}/kg")
        if rec.get("predictedYieldTPerHa", 0) >= 10:
            parts.append(f"predicted yield of {rec['predictedYieldTPerHa']} T/ha is good")
        if rec.get("competitionLevel") == "Low":
            parts.append("competition is currently low")
        if rec.get("weatherSuitability", 0) >= 75:
            parts.append("weather conditions are suitable")

        explanation = f"{rec['cropName']} is recommended because " + ", ".join(parts) if parts else f"{rec['cropName']} is recommended based on available data."
        rec["explanation"] = explanation
        explanations.append(rec)

    return {"top_crops": explanations, "completed": True}


def build_graph():
    """Build the LangGraph StateGraph for crop recommendations."""
    from langgraph.graph import END, START, StateGraph

    graph = StateGraph(AgentState)

    graph.add_node("collect_context", collect_context_node)
    graph.add_node("score_crops", score_crops_node)
    graph.add_node("rank_crops", rank_crops_node)
    graph.add_node("explain", explain_node)

    graph.add_edge(START, "collect_context")
    graph.add_edge("collect_context", "score_crops")
    graph.add_edge("score_crops", "rank_crops")
    graph.add_edge("rank_crops", "explain")
    graph.add_edge("explain", END)

    return graph.compile()