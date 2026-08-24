# Python Backend

This service is reserved for machine learning models and agentic AI logic.

It also includes a small Firestore reader for the `farmers` collection.

## Planned responsibilities

- price prediction
- yield prediction
- demand forecasting
- LangChain / agentic AI

## Run

```bash
cd apps/Backend/python_backend
python -m pip install -r requirements.txt
python app.py
```

## Firebase setup

Place your Firebase service account JSON file in this folder as `firebase-service-account.json`, or set:

```bash
set FIREBASE_CREDENTIALS_PATH=C:\path\to\firebase-service-account.json
```

Then open:

- `GET /health`
- `GET /farmers`
- `POST /predict-yield`

## Automatic HARTI price learning

The Spring service collects the newest readable HARTI bulletin every day at
07:30 Asia/Colombo and stores it in Firestore using the bulletin date as its
document ID. This makes repeated runs idempotent. Every Sunday at 02:00 it asks
this Python service to train a new forecasting candidate.

The candidate replaces the active model only when its chronological validation
MAE is no more than 2% worse than the active model. At least 20 normalized price
observations across three bulletin dates are required. Until then, farm
predictions continue using the original baseline model.

- `GET /price-model/status` — active version, training date, data coverage and MAE
- `POST /price-model/retrain` — manually run guarded retraining
- `POST /predict-price` with `{ "crop": "Tomato", "days_ahead": 7 }`

Optional environment variables:

```bash
set SPRING_BACKEND_URL=http://127.0.0.1:8080
set HARTI_MODEL_MIN_OBSERVATIONS=20
```
