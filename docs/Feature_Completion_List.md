# SmartCrop — Feature Completion List (PR2)

**Target completion at PR2:** 75%
**Last Updated:** 2026-08-05

---

## Summary Table

| Status         | Count  | %        |
| -------------- | ------ | -------- |
| ✅ Completed   | 22     | 62%      |
| 🚧 In Progress | 5      | 14%      |
| ⏳ Remaining   | 9      | 24%      |
| **Total**      | **36** | **100%** |

**Overall weighted completion: ~75%** (core modules complete; remaining work is secondary features, hardening, and polish).

---

## ✅ Completed Features

### Authentication & Onboarding

1. **Farmer Login** — Firebase Auth email/password with error handling (`LoginScreen.tsx`).
2. **Farmer Sign-Up** — Registration with role selection (`SignUpScreen.tsx`).
3. **Buyer Sign-Up & Login** — Dual-role registration with buyer-specific fields.
4. **Role-based Routing** — Farmer vs Buyer home routing on auth state + Firestore role lookup (`app/index.tsx`).
5. **Loading/Splash Screen** — Branded animated splash that resolves auth state before routing (`LoadingScreen.tsx`).

### Profile & People

6. **Farmer Profile Completion** — name, phone, region, land area, experience; unique `FARM-YYYY-####` code generation.
7. **Buyer Profile Completion** — organization, preferred crop, required quantity; unique `BUY-YYYY-####` code generation.
8. **Profile View Screen** — Saved profile retrieval by email from Spring Boot.
9. **People Directory (Buyers/Farmers)** — Searchable list with region filtering and role badges (`BuyersScreen.tsx`).

### Dashboards

10. **Farmer Dashboard** — greeting header, profile card, live weather card, AI insight card, quick actions grid, market preview, prediction carousel, farm summary tiles (`HomeScreen.tsx` + `components/dashboard/*`).
11. **Buyer Dashboard** — buyer header, profile card, weather card, market insight, quick actions, today's market prices, buyer summary tiles, recommended farmers, activity timeline, tip card (`BuyerHomeScreen.tsx`).

### Yield & Price Prediction (ML)

12. **Two-stage ML Pipeline** — Production → Price → Revenue prediction using two XGBoost models (`prediction_service.py`).
13. **Prediction Input Form** — crop/season/region/district dropdowns, irrigation chips, land area/fertilizer/rainfall/experience inputs with auto weather-fill (`YieldPredictionScreen.tsx`, `components/prediction/*`).
14. **Prediction Result Card** — production (kg), price (Rs/kg), total revenue (Rs), relative supply indicator (`ResultCard.tsx`).
15. **Prediction Options API** — `GET /prediction-options` serves valid crops, regions, districts, seasons, irrigation types.
16. **Prediction Persistence** — Saved to Firestore `yield_predictions` via Spring Boot (`POST /api/yield-predictions`).

### Market Prices

17. **Live HARTI Market Prices** — PDF bulletin scraping with Jsoup + PDFBox, fallback URL guessing (`HartiPriceService.java`).
18. **Market Prices Screen** — search bar, category/sort filters, accordion, product bottom sheet, bulletin archive (`MarketPricesScreen.tsx`, `components/market/*`).

### Weather

19. **Live Weather Integration** — Open-Meteo geocoding + forecast; auto-fills rainfall for predictions (`weather.ts`, `WeatherScreen.tsx`).

### Backend Services

20. **Spring Boot REST API** — 14+ controllers, 6 services, Firestore CRUD, CORS config, health check.
21. **Python Flask ML API** — `/health`, `/predict-yield`, `/predict-farm`, `/prediction-options`, `/farmers`, `/predict-farmer-yield`.
22. **ML Training Pipeline** — 20,000-record synthetic dataset from DOA AgStat anchors; 5-algorithm comparison; XGBoost selected (`train_models.py`, `01_generate_data.py`, `02_eda_correlation.py`, `03_model_yield.py`, `04_model_price.py`).

---

## 🚧 In Progress

23. **Notification Engine** — Base service, weather alerts, daily tips implemented; market threshold alert UI + preferences screen partial (`lib/notifications/*`, `NotificationScreen.tsx`).
24. **Buyer–Farmer Messaging** — Data model drafted; real-time chat not yet implemented.
25. **Spring Boot Automated Unit Tests** — Test scope configured (`spring-boot-starter-test`); service-level tests in progress.
26. **API Documentation** — Inline docstrings only; OpenAPI/Swagger generation in progress.
27. **README (root)** — Currently default Expo template; being rewritten for the full monorepo.

---

## ⏳ Remaining

28. **Crop Recommendation Engine** — AI-powered crop suggestions by soil/region/season (High priority).
29. **Push Notifications (FCM)** — Remote push to complement local scheduling.
30. **In-app Messaging** — Full farmer–buyer chat with real-time sync.
31. **Demand Forecasting Module** — UI for existing `demand_records` collection.
32. **Land Plot Management** — UI for existing `land_plots` collection with GPS.
33. **Harvest Prediction Calendar** — Calendar view of predicted harvest dates.
34. **Multi-language Support** — Sinhala/Tamil localisation.
35. **Offline Mode / Local Caching** — Last-known prices and weather for low-connectivity.
36. **Admin Web Dashboard** — Data management, bulletin overrides, tip content.

---

## Module Completion Breakdown

| Module                        | Completed | In Progress | Remaining | Module % |
| ----------------------------- | --------- | ----------- | --------- | -------- |
| Auth & Onboarding             | 5         | 0           | 0         | 100%     |
| Profile & People              | 4         | 0           | 1         | 80%      |
| Dashboards                    | 2         | 0           | 0         | 100%     |
| Yield & Price Prediction (ML) | 5         | 0           | 1         | 83%      |
| Market Prices                 | 2         | 0           | 1         | 67%      |
| Weather                       | 1         | 0           | 1         | 50%      |
| Backend Services              | 2         | 2           | 2         | 40%      |
| Notifications                 | 1         | 1           | 1         | 33%      |
| Messaging                     | 0         | 1           | 1         | 0%       |
| Admin / Ops                   | 0         | 0           | 2         | 0%       |
| **Total**                     | **22**    | **5**       | **9**     | **~75%** |

---

## Priority Order for Remaining Work

| Priority | Item                             | Target               |
| -------- | -------------------------------- | -------------------- |
| High     | Crop Recommendation Engine       | Final Implementation |
| Medium   | Push Notifications (FCM)         | Final Implementation |
| Medium   | In-app Messaging                 | Final Implementation |
| Medium   | Demand Forecasting UI            | Final Implementation |
| Medium   | Automated Unit/Integration Tests | Final Implementation |
| Low      | Land Plot Management UI          | Final Implementation |
| Low      | Multi-language Support           | Final Implementation |
| Low      | Offline Mode                     | Final Implementation |
| Low      | Admin Web Dashboard              | Future               |

---

_End of document._
