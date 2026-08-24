from datetime import datetime
import json
import os
import threading
from urllib.error import HTTPError
from urllib.parse import urlencode
from urllib.request import Request, urlopen

from flask import Flask, jsonify, request
import tkinter as tk
from tkinter import messagebox, ttk

from src.services.prediction_service import (
    CROPS,
    DISTRICTS,
    IRRIGATION,
    REGIONS,
    SEASONS,
    predict_farm,
)
from src.services.yield_prediction import FEATURE_COLUMNS, predict_yield
from src.services.harti_price_forecast import model_status, predict_price, train_from_history
from src.agent.graph import run_recommendation_agent

app = Flask(__name__)
SPRING_BACKEND_URL = os.getenv("SPRING_BACKEND_URL", "http://127.0.0.1:8080")


def _farmer_display_name(farmer: dict) -> str:
    return (
        farmer.get("full_name")
        or farmer.get("name")
        or farmer.get("farmer_name")
        or farmer.get("id")
        or "Unknown farmer"
    )


def _print_numbered_farmers(farmers: list[dict]) -> None:
    return None


def _normalize_farmers_response(farmers_response) -> list[dict]:
    if isinstance(farmers_response, list):
        return farmers_response
    if isinstance(farmers_response, dict) and isinstance(farmers_response.get("data"), list):
        return farmers_response["data"]
    return []


def _fetch_farmers_from_spring() -> list[dict]:
    with urlopen(f"{SPRING_BACKEND_URL}/api/farmers", timeout=30) as response:
        farmers_response = json.loads(response.read().decode("utf-8"))
    return _normalize_farmers_response(farmers_response)


@app.get("/health")
def health():
    return jsonify({"status": "ok", "message": "Python backend is running."})


@app.post("/predict-yield")
def predict_yield_route():
    payload = request.get_json(silent=True) or {}
    missing_fields = [field for field in FEATURE_COLUMNS if field not in payload]

    if missing_fields:
        return jsonify({"error": "Missing required fields", "missing_fields": missing_fields}), 400

    try:
        prediction = predict_yield(payload)
    except Exception as error:
        return jsonify({"error": str(error)}), 500

    return jsonify({"predicted_yield": round(prediction, 2), "unit": "ton/ha"})


@app.get("/prediction-options")
def prediction_options():
    return jsonify(
        {
            "crops": CROPS,
            "regions": REGIONS,
            "districts": DISTRICTS,
            "seasons": SEASONS,
            "irrigation": IRRIGATION,
        }
    )


@app.get("/price-model/status")
def price_model_status_route():
    return jsonify(model_status())


@app.post("/price-model/retrain")
def retrain_price_model_route():
    try:
        return jsonify(train_from_history())
    except Exception as error:
        return jsonify({"error": str(error)}), 503


@app.post("/predict-price")
def predict_price_route():
    payload = request.get_json(silent=True) or {}
    if not payload.get("crop"):
        return jsonify({"error": "crop is required"}), 400
    try:
        return jsonify(predict_price(str(payload["crop"]), int(payload.get("days_ahead", 1))))
    except (FileNotFoundError, ValueError) as error:
        return jsonify({"error": str(error)}), 409


@app.post("/predict-farm")
def predict_farm_route():
    payload = request.get_json(silent=True) or {}
    required = ["land_area_ha", "crop", "season", "region", "district", "irrigation"]
    missing_fields = [field for field in required if field not in payload]

    if missing_fields:
        return jsonify({"error": "Missing required fields", "missing_fields": missing_fields}), 400

    try:
        result = predict_farm(
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
    except Exception as error:
        return jsonify({"error": str(error)}), 500

    return jsonify(result)


@app.get("/farmers")
def get_farmers():
    try:
        farmers = _fetch_farmers_from_spring()

        return jsonify({"count": len(farmers), "data": farmers})
    except Exception as error:
        return jsonify({"error": str(error)}), 500

def _fetch_farmer_from_spring(farmer_id: str) -> dict:
    try:
        with urlopen(f"{SPRING_BACKEND_URL}/api/farmers/{farmer_id}", timeout=30) as response:
            return json.loads(response.read().decode("utf-8"))
    except HTTPError as error:
        if error.code == 404:
            return {}
        raise


def _fetch_weather(region: str) -> dict[str, float]:
    geocode_params = urlencode({"name": region, "count": 1, "language": "en", "format": "json"})
    geocode_url = f"https://geocoding-api.open-meteo.com/v1/search?{geocode_params}"

    with urlopen(geocode_url, timeout=20) as response:
        geocode_data = json.loads(response.read().decode("utf-8"))

    results = geocode_data.get("results") or []
    if not results:
        raise ValueError(f"Could not find weather location for region: {region}")

    selected_location = results[0]
    latitude = selected_location["latitude"]
    longitude = selected_location["longitude"]

    weather_params = urlencode(
        {
            "latitude": latitude,
            "longitude": longitude,
            "current": "temperature_2m,relative_humidity_2m,precipitation",
            "timezone": "auto",
        }
    )
    weather_url = f"https://api.open-meteo.com/v1/forecast?{weather_params}"

    with urlopen(weather_url, timeout=20) as response:
        weather_data = json.loads(response.read().decode("utf-8"))

    current_weather = weather_data.get("current") or {}
    return {
        "rainfall_mm": float(current_weather.get("precipitation", 0.0)),
        "temperature_c": float(current_weather.get("temperature_2m", 0.0)),
        "humidity_percent": float(current_weather.get("relative_humidity_2m", 0.0)),
    }


def _current_season() -> str:
    month = datetime.now().month
    return "Maha" if month in {10, 11, 12, 1, 2, 3} else "Yala"


def _predict_and_save_for_farmer_id(farmer_id: str, overrides: dict | None = None) -> dict:
    payload = overrides or {}
    farmer = _fetch_farmer_from_spring(farmer_id)
    if not farmer:
        raise ValueError(f"Farmer not found: {farmer_id}")

    region = farmer.get("region") or payload.get("region")
    if not region:
        raise ValueError("Farmer region is missing")

    weather = _fetch_weather(region)
    farmer_yield_payload = {
        "crop_type": "pumpkin",
        "region": region,
        "soil_type": payload.get("soilType") or farmer.get("soil_type") or "Loamy",
        "rainfall_mm": payload.get("rainfallMm", weather["rainfall_mm"]),
        "temperature_c": payload.get("temperatureC", weather["temperature_c"]),
        "humidity_percent": payload.get("humidityPercent", weather["humidity_percent"]),
        "land_area_ha": payload.get("landAreaHa")
        or farmer.get("total_land_area")
        or farmer.get("land_area_ha")
        or farmer.get("landAreaHa")
        or 1.0,
        "season": payload.get("season") or _current_season(),
    }

    prediction = predict_yield(farmer_yield_payload)

    save_payload = {
        "farmerId": farmer_id,
        "cropType": "pumpkin",
        "farmer": farmer,
        "input": farmer_yield_payload,
        "predictedYield": round(prediction, 2),
        "unit": "ton/ha",
    }

    save_request = Request(
        f"{SPRING_BACKEND_URL}/api/yield-predictions",
        data=json.dumps(save_payload).encode("utf-8"),
        headers={"Content-Type": "application/json"},
        method="POST",
    )

    with urlopen(save_request, timeout=30) as response:
        save_result = json.loads(response.read().decode("utf-8"))

    return {
        "farmerId": farmer_id,
        "farmer": farmer,
        "input": farmer_yield_payload,
        "predicted_yield": round(prediction, 2),
        "unit": "ton/ha",
        "savedPrediction": save_result,
    }


@app.post("/agent/recommend")
def agent_recommend_route():
    """Run the LangGraph crop recommendation agent."""
    payload = request.get_json(silent=True) or {}
    try:
        result = run_recommendation_agent(payload)
        return jsonify(result)
    except Exception as error:
        return jsonify({"error": str(error)}), 500


@app.post("/predict-farmer-yield")
def predict_farmer_yield_route():
    payload = request.get_json(silent=True) or {}
    farmer_id = payload.get("farmerId")

    if not farmer_id:
        return jsonify({"error": "farmerId is required"}), 400

    try:
        result = _predict_and_save_for_farmer_id(farmer_id, payload)
        return jsonify(result)
    except Exception as error:
        return jsonify({"error": str(error)}), 500


class FarmerPredictionApp:
    def __init__(self):
        self.root = tk.Tk()
        self.root.title("Smart Crop Forecasting")
        self.root.geometry("540x520")
        self.root.resizable(False, False)

        self.farmers: list[dict] = []

        self._build_ui()
        self._load_farmers()

    def _build_ui(self):
        container = ttk.Frame(self.root, padding=16)
        container.pack(fill="both", expand=True)

        title = ttk.Label(container, text="Farmer Yield Predictor", font=("Segoe UI", 16, "bold"))
        title.pack(anchor="w", pady=(0, 8))

        ttk.Label(container, text="Select a farmer number and click Predict.").pack(anchor="w", pady=(0, 10))

        list_frame = ttk.LabelFrame(container, text="Farmers")
        list_frame.pack(fill="both", expand=False)

        self.farmer_listbox = tk.Listbox(list_frame, height=10, font=("Segoe UI", 10))
        self.farmer_listbox.pack(side="left", fill="both", expand=True, padx=(8, 0), pady=8)

        scrollbar = ttk.Scrollbar(list_frame, orient="vertical", command=self.farmer_listbox.yview)
        scrollbar.pack(side="right", fill="y", padx=(0, 8), pady=8)
        self.farmer_listbox.configure(yscrollcommand=scrollbar.set)

        input_frame = ttk.Frame(container)
        input_frame.pack(fill="x", pady=(12, 6))

        ttk.Label(input_frame, text="Farmer number:").pack(side="left")
        self.farmer_number_var = tk.StringVar()
        self.farmer_number_entry = ttk.Entry(input_frame, textvariable=self.farmer_number_var, width=10)
        self.farmer_number_entry.pack(side="left", padx=(8, 10))

        predict_button = ttk.Button(input_frame, text="Predict", command=self._handle_predict)
        predict_button.pack(side="left")

        self.status_var = tk.StringVar(value="Loading farmers...")
        ttk.Label(container, textvariable=self.status_var, foreground="#555555").pack(anchor="w", pady=(8, 6))

        self.result_text = tk.Text(container, height=12, wrap="word", font=("Segoe UI", 10))
        self.result_text.pack(fill="both", expand=True)
        self.result_text.configure(state="disabled")

    def _set_result_text(self, text: str):
        self.result_text.configure(state="normal")
        self.result_text.delete("1.0", tk.END)
        self.result_text.insert(tk.END, text)
        self.result_text.configure(state="disabled")

    def _load_farmers(self):
        try:
            self.farmers = _fetch_farmers_from_spring()
            self.farmer_listbox.delete(0, tk.END)
            for index, farmer in enumerate(self.farmers, start=1):
                display_name = _farmer_display_name(farmer)
                farmer_id = farmer.get("id", "no-id")
                self.farmer_listbox.insert(tk.END, f"{index}. {display_name} ({farmer_id})")

            self.status_var.set(f"Loaded {len(self.farmers)} farmers.")
            if self.farmers:
                self.farmer_number_var.set("1")
                self.farmer_listbox.selection_set(0)
                self.farmer_listbox.activate(0)
        except Exception as error:
            self.status_var.set("Failed to load farmers.")
            self._set_result_text(f"Error loading farmers: {error}")

    def _handle_predict(self):
        try:
            farmer_number = int(self.farmer_number_var.get().strip())
            if farmer_number < 1 or farmer_number > len(self.farmers):
                raise ValueError("Choose a valid farmer number from the list.")

            farmer = self.farmers[farmer_number - 1]
            farmer_id = farmer.get("id")
            self.status_var.set(f"Predicting for {_farmer_display_name(farmer)}...")
            self.root.update_idletasks()

            result = _predict_and_save_for_farmer_id(farmer_id, {})
            saved_id = result.get("savedPrediction", {}).get("id", "unknown")

            output = (
                f"Farmer: {_farmer_display_name(result['farmer'])} ({result['farmerId']})\n"
                f"Predicted yield: {result['predicted_yield']:.2f} ton/ha\n"
                f"Saved Firebase document id: {saved_id}\n"
            )
            self._set_result_text(output)
            self.status_var.set("Prediction completed and saved.")
        except Exception as error:
            self.status_var.set("Prediction failed.")
            messagebox.showerror("Prediction error", str(error))
            self._set_result_text(f"Error: {error}")

    def run(self):
        self.root.mainloop()


def _run_flask_app():
    app.run(host="0.0.0.0", port=5000, debug=True, use_reloader=False)


def _start_app():
    flask_thread = threading.Thread(target=_run_flask_app, daemon=True)
    flask_thread.start()
    FarmerPredictionApp().run()


if __name__ == "__main__":
    _start_app()
