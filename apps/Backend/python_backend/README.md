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
