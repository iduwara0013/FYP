"""Train and serve a guarded daily-price forecast from archived HARTI bulletins."""
from __future__ import annotations

import json
import math
import os
import re
from datetime import date, datetime, timedelta, timezone
from pathlib import Path
from typing import Any
from urllib.request import urlopen

import joblib
import pandas as pd
from sklearn.compose import ColumnTransformer
from sklearn.ensemble import RandomForestRegressor
from sklearn.metrics import mean_absolute_error
from sklearn.pipeline import Pipeline
from sklearn.preprocessing import OneHotEncoder

MODELS_DIR = Path(__file__).resolve().parents[1] / "models"
MODEL_PATH = MODELS_DIR / "harti_price_forecast.joblib"
METADATA_PATH = MODELS_DIR / "harti_price_forecast_metadata.json"
SPRING_BACKEND_URL = os.getenv("SPRING_BACKEND_URL", "http://127.0.0.1:8080")
MIN_OBSERVATIONS = int(os.getenv("HARTI_MODEL_MIN_OBSERVATIONS", "20"))


def _number(value: Any) -> float | None:
    try:
        result = float(str(value).replace(",", ""))
        return result if 1 <= result <= 10000 else None
    except (TypeError, ValueError):
        return None


def normalize_crop(value: str) -> str:
    return re.sub(r"[^a-z0-9]+", " ", value.lower()).strip()


def bulletins_to_frame(bulletins: list[dict[str, Any]]) -> pd.DataFrame:
    rows: list[dict[str, Any]] = []
    for bulletin in bulletins:
        try:
            observed = date.fromisoformat(str(bulletin.get("date")))
        except ValueError:
            continue
        for entry in bulletin.get("entries") or []:
            values = [_number(item) for item in (entry.get("prices") or [])]
            prices = [item for item in values if item is not None]
            crop = normalize_crop(str(entry.get("cropName") or ""))
            if crop and prices:
                rows.append({"crop": crop, "date": observed, "price": sum(prices) / len(prices)})
    frame = pd.DataFrame(rows)
    if frame.empty:
        return frame
    frame = frame.groupby(["crop", "date"], as_index=False)["price"].mean().sort_values(["crop", "date"])
    origin = frame["date"].min()
    frame["day_index"] = frame["date"].map(lambda item: (item - origin).days)
    frame["month"] = frame["date"].map(lambda item: item.month)
    frame["weekday"] = frame["date"].map(lambda item: item.weekday())
    return frame


def fetch_history() -> list[dict[str, Any]]:
    with urlopen(f"{SPRING_BACKEND_URL}/api/market-prices/history", timeout=60) as response:
        payload = json.loads(response.read().decode("utf-8"))
    return payload if isinstance(payload, list) else []


def model_status() -> dict[str, Any]:
    if not METADATA_PATH.exists():
        return {"ready": False, "message": "The HARTI model has not been trained yet."}
    return json.loads(METADATA_PATH.read_text(encoding="utf-8"))


def train_from_history(bulletins: list[dict[str, Any]] | None = None) -> dict[str, Any]:
    frame = bulletins_to_frame(fetch_history() if bulletins is None else bulletins)
    if frame.empty or len(frame) < MIN_OBSERVATIONS or frame["date"].nunique() < 3:
        return {"promoted": False, "ready": MODEL_PATH.exists(), "reason": "not_enough_history", "observations": len(frame), "minimum": MIN_OBSERVATIONS}

    dates = sorted(frame["date"].unique())
    split_date = dates[max(1, math.floor(len(dates) * 0.8)) - 1]
    train = frame[frame["date"] <= split_date]
    test = frame[frame["date"] > split_date]
    if test.empty:
        test = frame.tail(max(1, len(frame) // 5))
        train = frame.drop(test.index)

    features = ["crop", "day_index", "month", "weekday"]
    pipeline = Pipeline([
        ("prep", ColumnTransformer([("crop", OneHotEncoder(handle_unknown="ignore"), ["crop"])], remainder="passthrough")),
        ("model", RandomForestRegressor(n_estimators=300, min_samples_leaf=2, random_state=42, n_jobs=-1)),
    ])
    pipeline.fit(train[features], train["price"])
    mae = float(mean_absolute_error(test["price"], pipeline.predict(test[features])))
    previous = model_status()
    previous_mae = previous.get("validationMae")
    promoted = previous_mae is None or mae <= float(previous_mae) * 1.02
    metadata = {
        "ready": promoted or MODEL_PATH.exists(), "promoted": promoted,
        "trainedAt": datetime.now(timezone.utc).isoformat(), "validationMae": round(mae, 2),
        "previousValidationMae": previous_mae, "observations": int(len(frame)),
        "bulletinDays": int(frame["date"].nunique()), "cropCount": int(frame["crop"].nunique()),
        "latestBulletinDate": str(frame["date"].max()), "modelVersion": datetime.now(timezone.utc).strftime("harti-%Y%m%d%H%M%S"),
    }
    if promoted:
        MODELS_DIR.mkdir(parents=True, exist_ok=True)
        joblib.dump({"pipeline": pipeline, "origin": str(frame["date"].min()), "latest": str(frame["date"].max()), "crop_prices": frame.groupby("crop")["price"].mean().to_dict()}, MODEL_PATH)
        METADATA_PATH.write_text(json.dumps(metadata, indent=2), encoding="utf-8")
    return metadata


def predict_price(crop: str, days_ahead: int = 1) -> dict[str, Any]:
    if not MODEL_PATH.exists():
        raise FileNotFoundError("HARTI forecast model is not ready. Collect more bulletins and retrain it.")
    artifact = joblib.load(MODEL_PATH)
    normalized = normalize_crop(crop)
    if normalized not in artifact["crop_prices"]:
        raise ValueError(f"No HARTI history is available for {crop}.")
    latest = date.fromisoformat(artifact["latest"])
    target = latest + timedelta(days=max(1, min(days_ahead, 30)))
    origin = date.fromisoformat(artifact["origin"])
    sample = pd.DataFrame([{"crop": normalized, "day_index": (target-origin).days, "month": target.month, "weekday": target.weekday()}])
    prediction = max(0.0, float(artifact["pipeline"].predict(sample)[0]))
    status = model_status()
    return {"crop": crop, "predictedPriceRsPerKg": round(prediction, 2), "forecastDate": str(target), "daysAhead": days_ahead, "source": "HARTI historical bulletins", "modelVersion": status.get("modelVersion"), "validationMae": status.get("validationMae"), "trainedAt": status.get("trainedAt")}
