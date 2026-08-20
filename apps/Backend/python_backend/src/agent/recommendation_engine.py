"""Recommendation engine.

Pulls data through the existing LangChain tools + services and runs the
deterministic scoring pipeline (scoring.py). Numbers here are the source of
truth; the LLM later only re-explains them.

Data status is tracked per number: REAL (from a configured source / trained
model), ESTIMATED (fallback/base), DEMO, or UNAVAILABLE.
"""
from __future__ import annotations

from typing import Any

import src.agent.scoring as scoring  # noqa: I001  (kept for module-level access)

from src.agent.scoring import FactorScores, calculate_crop_score
from src.agent.tools import (
    CROP_CATALOG,
    get_market_prices,
    get_weather,
    predict_crop_price,
    predict_crop_yield,
)
from src.core.config import settings
from src.core.logging import get_logger
from src.services import crop_plan_service, demand_service
from src.services.data_providers import dambulla_price_provider

log = get_logger(__name__)


def get_candidate_crops(preferred: list[str] | None = None) -> list[str]:
    """Candidate crops come from the existing catalog (never hardcoded fantasy)."""
    crops = list(CROP_CATALOG.keys())
    if preferred:
        ordered = [c for c in preferred if c in crops]
        ordered += [c for c in crops if c not in preferred]
        return ordered
    return crops


def _weather_suitability(crop: str, season: str) -> float:
    catalog = CROP_CATALOG.get(crop) or {}
    return float(catalog.get("weatherSuitability", {}).get(season, 50.0))


def _base_stats(crop: str) -> tuple[float, float, float]:
    catalog = CROP_CATALOG.get(crop) or {}
    return (
        float(catalog.get("baseYieldTPerHa", 10.0)),
        float(catalog.get("typicalPriceRsPerKg", 150.0)),
        float(catalog.get("estimatedDemandTonnes", 20.0)),
    )


# Aliases between HARTI bulletin crop names and our catalog names.
_LIVE_PRICE_ALIASES = {
    "green beans": "Bean (green)",
    "green bean": "Bean (green)",
    "beans": "Bean (green)",
    "ladies finger": "Ladies fingers",
    "lady's finger": "Ladies fingers",
    "snakegourd": "Snake gourd",
    "bittergourd": "Bitter gourd",
}


def _normalize_key(name: str) -> str:
    """Lowercase, strip, and drop parenthetical qualifiers for matching."""
    text = str(name).strip().lower()
    if "(" in text:
        text = text.split("(")[0].strip()
    return text.replace("-", " ")


def _match_live_price(live_prices: dict[str, float], crop: str) -> float | None:
    """Match a catalog crop to a HARTI live price (exact, normalized, alias)."""
    if not live_prices:
        return None
    candidates = [crop, _LIVE_PRICE_ALIASES.get(_normalize_key(crop), "")]
    norm_target = _normalize_key(crop)
    # Normalize all keys once into a lookup.
    key_map: dict[str, float] = {}
    for raw, value in live_prices.items():
        key_map[_normalize_key(raw)] = float(value)
    for cand in candidates:
        cand_norm = _normalize_key(cand)
        if cand_norm and cand_norm in key_map:
            return key_map[cand_norm]
    if norm_target in key_map:
        return key_map[norm_target]
    return None

def score_all_crops(
    *,
    region: str,
    district: str,
    land_area_ha: float,
    has_irrigation: bool,
    season: str,
    year: int,
    preferred_crops: list[str] | None = None,
) -> dict[str, Any]:
    """Compute a scored, ranked list of crop recommendations."""
    irrigation = "Irrigated" if has_irrigation else "Rainfed"
    crops = get_candidate_crops(preferred_crops)
    weather = None
    try:
        weather = get_weather.invoke({"region": region})
    except Exception as error:  # noqa: BLE001
        log.info("Weather unavailable for %s: %s", region, error)

    live_prices: dict[str, float] = {}
    try:
        live_prices = get_market_prices.invoke({}) or {}
    except Exception as error:  # noqa: BLE001
        log.info("HARTI market prices unavailable: %s", error)

    dambulla_prices: dict[str, float] = {}
    try:
        dambulla_prices = dambulla_price_provider.get_prices() or {}
    except Exception as error:  # noqa: BLE001
        log.info("Dambulla/Pettah prices unavailable: %s", error)

    supply_cache: dict[tuple, dict[str, Any]] = {}
    scored: list[dict[str, Any]] = []
    warnings: list[str] = []

    for crop in crops:
        catalog = CROP_CATALOG.get(crop) or {}
        if not catalog:
            continue
        if season not in catalog.get("seasons", ["Yala", "Maha"]):
            continue

        base_yield, base_price, base_demand = _base_stats(crop)

        # ---- Yield ----
        yield_status = "ESTIMATED"
        try:
            yield_result = predict_crop_yield.invoke(
                {
                    "crop": crop,
                    "region": region,
                    "district": district,
                    "land_area_ha": land_area_ha,
                    "season": season,
                    "irrigation": irrigation,
                    "rainfall_mm": (weather or {}).get("rainfall_mm", 150.0),
                    "temperature_c": (weather or {}).get("temperature_c", 28.0),
                    "humidity_percent": (weather or {}).get("humidity_percent", 75.0),
                }
            )
            predicted_yield = float(
                yield_result.get("predictedYieldTPerHa", base_yield)
            )
            if predicted_yield != base_yield:
                yield_status = "REAL"
        except Exception as error:  # noqa: BLE001
            log.warning("Yield prediction failed for %s: %s", crop, error)
            predicted_yield = base_yield

        # ---- Price (ML model, then HARTI live override) ----
        price_status = "ESTIMATED"
        price_source = "price-model"
        try:
            price_result = predict_crop_price.invoke(
                {"crop": crop, "region": region, "season": season, "year": year}
            )
            price = float(price_result.get("marketPriceRsPerKg", base_price))
            if price != base_price:
                price_status = "REAL"
        except Exception as error:  # noqa: BLE001
            log.warning("Price prediction failed for %s: %s", crop, error)
            price = base_price

        live_price = _match_live_price(live_prices, crop)
        price_url = ""
        if live_price is not None:
            price = live_price
            price_status = "REAL"
            price_source = "HARTI live"
            price_url = "http://harti.gov.lk"
        else:
            dambulla = _match_live_price(dambulla_prices, crop)
            if dambulla is not None:
                price = dambulla
                price_status = "REAL"
                price_source = "Dambulla/Pettah"
                price_url = "https://cran.r-project.org/web/packages/vegetablesSriLanka/index.html"

        # ---- Demand (data-driven model from the historical dataset) ----
        demand_model = demand_service.estimate_demand(crop, season)
        demand = float(demand_model["expectedDemandTonnes"])
        demand_status = demand_model.get("status", "ESTIMATED")
        demand_source = demand_model.get("source", "")
        demand_url = demand_model.get("url", "")

        # ---- Supply (from actual crop plans in Firestore) ----
        supply_key = (crop, season, year)
        if supply_key not in supply_cache:
            supply_cache[supply_key] = crop_plan_service.get_planned_supply(
                crop, season, year
            )
        supply_info = supply_cache[supply_key]
        supply = float(supply_info.get("expectedProductionTonnes", 0.0))
        farmer_count = int(supply_info.get("farmerCount", 0))
        supply_status = supply_info.get("status", "UNAVAILABLE")

        # ---- Deterministic metrics ----
        gap = scoring.demand_gap(demand, supply)
        competition = scoring.calculate_competition(
            farmer_count, 0.0, supply, demand
        )
        revenue = scoring.calculate_expected_revenue(
            predicted_yield, land_area_ha, price
        )
        weather_suitability = _weather_suitability(crop, season)

        risk_score = 0.0
        if farmer_count >= 30 or (demand > 0 and gap < 0):
            risk_score += 30
        if weather_suitability < 50:
            risk_score += 20
        if price <= 0:
            risk_score += 10
        risk_level = (
            "High" if risk_score >= 60 else ("Medium" if risk_score >= 30 else "Low")
        )

        factors = FactorScores(
            yield_score=min(100, predicted_yield / 20 * 100),
            price_score=min(100, price / 300 * 100),
            demand_score=min(100, demand / 120 * 100),
            supply_gap_score=(
                max(0, min(100, 50 + (gap / demand) * 50)) if demand > 0 else 50
            ),
            competition_score=competition.score,
            weather_score=weather_suitability,
            revenue_score=min(100, revenue.expected_gross_revenue / 1000000 * 100),
            risk_score=risk_score,
        )
        final_score = calculate_crop_score(factors, settings.weights)

        statuses = [yield_status, price_status, demand_status, supply_status]
        if "DEMO" in statuses:
            data_status = "DEMO"
        elif "REAL" in statuses:
            data_status = "REAL"
        elif "ESTIMATED" in statuses:
            data_status = "ESTIMATED"
        else:
            data_status = "UNAVAILABLE"

        scored.append(
            {
                "cropId": catalog.get("id", crop.lower().replace(" ", "-")),
                "cropName": crop,
                "score": final_score,
                "predictedYield": round(predicted_yield, 2),
                "marketPrice": round(price, 2),
                "expectedDemand": round(demand, 1),
                "expectedSupply": round(supply, 1),
                "demandGap": round(gap, 1),
                "expectedGrossRevenue": round(revenue.expected_gross_revenue, 2),
                "competitionLevel": competition.level,
                "riskLevel": risk_level,
                "reason": competition.reason,
                "dataStatus": data_status,
                "factors": {
                    "yieldScore": round(factors.yield_score, 1),
                    "priceScore": round(factors.price_score, 1),
                    "demandScore": round(factors.demand_score, 1),
                    "supplyGapScore": round(factors.supply_gap_score, 1),
                    "competitionScore": round(factors.competition_score, 1),
                    "weatherScore": round(factors.weather_score, 1),
                    "revenueScore": round(factors.revenue_score, 1),
                    "riskScore": round(factors.risk_score, 1),
                },
            }
        )

    scored.sort(key=lambda r: r["score"], reverse=True)

    data_sources = [
        {
            "source": supply_info.get("source", "firestore"),
            "timestamp": supply_info.get("timestamp", ""),
            "status": supply_status,
            "url": "",
        },
        {"source": "yield-model" if yield_status == "REAL" else "catalog", "timestamp": "", "status": yield_status, "url": ""},
        {"source": price_source, "timestamp": "", "status": price_status, "url": price_url},
        {"source": demand_source or "catalog-estimate", "timestamp": "", "status": demand_status, "url": demand_url},
        {"source": "weather" if weather else "open-meteo-unavailable", "timestamp": "", "status": "REAL" if weather else "UNAVAILABLE", "url": "https://open-meteo.com/"},
    ]

    if not weather:
        warnings.append("Live weather was unavailable; catalog suitability used.")

    return {
        "scored": scored,
        "data_sources": data_sources,
        "warnings": warnings,
    }


