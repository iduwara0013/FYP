from pathlib import Path
from typing import Any

import joblib
import pandas as pd
from sklearn.compose import ColumnTransformer
from sklearn.ensemble import RandomForestRegressor
from sklearn.impute import SimpleImputer
from sklearn.pipeline import Pipeline
from sklearn.preprocessing import OneHotEncoder


BASE_DIR = Path(__file__).resolve().parents[1]
MODELS_DIR = BASE_DIR / "models"
MODEL_PATH = MODELS_DIR / "yield_model.joblib"

FEATURE_COLUMNS = [
    "crop_type",
    "region",
    "soil_type",
    "rainfall_mm",
    "temperature_c",
    "humidity_percent",
    "land_area_ha",
    "season",
]

TARGET_COLUMN = "yield_ton_per_ha"


def _build_training_frame() -> pd.DataFrame:
    return pd.DataFrame(
        [
            ["pumpkin", "Matale", "Loamy", 12.0, 29.5, 78.0, 1.0, "Yala", 16.2],
            ["pumpkin", "Matale", "Loamy", 18.5, 30.0, 75.0, 1.2, "Maha", 17.4],
            ["pumpkin", "Kandy", "Clay", 22.0, 27.8, 80.0, 0.9, "Yala", 15.1],
            ["pumpkin", "Anuradhapura", "Sandy Loam", 10.0, 31.2, 68.0, 1.5, "Maha", 18.0],
            ["pumpkin", "Kurunegala", "Loamy", 15.0, 28.4, 74.0, 1.1, "Yala", 16.9],
            ["pumpkin", "Badulla", "Red Yellow Podzolic", 26.0, 24.5, 86.0, 0.8, "Maha", 14.3],
        ],
        columns=FEATURE_COLUMNS + [TARGET_COLUMN],
    )


def _build_pipeline(features: pd.DataFrame) -> Pipeline:
    categorical_features = features.select_dtypes(include=["object"]).columns.tolist()
    numeric_features = features.select_dtypes(exclude=["object"]).columns.tolist()

    preprocessor = ColumnTransformer(
        transformers=[
            (
                "categorical",
                Pipeline(
                    steps=[
                        ("imputer", SimpleImputer(strategy="most_frequent")),
                        ("onehot", OneHotEncoder(handle_unknown="ignore")),
                    ]
                ),
                categorical_features,
            ),
            (
                "numeric",
                Pipeline(
                    steps=[("imputer", SimpleImputer(strategy="median"))]
                ),
                numeric_features,
            ),
        ]
    )

    return Pipeline(
        steps=[
            ("preprocessor", preprocessor),
            (
                "model",
                RandomForestRegressor(
                    n_estimators=200,
                    random_state=42,
                    n_jobs=-1,
                ),
            ),
        ]
    )


def ensure_model() -> Pipeline:
    MODELS_DIR.mkdir(parents=True, exist_ok=True)

    if MODEL_PATH.exists():
        return joblib.load(MODEL_PATH)

    training_frame = _build_training_frame()
    pipeline = _build_pipeline(training_frame[FEATURE_COLUMNS])
    pipeline.fit(training_frame[FEATURE_COLUMNS], training_frame[TARGET_COLUMN])
    joblib.dump(pipeline, MODEL_PATH)
    return pipeline


def predict_yield(payload: dict[str, Any]) -> float:
    model = ensure_model()
    input_frame = pd.DataFrame([payload], columns=FEATURE_COLUMNS)
    return float(model.predict(input_frame)[0])
