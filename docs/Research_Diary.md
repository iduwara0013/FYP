# SmartCrop — Updated Research Diary (PR2)

**Last Updated:** 2026-08-05
**Period covered:** Project initiation → Progress Review 2

---

## Week 1–4 — Literature Review & Proposal

- Finalised the project title: _Smart Crop Forecasting System — AI-powered yield & price prediction, live market prices, and farmer–buyer marketplace for Sri Lankan vegetable farmers_.
- Reviewed literature on precision agriculture, ML-based yield prediction, and commodity price modelling.
- Identified the core research question: _Can ML models trained on farm-level features accurately predict vegetable production and farmgate price, and can a mobile app deliver these predictions to Sri Lankan farmers in a usable way?_
- Chose a three-tier polyglot architecture (React Native + Spring Boot + Python/Flask) after evaluating single-stack alternatives.
- Set up the Nx monorepo with three apps.

**Key decision:** Monorepo (`apps/frontend`, `apps/Backend/Spring_Backend`, `apps/Backend/python_backend`) for version-aligned cross-tier commits.

---

## Week 5–8 — Requirements & Design

- Completed functional requirement analysis (FR-1 … FR-20) covering auth, prediction, market prices, weather, marketplace, and data management.
- Defined non-functional requirements (NFR-1 … NFR-9) for performance, availability, scalability, security, usability, reliability, maintainability, interoperability, portability.
- Designed the Firestore document model (12 collections) with transactional counters for code generation.
- Chose Firebase Auth (frontend) + Firebase Admin SDK (backend) + Firestore as the persistence layer.

**Reflection:** Early decision to use Firestore (serverless NoSQL) avoided schema migration overhead and let the backend focus on business logic.

---

## Week 9–10 — Data Generation & EDA

- Discovered **no public farm-level microdata** for Sri Lankan vegetables — a core research challenge.
- Generated a **20,000-record synthetic dataset** anchored to DOA AgStat Volume XV (2018):
  - Physical relationship: production = land area × yield rate.
  - Economic relationship: negative price elasticity (−0.28) + 8% yearly inflation.
- Ran EDA (`02_eda_correlation.py`): correlation heatmap, land-area-vs-production scatter, production-vs-price scatter coloured by crop.

**Key insight:** Production vs land area is strongly linear (physical scaling); price vs production is negative _within_ crop but positive across crops (crop identity dominates).

---

## Week 11–12 — ML Model Training & Evaluation

- Compared 5 algorithms (Linear, Ridge, RandomForest, GradientBoosting, XGBoost) on an 80/20 split with StandardScaler + OneHotEncoder pipeline.
- Evaluated R², MAE, RMSE, MAPE. **XGBoost selected** for both models.
- Designed the **two-stage pipeline**:
  1. Yield model: land + crop + season + region + district + irrigation + fertilizer + rainfall + experience → production_kg
  2. Price model: production_kg + relative_supply + year + crop + season + region → price_rs_per_kg
- Introduced `relative_supply` = production / crop_median_production to capture supply/demand elasticity.

**Key insight:** Feature engineering (`relative_supply`) improved price generalisation more than any algorithm choice. Land area dominates production; crop identity dominates price.

---

## Week 13–16 — Backend Development

### Spring Boot (Weeks 13–16)

- Implemented FarmerService and BuyerService with CRUD and transactional `FARM-YYYY-####` / `BUY-YYYY-####` code generation.
- Implemented `HartiPriceService` — Jsoup link scraping + PDFBox text extraction + regex price parsing + fallback URL guessing.
- Implemented generic `FirestoreCollectionService` with a collection allowlist.
- 14+ REST controllers covering all collections.

**Challenge:** Firebase Admin SDK integration — solved with conditional bean loading + env-based credentials.

### Python Flask (Weeks 13–15)

- Built `app.py` with 6 endpoints: `/health`, `/predict-yield`, `/predict-farm`, `/prediction-options`, `/farmers`, `/predict-farmer-yield`.
- Wrapped the two-stage inference in `prediction_service.py` with joblib model caching.
- Added a Tkinter desktop GUI (`FarmerPredictionApp`) as an admin tool.

**Challenge:** Cross-backend communication — solved with Spring RestTemplate (Spring → Python) and Python urllib (Python → Spring).

---

## Week 16–20 — Mobile App Frontend

- Built auth flow (login, signup, role selection) with Firebase Auth and an animated loading screen.
- Built farmer and buyer dashboards with themed, componentised UI.
- Built yield prediction screen with auto weather-fill from Open-Meteo and result cards (production/price/revenue).
- Built market prices screen with HARTI live data, search, category accordion, product bottom sheet.
- Built weather screen and people directory.

**Key decisions:**

- Per-feature `theme.ts` for visual consistency without a global design system.
- Typed API clients (`spring-api.ts`, `prediction-api.ts`, `weather.ts`) to separate network concerns from UI.
- Loading skeletons and error states for every async screen.

**Challenge:** Auto weather-fill — solved with Open-Meteo geocoding (region → coordinates) + forecast API (rainfall, temperature, humidity).

---

## Week 20–21 — Integration, Testing & PR2

- Verified end-to-end flows:
  - Signup → profile save → dashboard (Firebase Auth → Spring → Firestore).
  - Prediction form → auto weather → Python ML → result card.
  - Market screen → HARTI scrape → grouped prices.
  - Python → Spring yield-prediction auto-save.
- Performed ML model evaluation, API smoke tests, screen navigation tests, and static analysis (TS, ESLint).
- Identified remaining gaps: crop recommendation engine, FCM push, in-app messaging, demand forecasting UI, automated test suites, auth interceptor, i18n, offline mode.

**Reflection:** The two-stage pipeline and `relative_supply` feature are the strongest research contributions so far. The document set for PR2 is now complete.

---

## Lessons Learned (Cumulative)

1. **Synthetic data can be effective** when anchored to real statistics and designed with domain knowledge.
2. **Two-stage modeling is more interpretable** than a single end-to-end model.
3. **Feature engineering matters more than model choice.**
4. **PDF scraping is fragile** — always implement fallback strategies.
5. **Polyglot backends are fine with good contracts.**
6. **Auto-filling inputs from live data** improves trust and usability.
7. **Role-based routing from day one** avoids reworking the app shell.
8. **Mobile UI polish** significantly improves perceived performance.
9. **Firestore transactions are essential** for atomic counter operations (code generation).
10. **Monorepo tooling (Nx)** simplifies multi-technology projects but requires careful configuration.

---

## Next Steps (Final Implementation)

- Crop recommendation engine (soil/region/season).
- Push notifications (FCM) + in-app messaging.
- Demand forecasting UI.
- Automated unit + integration test suites.
- Server-side auth interceptor.
- Sinhala/Tamil i18n + offline mode.
- UAT with farmers/buyers.
- Final report and presentation.

---

_End of diary._
