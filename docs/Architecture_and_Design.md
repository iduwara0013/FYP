# SmartCrop — Architecture & Design Document (PR2 Update)

**Project:** SmartCrop — Intelligent Agricultural Decision Support System
**Last Updated:** 2026-08-05
**Status:** Reflects all changes implemented through Progress Review 2 (PR2)

---

## 1. Executive Summary

SmartCrop is a mobile-first decision-support platform for Sri Lankan vegetable farmers and buyers. It combines live market prices (HARTI), hyperlocal weather (Open-Meteo), AI-driven yield and price prediction (XGBoost), a farmer–buyer directory, and role-based dashboards. The system is built as a polyglot microservice-style architecture with a React Native (Expo) frontend, a Spring Boot (Java) backend for transactional services, and a Python (Flask) backend for machine-learning inference, backed by Firebase Firestore.

This document supersedes the PR1 architecture description and reflects all changes through PR2, including the two-stage ML prediction pipeline (production → price → revenue), the live HARTI PDF scraper, the auto weather-fill prediction flow, and the role-based farmer/buyer dashboards.

---

## 2. System Context

```
+--------------------+     +-----------------------+     +----------------------+
|   Farmer / Buyer   | --> |  React Native (Expo)  | --> |  Spring Boot Backend |
|   (Mobile App)     | <-- |   Frontend (TS/TSX)   | <-- |   (Java / REST)      |
+--------------------+     +-----------------------+     +----------------------+
                                     |                              |
                                     | REST/JSON                    | Firestore (Firebase)
                                     v                              v
                           +-----------------------+     +----------------------+
                           |  Python Flask Backend |     |  HARTI website       |
                           |  (ML Inference)       |     |  (PDF bulletins)     |
                           +-----------------------+     +----------------------+
                                     |
                                     v
                           +-----------------------+
                           |  Trained XGBoost      |
                           |  Models (joblib)      |
                           +-----------------------+
```

### 2.1 External Dependencies

| Dependency       | Purpose                                 | Integration Point                                        |
| ---------------- | --------------------------------------- | -------------------------------------------------------- |
| Firebase Auth    | User authentication (farmer + buyer)    | Frontend (`LoginScreen`, `SignUpScreen`)                 |
| Cloud Firestore  | User profiles, predictions, market data | Spring Boot services                                     |
| HARTI website    | Daily vegetable price PDF bulletins     | Spring Boot `HartiPriceService` (Jsoup + PDFBox)         |
| Open-Meteo API   | Weather forecasts + geocoding           | Python backend `_fetch_weather()`, frontend `weather.ts` |
| Python ML models | Yield & price prediction (XGBoost)      | Python backend `prediction_service.py`                   |

---

## 3. Component Architecture

### 3.1 Frontend (React Native / Expo)

**Location:** `apps/frontend/`

| Layer                   | Responsibility                         | Key Files                                                                                                                                                            |
| ----------------------- | -------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **App Shell**           | Navigation, auth gating, role routing  | `app/index.tsx`, `EntryScreen.tsx`, `LoadingScreen.tsx`                                                                                                              |
| **Screens**             | Top-level user-facing views            | `LoginScreen`, `SignUpScreen`, `HomeScreen`, `BuyerHomeScreen`, `WeatherScreen`, `MarketPricesScreen`, `YieldPredictionScreen`, `BuyersScreen`, `NotificationScreen` |
| **Feature Components**  | Reusable, themed UI per feature        | `components/dashboard/*`, `components/market/*`, `components/prediction/*`, `components/buyer/*`, `components/notifications/*`                                       |
| **API Clients**         | Typed REST clients with error handling | `lib/spring-api.ts`, `lib/prediction-api.ts`, `lib/weather.ts`                                                                                                       |
| **Notification Engine** | Local notification services            | `lib/notifications/*`                                                                                                                                                |
| **Hooks**               | Cross-cutting state                    | `hooks/useNotifications.ts`, shared hooks in root `hooks/`                                                                                                           |

**Design pattern:** Feature-first folder structure with per-feature `theme.ts` files enforcing consistent visual language. Each feature module is self-contained (types, components, theme) to allow parallel development.

### 3.2 Spring Boot Backend (Java)

**Location:** `apps/Backend/Spring_Backend/src/main/java/com/smartcrop/backend/`

| Service                      | Responsibility                          | Key Features                                                                               |
| ---------------------------- | --------------------------------------- | ------------------------------------------------------------------------------------------ |
| `HartiPriceService`          | Fetch & parse HARTI PDF price bulletins | Jsoup link scraping, PDFBox text extraction, regex price extraction, fallback URL guessing |
| `BuyerService`               | Buyer profile CRUD                      | Firestore, unique `BUY-YYYY-####` code generation                                          |
| `FarmerService`              | Farmer profile CRUD                     | Firestore, unique `FARM-YYYY-####` code generation, transactional counters                 |
| `FirestoreCollectionService` | Generic Firestore collection access     | Upsert, query, get across 12 collections                                                   |
| `YieldPredictionSaveService` | Persist ML predictions                  | Links prediction to farmer record                                                          |

**Backend surface:** 14+ REST controllers (Farmer, Buyer, YieldPrediction, MarketPrice, Crop, LandPlot, DemandRecord, HarvestPrediction, WeatherData, Message, Notification, FirestoreCollection, Health), 6 services, CORS config, Firebase config.

**Design pattern:** Controller → Service → Firestore layering. Firestore is the sole persistence layer, accessed via a generic collection service to avoid duplication.

### 3.3 Python Backend (Flask + ML)

**Location:** `apps/Backend/python_backend/`

| Component               | Responsibility                                    | Key Files                                                                                                |
| ----------------------- | ------------------------------------------------- | -------------------------------------------------------------------------------------------------------- |
| `app.py`                | Flask app routes, request validation, Tkinter GUI | `/health`, `/predict-yield`, `/predict-farm`, `/prediction-options`, `/farmers`, `/predict-farmer-yield` |
| `prediction_service.py` | Two-stage ML inference                            | `predict_farm()` → production → price → revenue                                                          |
| `yield_prediction.py`   | Single-model yield inference                      | `predict_yield()` with feature columns                                                                   |
| `train_models.py`       | Offline training pipeline                         | XGBoost training for both models                                                                         |
| Data scripts            | Dataset generation, EDA, model training           | `01_generate_data.py` … `04_model_price.py`, `predict.py`                                                |

**Two-stage prediction flow (`predict_farm`):**

1. **Model 1 (Yield):** `land_area_ha + fertilizer_kg + rainfall_mm + farmer_experience_yrs + crop + season + region + district + irrigation` → `production_kg`
2. **Model 2 (Price):** `production_kg + relative_supply + year + crop + season + region` → `price_rs_per_kg`
   - `relative_supply` = `production_kg / crop_median_production` (captures supply/demand elasticity)
3. **Revenue:** `production_kg × price_rs_per_kg`

**Design pattern:** Thin web layer over a service class. The service owns model loading (joblib, cached at module level) and exposes a clean inference API. Training is decoupled from serving.

---

## 4. Data Flow

### 4.1 Live Market Price Lookup

1. User opens `MarketPricesScreen`.
2. Frontend calls `spring-api.getLiveMarketPrices()` → `GET /api/market-prices/live`.
3. Spring Boot `HartiPriceService` scrapes HARTI bulletin links, downloads PDFs, parses with PDFBox, extracts crop names + prices with regex.
4. Frontend renders grouped categories via `CategoryAccordion` and `ProductBottomSheet`.

### 4.2 Yield & Price Prediction

1. User fills prediction form in `YieldPredictionScreen` (crop, season, region, district, irrigation, land area).
2. Weather is auto-filled from Open-Meteo via `weather.ts` (geocoding → forecast).
3. Frontend calls `prediction-api` → Python backend `POST /predict-farm`.
4. Python `prediction_service` loads XGBoost models, runs two-stage inference, returns `{ production_kg, price_rs_per_kg, revenue_rs, relative_supply, input }`.
5. Frontend renders `ResultCard` with breakdown.

### 4.3 Farmer Yield Prediction with Auto-Save

1. Python `POST /predict-farmer-yield` receives a `farmerId`.
2. Python fetches farmer + weather, builds yield payload, calls `predict_yield`.
3. Python POSTs the result to Spring Boot `POST /api/yield-predictions` → Firestore save.
4. Returns `{ farmer, input, predicted_yield, unit, savedPrediction }`.

---

## 5. Database / Persistence

SmartCrop uses **Cloud Firestore** (NoSQL document store) as its primary database.

### 5.1 Collections

| Collection            | Purpose              | Key Fields                                                                          |
| --------------------- | -------------------- | ----------------------------------------------------------------------------------- |
| `farmers`             | Farmer profiles      | full_name, email, region, total_land_area, experience_years, farmer_code            |
| `buyers`              | Buyer profiles       | full_name, email, region, buyer_type, preferred_crop, required_quantity, buyer_code |
| `yield_predictions`   | Saved ML predictions | farmer_id, crop_type, input, predicted_yield, unit                                  |
| `crops`               | Crop catalog         | crop_name, crop_type, season, region, expected_yield                                |
| `land_plots`          | Farm plots           | farmer_id, plot_name, region, district, area, soil_type, irrigation_type            |
| `market_prices`       | Saved market prices  | crop_name, market_name, region, price_per_kg, price_date                            |
| `demand_records`      | Demand tracking      | crop_name, region, market_name, demand_date, demand_score                           |
| `harvest_predictions` | Harvest forecasts    | farmer_id, plot_id, crop_name, predicted_harvest_date, predicted_yield              |
| `weather_data`        | Weather snapshots    | region, forecast_date, temperature, humidity, rainfall, wind_speed                  |
| `messages`            | User messaging       | sender_id, receiver_id, message_text, message_type, sent_at                         |
| `notifications`       | App notifications    | user_id, title, body, notification_type, read_status                                |
| `counters`            | Sequence counters    | year, sequence (for code generation)                                                |

### 5.2 ML Model Artefacts

Trained models persist as joblib files in `python_backend/models/`:

- `yield_prediction_model.joblib` + `yield_model_features.joblib`
- `price_prediction_model.joblib` + `price_model_features.joblib`
- `crop_median_production.joblib`

---

## 6. Security Architecture

| Concern          | Mitigation                                                                                                                                   |
| ---------------- | -------------------------------------------------------------------------------------------------------------------------------------------- |
| Authentication   | Firebase Auth (email/password) at the frontend; Spring Boot endpoints are public for CRUD in the dev phase                                   |
| API key storage  | `.env` (gitignored); `.env.example` documents keys without leaking secrets                                                                   |
| CORS             | `CorsConfig` in Spring Boot allows the Expo dev client origins                                                                               |
| Input validation | Python backend validates required fields and returns 400 with field-level errors; Spring validates DTOs via `spring-boot-starter-validation` |
| Firestore access | Collection allowlist enforced in `FirestoreCollectionService`                                                                                |

**Known gap (PR3):** Server-side Firebase token verification interceptor on Spring Boot. Currently the app relies on frontend auth gating.

---

## 7. Technology Stack Summary

| Tier                    | Technology                           | Version         |
| ----------------------- | ------------------------------------ | --------------- |
| Frontend                | React Native (Expo)                  | 0.81.5 / SDK 54 |
| Language (FE)           | TypeScript                           | 5.9.2           |
| Navigation              | React Navigation                     | 7.x             |
| State                   | Redux Toolkit                        | 2.x             |
| Auth (client)           | Firebase Auth                        | 12.12.0         |
| Backend (transactional) | Spring Boot                          | 3.4.4 (Java 17) |
| PDF parsing             | Apache PDFBox                        | 2.0.30          |
| HTML scraping           | Jsoup                                | 1.18.3          |
| Backend (ML)            | Python / Flask                       | 3.x             |
| ML                      | XGBoost, scikit-learn, pandas, numpy | —               |
| Database                | Cloud Firestore                      | managed         |
| External APIs           | Open-Meteo, HARTI                    | —               |
| Repo / CI               | Git + GitHub, Nx monorepo            | —               |

---

## 8. Changes Since PR1

| Area                | PR1 State               | PR2 State                                                     | Rationale                                        |
| ------------------- | ----------------------- | ------------------------------------------------------------- | ------------------------------------------------ |
| Prediction pipeline | Single yield model      | Two-stage production → price → revenue with `relative_supply` | Price needed supply elasticity; interpretability |
| Dataset             | Not yet generated       | 20,000 synthetic records anchored to DOA AgStat 2018          | No real farm-level microdata available           |
| Model selection     | Proposed                | 5 algorithms compared; XGBoost selected                       | R² / MAE / RMSE / MAPE evaluation                |
| HARTI integration   | Not integrated          | Live PDF scraper with fallback URL guessing                   | Real price data for market screen                |
| Weather             | Not integrated          | Open-Meteo geocoding + forecast + auto-fill                   | Prediction input convenience                     |
| Dashboards          | Single farmer dashboard | Farmer + Buyer role-based dashboards                          | Distinct user needs                              |
| People directory    | Not started             | Searchable buyer/farmer directory                             | Marketplace requirement                          |

---

## 9. Open Architectural Risks (PR3 Targets)

1. **Spring Boot auth interceptor** — server-side Firebase token verification planned.
2. **ML model versioning** — file-based; a version registry needed before production.
3. **HARTI scraping fragility** — PDF format changes could break parsing; fallback logic mitigates but needs monitoring.
4. **Synthetic data validation** — models trained on synthetic data; field validation with real harvest data needed.
5. **Notification scheduling on iOS** — background scheduling differences need platform-specific testing.

---

_End of document._
