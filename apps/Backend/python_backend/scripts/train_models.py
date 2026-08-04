"""
Train yield and price prediction models using the synthetic-but-realistic
Sri Lanka vegetable farming dataset.

Model 1 (Yield): land area + crop + season + region + district + irrigation
    + fertilizer + rainfall + experience  ->  production_kg

Model 2 (Price): production_kg + relative_supply + year + crop + season
    + region  ->  price_rs_per_kg

The trained pipelines are saved as joblib files that the Flask backend
loads at runtime.
"""
from pathlib import Path

import joblib
import numpy as np
import pandas as pd
from sklearn.compose import ColumnTransformer
from sklearn.ensemble import RandomForestRegressor
from sklearn.metrics import mean_absolute_error, mean_squared_error, r2_score
from sklearn.model_selection import train_test_split
from sklearn.pipeline import Pipeline
from sklearn.preprocessing import OneHotEncoder, StandardScaler
from xgboost import XGBRegressor

BASE_DIR = Path(__file__).resolve().parents[1]
DATA_PATH = BASE_DIR / "sri_lanka_vegetable_dataset.csv"
MODELS_DIR = BASE_DIR / "src" / "models"


def load_dataset() -> pd.DataFrame:
    if not DATA_PATH.exists():
        raise FileNotFoundError(
            f"Dataset not found at {DATA_PATH}. "
            "Place sri_lanka_vegetable_dataset.csv in the python_backend folder."
        )
    return pd.read_csv(DATA_PATH)


def train_yield_model(df: pd.DataFrame) -> tuple[Pipeline, list[str]]:
    """Production (kg) from land area + farming context."""
    features_num = [
        "land_area_ha",
        "fertilizer_kg",
        "rainfall_mm",
        "farmer_experience_yrs",
    ]
    features_cat = ["crop", "season", "region", "district", "irrigation"]
    target = "production_kg"

    x = df[features_num + features_cat]
    y = df[target]

    x_train, x_test, y_train, y_test = train_test_split(
        x, y, test_size=0.2, random_state=42
    )

    preprocess = ColumnTransformer(
        transformers=[
            ("num", StandardScaler(), features_num),
            ("cat", OneHotEncoder(handle_unknown="ignore"), features_cat),
        ]
    )

    model = XGBRegressor(
        n_estimators=400,
        max_depth=6,
        learning_rate=0.05,
        random_state=42,
        n_jobs=-1,
    )
    pipeline = Pipeline([("prep", preprocess), ("model", model)])
    pipeline.fit(x_train, y_train)

    prediction = pipeline.predict(x_test)
    r2 = r2_score(y_test, prediction)
    mae = mean_absolute_error(y_test, prediction)
    rmse = np.sqrt(mean_squared_error(y_test, prediction))
    print(f"[Yield model] R2={r2:.4f} MAE={mae:.1f} kg RMSE={rmse:.1f} kg")

    return pipeline, features_num + features_cat


def train_price_model(df: pd.DataFrame) -> tuple[Pipeline, list[str], dict[str, float]]:
    """Price (Rs/kg) from production + market context."""
    crop_median_prod = df.groupby("crop")["production_kg"].transform("median")
    df = df.copy()
    df["relative_supply"] = df["production_kg"] / crop_median_prod

    features_num = ["production_kg", "relative_supply", "year"]
    features_cat = ["crop", "season", "region"]
    target = "price_rs_per_kg"

    x = df[features_num + features_cat]
    y = df[target]

    x_train, x_test, y_train, y_test = train_test_split(
        x, y, test_size=0.2, random_state=42
    )

    preprocess = ColumnTransformer(
        transformers=[
            ("num", StandardScaler(), features_num),
            ("cat", OneHotEncoder(handle_unknown="ignore"), features_cat),
        ]
    )

    model = XGBRegressor(
        n_estimators=400,
        max_depth=6,
        learning_rate=0.05,
        random_state=42,
        n_jobs=-1,
    )
    pipeline = Pipeline([("prep", preprocess), ("model", model)])
    pipeline.fit(x_train, y_train)

    prediction = pipeline.predict(x_test)
    r2 = r2_score(y_test, prediction)
    mae = mean_absolute_error(y_test, prediction)
    rmse = np.sqrt(mean_squared_error(y_test, prediction))
    print(f"[Price model] R2={r2:.4f} MAE={mae:.2f} Rs/kg RMSE={rmse:.2f} Rs/kg")

    crop_median_lookup = df.groupby("crop")["production_kg"].median().to_dict()

    return pipeline, features_num + features_cat, crop_median_lookup


def main() -> None:
    MODELS_DIR.mkdir(parents=True, exist_ok=True)

    df = load_dataset()
    print(f"Dataset loaded: {df.shape[0]} rows, {df.shape[1]} columns")
    print(f"Crops: {sorted(df['crop'].unique())}")
    print(f"Districts: {sorted(df['district'].unique())}\n")

    yield_pipeline, yield_features = train_yield_model(df)
    price_pipeline, price_features, crop_median_lookup = train_price_model(df)

    joblib.dump(yield_pipeline, MODELS_DIR / "yield_prediction_model.joblib")
    joblib.dump(yield_features, MODELS_DIR / "yield_model_features.joblib")
    joblib.dump(price_pipeline, MODELS_DIR / "price_prediction_model.joblib")
    joblib.dump(price_features, MODELS_DIR / "price_model_features.joblib")
    joblib.dump(crop_median_lookup, MODELS_DIR / "crop_median_production.joblib")

    print("\nModels saved to", MODELS_DIR)


if __name__ == "__main__":
    main()