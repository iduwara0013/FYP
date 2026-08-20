"""LangChain Tools for the crop recommendation agent."""
from __future__ import annotations

import json
from typing import Any
from urllib.error import HTTPError
from urllib.parse import urlencode
from urllib.request import Request, urlopen

from langchain_core.tools import tool

from src.core.config import settings
from src.services.neo4j_service import (
    Neo4jUnavailableError,
    neo4j_service,
)
from src.services.prediction_service import predict_farm
from src.services.yield_prediction import predict_yield

SPRING_BACKEND_URL = settings.spring_backend_url

CROP_CATALOG: dict[str, dict[str, Any]] = {
    "Ash plantain": {"baseYieldTPerHa": 12.0, "typicalPriceRsPerKg": 110, "estimatedDemandTonnes": 60, "seasons": ["Yala", "Maha"], "weatherSuitability": {"Yala": 80, "Maha": 85}},
    "Ash pumpkin": {"baseYieldTPerHa": 12.0, "typicalPriceRsPerKg": 180, "estimatedDemandTonnes": 50, "seasons": ["Yala", "Maha"], "weatherSuitability": {"Yala": 85, "Maha": 75}},
    "Bean (green)": {"baseYieldTPerHa": 8.0, "typicalPriceRsPerKg": 195, "estimatedDemandTonnes": 30, "seasons": ["Yala", "Maha"], "weatherSuitability": {"Yala": 80, "Maha": 70}},
    "Beetroot": {"baseYieldTPerHa": 18.0, "typicalPriceRsPerKg": 150, "estimatedDemandTonnes": 25, "seasons": ["Yala", "Maha"], "weatherSuitability": {"Yala": 60, "Maha": 75}},
    "Bitter gourd": {"baseYieldTPerHa": 14.0, "typicalPriceRsPerKg": 220, "estimatedDemandTonnes": 20, "seasons": ["Yala", "Maha"], "weatherSuitability": {"Yala": 85, "Maha": 70}},
    "Brinjal": {"baseYieldTPerHa": 14.0, "typicalPriceRsPerKg": 160, "estimatedDemandTonnes": 28, "seasons": ["Yala", "Maha"], "weatherSuitability": {"Yala": 75, "Maha": 80}},
    "Cabbage": {"baseYieldTPerHa": 20.0, "typicalPriceRsPerKg": 120, "estimatedDemandTonnes": 25, "seasons": ["Yala", "Maha"], "weatherSuitability": {"Yala": 50, "Maha": 70}},
    "Capsicum": {"baseYieldTPerHa": 16.0, "typicalPriceRsPerKg": 280, "estimatedDemandTonnes": 18, "seasons": ["Yala", "Maha"], "weatherSuitability": {"Yala": 65, "Maha": 80}},
    "Carrot": {"baseYieldTPerHa": 18.0, "typicalPriceRsPerKg": 220, "estimatedDemandTonnes": 35, "seasons": ["Yala", "Maha"], "weatherSuitability": {"Yala": 55, "Maha": 75}},
    "Cucumber": {"baseYieldTPerHa": 15.0, "typicalPriceRsPerKg": 140, "estimatedDemandTonnes": 32, "seasons": ["Yala", "Maha"], "weatherSuitability": {"Yala": 80, "Maha": 70}},
    "Knol-khol": {"baseYieldTPerHa": 17.0, "typicalPriceRsPerKg": 130, "estimatedDemandTonnes": 15, "seasons": ["Yala", "Maha"], "weatherSuitability": {"Yala": 60, "Maha": 75}},
    "Ladies fingers": {"baseYieldTPerHa": 13.0, "typicalPriceRsPerKg": 170, "estimatedDemandTonnes": 22, "seasons": ["Yala", "Maha"], "weatherSuitability": {"Yala": 85, "Maha": 70}},
    "Leeks": {"baseYieldTPerHa": 12.0, "typicalPriceRsPerKg": 250, "estimatedDemandTonnes": 20, "seasons": ["Yala", "Maha"], "weatherSuitability": {"Yala": 65, "Maha": 80}},
    "Luffa": {"baseYieldTPerHa": 11.0, "typicalPriceRsPerKg": 120, "estimatedDemandTonnes": 12, "seasons": ["Yala", "Maha"], "weatherSuitability": {"Yala": 85, "Maha": 70}},
    "Radish": {"baseYieldTPerHa": 16.0, "typicalPriceRsPerKg": 100, "estimatedDemandTonnes": 20, "seasons": ["Yala", "Maha"], "weatherSuitability": {"Yala": 65, "Maha": 80}},
    "Red pumpkin": {"baseYieldTPerHa": 12.0, "typicalPriceRsPerKg": 170, "estimatedDemandTonnes": 40, "seasons": ["Yala", "Maha"], "weatherSuitability": {"Yala": 85, "Maha": 75}},
    "Snake gourd": {"baseYieldTPerHa": 12.0, "typicalPriceRsPerKg": 110, "estimatedDemandTonnes": 18, "seasons": ["Yala", "Maha"], "weatherSuitability": {"Yala": 85, "Maha": 70}},
    "Tomato": {"baseYieldTPerHa": 15.0, "typicalPriceRsPerKg": 150, "estimatedDemandTonnes": 45, "seasons": ["Yala", "Maha"], "weatherSuitability": {"Yala": 70, "Maha": 85}},
}


@tool
def get_crop_catalog() -> dict[str, dict[str, Any]]:
    """Return the full crop catalog with base yields, seasons, and estimated demand."""
    return CROP_CATALOG


@tool
def get_farmer_profile(farmer_id: str) -> dict[str, Any]:
    """Fetch a farmer's profile from the Spring backend."""
    try:
        with urlopen(f"{SPRING_BACKEND_URL}/api/farmers/{farmer_id}", timeout=30) as response:
            return json.loads(response.read().decode("utf-8"))
    except HTTPError as error:
        if error.code == 404:
            return {}
        raise


@tool
def get_weather(region: str) -> dict[str, float]:
    """Fetch current weather conditions for a region using Open-Meteo."""
    geocode_params = urlencode({"name": region, "count": 1, "language": "en", "format": "json"})
    with urlopen(f"https://geocoding-api.open-meteo.com/v1/search?{geocode_params}", timeout=20) as response:
        geocode_data = json.loads(response.read().decode("utf-8"))

    results = geocode_data.get("results") or []
    if not results:
        raise ValueError(f"Could not find weather location for region: {region}")

    selected = results[0]
    weather_params = urlencode({
        "latitude": selected["latitude"],
        "longitude": selected["longitude"],
        "current": "temperature_2m,relative_humidity_2m,precipitation",
        "timezone": "auto",
    })
    with urlopen(f"https://api.open-meteo.com/v1/forecast?{weather_params}", timeout=20) as response:
        weather_data = json.loads(response.read().decode("utf-8"))

    current = weather_data.get("current") or {}
    return {
        "region": region,
        "rainfall_mm": float(current.get("precipitation", 0.0)),
        "temperature_c": float(current.get("temperature_2m", 0.0)),
        "humidity_percent": float(current.get("relative_humidity_2m", 0.0)),
    }


@tool
def get_market_prices() -> dict[str, float]:
    """Fetch live market prices from the HARTI bulletin via the Spring backend."""
    try:
        with urlopen(f"{SPRING_BACKEND_URL}/api/market-prices/live", timeout=30) as response:
            data = json.loads(response.read().decode("utf-8"))
    except Exception:
        return {}

    prices: dict[str, float] = {}
    for entry in data.get("entries") or []:
        crop_name = entry.get("cropName")
        prices_list = entry.get("prices") or []
        if not crop_name or not prices_list:
            continue
        try:
            numeric = [float(p.replace(",", "")) for p in prices_list]
            if numeric:
                prices[crop_name] = min(numeric)
        except ValueError:
            continue
    return prices


@tool
def predict_crop_yield(
    crop: str,
    region: str,
    district: str,
    land_area_ha: float,
    season: str,
    irrigation: str,
    soil_type: str = "Loamy",
    rainfall_mm: float = 150.0,
    temperature_c: float = 28.0,
    humidity_percent: float = 75.0,
) -> dict[str, Any]:
    """Predict yield (ton/ha) for a crop given farming context."""
    payload = {
        "crop_type": crop,
        "region": region,
        "soil_type": soil_type,
        "rainfall_mm": rainfall_mm,
        "temperature_c": temperature_c,
        "humidity_percent": humidity_percent,
        "land_area_ha": land_area_ha,
        "season": season,
    }
    try:
        predicted_yield = predict_yield(payload)
    except Exception:
        predicted_yield = CROP_CATALOG.get(crop, {}).get("baseYieldTPerHa", 10.0)

    return {
        "crop": crop,
        "predictedYieldTPerHa": round(float(predicted_yield), 2),
        "expectedProductionT": round(float(predicted_yield) * land_area_ha, 2),
    }


@tool
def predict_crop_price(
    crop: str,
    region: str,
    season: str,
    year: int = 2026,
) -> dict[str, Any]:
    """Predict market price (Rs/kg) for a crop using the trained XGBoost model."""
    try:
        result = predict_farm(
            land_area_ha=1.0,
            crop=crop,
            season=season,
            region=region,
            district="Kandy" if region == "Up country" else "Gampaha",
            irrigation="Irrigated",
            year=year,
        )
        price = float(result["price_rs_per_kg"])
    except Exception:
        price = float(CROP_CATALOG.get(crop, {}).get("typicalPriceRsPerKg", 150.0))

    return {"crop": crop, "marketPriceRsPerKg": round(price, 2)}


@tool
def estimate_demand(crop: str, season: str) -> dict[str, Any]:
    """Estimate next-season demand (tonnes) for a crop."""
    base = CROP_CATALOG.get(crop, {}).get("estimatedDemandTonnes", 20.0)
    factor = 1.1 if season == "Maha" else 0.95
    return {"crop": crop, "estimatedDemandTonnes": round(base * factor, 1), "season": season, "source": "estimated"}


@tool
def get_crop_plans(season: str) -> list[dict[str, Any]]:
    """Fetch all farmer crop plans for a season from Spring backend."""
    try:
        request = Request(f"{SPRING_BACKEND_URL}/api/firestore/crop-plans", headers={"Content-Type": "application/json"}, method="GET")
        with urlopen(request, timeout=30) as response:
            data = json.loads(response.read().decode("utf-8"))
        records = data if isinstance(data, list) else (data.get("data", []) if isinstance(data, dict) else [])
        return [p for p in records if p.get("season") == season]
    except Exception:
        return []


@tool
def get_crop_relationships(crop_id: str) -> dict:
    """Return agricultural relationships for a crop from the knowledge graph.

    Safe, predefined Cypher only. Never accepts raw user Cypher.
    """
    try:
        return neo4j_service.get_related_crop_information(crop_id)
    except Neo4jUnavailableError as error:
        return {"crop_id": crop_id, "error": str(error), "status": "unavailable"}


@tool
def get_crop_graph_demand(crop_id: str, season: str, year: int) -> dict:
    """Return expected demand for a crop from the knowledge graph (if seeded)."""
    try:
        rows = neo4j_service.get_crop_demand(crop_id, season, int(year))
        return {"rows": rows, "status": "ok" if rows else "empty"}
    except Neo4jUnavailableError as error:
        return {"rows": [], "status": "unavailable", "error": str(error)}


def get_all_tools() -> list:
    """Return all LangChain tools registered for the agent."""
    return [
        get_crop_catalog,
        get_farmer_profile,
        get_weather,
        get_market_prices,
        predict_crop_yield,
        predict_crop_price,
        estimate_demand,
        get_crop_plans,
        get_crop_relationships,
        get_crop_graph_demand,
    ]