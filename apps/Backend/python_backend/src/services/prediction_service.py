"""
Yield & price prediction service using the trained XGBoost models.

Model 1 (Yield): land area + crop + season + region + district + irrigation
    + fertilizer + rainfall + experience  ->  production_kg

Model 2 (Price): production_kg + relative_supply + year + crop + season
    + region  ->  price_rs_per_kg
"""
import warnings
from pathlib import Path
from typing import Any

import joblib
import pandas as pd
from sklearn.exceptions import InconsistentVersionWarning

BASE_DIR = Path(__file__).resolve().parents[1]
MODELS_DIR = BASE_DIR / "models"

YIELD_MODEL_PATH = MODELS_DIR / "yield_prediction_model.joblib"
YIELD_FEATURES_PATH = MODELS_DIR / "yield_model_features.joblib"
PRICE_MODEL_PATH = MODELS_DIR / "price_prediction_model.joblib"
PRICE_FEATURES_PATH = MODELS_DIR / "price_model_features.joblib"
CROP_MEDIAN_PATH = MODELS_DIR / "crop_median_production.joblib"

CROPS = [
    "Ash plantain",
    "Ash pumpkin",
    "Bean (green)",
    "Beetroot",
    "Bitter gourd",
    "Brinjal",
    "Cabbage",
    "Capsicum",
    "Carrot",
    "Cucumber",
    "Knol-khol",
    "Ladies fingers",
    "Leeks",
    "Luffa",
    "Radish",
    "Red pumpkin",
    "Snake gourd",
    "Tomato",
]

REGIONS = ["Up country", "Low country"]
DISTRICTS = [
    "Nuwara Eliya",
    "Badulla",
    "Kandy",
    "Gampaha",
    "Kalutara",
    "Ratnapura",
    "Kurunegala",
]
SEASONS = ["Maha", "Yala"]
IRRIGATION = ["Irrigated", "Rainfed"]


def _load_model(path: Path):
    if not path.exists():
        raise FileNotFoundError(
            f"Model file not found at {path}. Run scripts/train_models.py first."
        )
    with warnings.catch_warnings():
        warnings.simplefilter("ignore", InconsistentVersionWarning)
        return joblib.load(path)


def _load_yield_model():
    return _load_model(YIELD_MODEL_PATH)


def _load_yield_features() -> list[str]:
    return _load_model(YIELD_FEATURES_PATH)


def _load_price_model():
    return _load_model(PRICE_MODEL_PATH)


def _load_price_features() -> list[str]:
    return _load_model(PRICE_FEATURES_PATH)


def _load_crop_median() -> dict[str, float]:
    return _load_model(CROP_MEDIAN_PATH)


def predict_farm(
    land_area_ha: float,
    crop: str,
    season: str,
    region: str,
    district: str,
    irrigation: str,
    fertilizer_kg: float | None = None,
    rainfall_mm: float = 150.0,
    farmer_experience_yrs: int = 10,
    year: int = 2026,
) -> dict[str, Any]:
    """Predict production (kg), price (Rs/kg), and revenue (Rs) for a farm."""
    if fertilizer_kg is None:
        fertilizer_kg = 150.0 * land_area_ha

    # ---- Step 1: predict production (Model 1) -----------------------------
    yield_model = _load_yield_model()
    yield_features = _load_yield_features()

    x1 = pd.DataFrame(
        [
            {
                "land_area_ha": land_area_ha,
                "fertilizer_kg": fertilizer_kg,
                "rainfall_mm": rainfall_mm,
                "farmer_experience_yrs": farmer_experience_yrs,
                "crop": crop,
                "season": season,
                "region": region,
                "district": district,
                "irrigation": irrigation,
            }
        ],
        columns=yield_features,
    )
    production_kg = float(yield_model.predict(x1)[0])

    # ---- Step 2: predict price (Model 2), using Model 1's output ----------
    price_model = _load_price_model()
    price_features = _load_price_features()
    crop_median = _load_crop_median()

    median_prod = crop_median.get(crop, production_kg)
    relative_supply = production_kg / median_prod if median_prod else 1.0

    x2 = pd.DataFrame(
        [
            {
                "production_kg": production_kg,
                "relative_supply": relative_supply,
                "year": year,
                "crop": crop,
                "season": season,
                "region": region,
            }
        ],
        columns=price_features,
    )
    price_rs_per_kg = float(price_model.predict(x2)[0])
    price_source = "baseline farm price model"
    harti_model = None
    try:
        from src.services.harti_price_forecast import predict_price

        harti_model = predict_price(crop, 1)
        price_rs_per_kg = 0.8 * float(harti_model["predictedPriceRsPerKg"]) + 0.2 * price_rs_per_kg
        price_source = "HARTI daily model + farm context"
    except (FileNotFoundError, ValueError):
        pass

    revenue_rs = production_kg * price_rs_per_kg

    return {
        "production_kg": round(production_kg, 1),
        "price_rs_per_kg": round(price_rs_per_kg, 2),
        "revenue_rs": round(revenue_rs, 2),
        "relative_supply": round(relative_supply, 3),
        "price_source": price_source,
        "price_model": harti_model,
        "input": {
            "land_area_ha": land_area_ha,
            "crop": crop,
            "season": season,
            "region": region,
            "district": district,
            "irrigation": irrigation,
            "fertilizer_kg": round(fertilizer_kg, 1),
            "rainfall_mm": rainfall_mm,
            "farmer_experience_yrs": farmer_experience_yrs,
            "year": year,
        },
    }


def predict_from_payload(payload: dict[str, Any]) -> dict[str, Any]:
    """Wrapper for Flask: accepts a JSON payload dict and returns predictions."""
    return predict_farm(
        land_area_ha=float(payload["land_area_ha"]),
        crop=payload["crop"],
        season=payload["season"],
        region=payload["region"],
        district=payload["district"],
        irrigation=payload["irrigation"],
        fertilizer_kg=(
            float(payload["fertilizer_kg"]) if payload.get("fertilizer_kg") else None
        ),
        rainfall_mm=float(payload.get("rainfall_mm", 150.0)),
        farmer_experience_yrs=int(payload.get("farmer_experience_yrs", 10)),
        year=int(payload.get("year", 2026)),
    )
