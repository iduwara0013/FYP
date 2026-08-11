# SmartCrop — Updated Project Plan (Progress vs. Milestones)

**Last Updated:** 2026-08-05
**Review Point:** Progress Review 2 (PR2) — 75% completion gate

---

## 1. Milestone Overview

| #   | Milestone                                        | Planned Date | Actual      | Status         | Completion       |
| --- | ------------------------------------------------ | ------------ | ----------- | -------------- | ---------------- |
| M1  | Project proposal approved                        | Week 4       | On time     | ✅ Done        | 100%             |
| M2  | System design & architecture finalized           | Week 8       | On time     | ✅ Done        | 100%             |
| M3  | Synthetic dataset generated (20,000 records)     | Week 10      | On time     | ✅ Done        | 100%             |
| M4  | ML models trained & evaluated (XGBoost selected) | Week 12      | On time     | ✅ Done        | 100%             |
| M5  | Spring Boot backend + Firestore integration      | Week 16      | On time     | ✅ Done        | 100%             |
| M6  | Python Flask ML API deployed                     | Week 15      | On time     | ✅ Done        | 100%             |
| M7  | HARTI live price scraper implemented             | Week 16      | On time     | ✅ Done        | 100%             |
| M8  | Mobile app core screens complete                 | Week 20      | On time     | ✅ Done        | 100%             |
| M9  | **PR2 Presentation**                             | **Week 21**  | **On time** | **✅ Current** | **~75% overall** |
| M10 | Crop recommendation engine                       | Week 23      | Planned     | ⏳ Pending     | 0%               |
| M11 | User acceptance testing + feedback               | Week 24      | Planned     | ⏳ Pending     | 0%               |
| M12 | Final report & presentation                      | Week 26      | Planned     | 🔄 In progress | 0%               |

---

## 2. Gantt-Style Timeline

| Phase                          | Weeks | Status           |
| ------------------------------ | ----- | ---------------- |
| Literature review & proposal   | 1–4   | ✅ Complete      |
| Requirement analysis & design  | 5–8   | ✅ Complete      |
| Data generation & EDA          | 9–10  | ✅ Complete      |
| ML model training & evaluation | 11–12 | ✅ Complete      |
| Spring Boot backend            | 13–16 | ✅ Complete      |
| Python Flask ML backend        | 13–15 | ✅ Complete      |
| Mobile app frontend            | 14–20 | ✅ Core complete |
| Integration & testing          | 21–22 | 🔄 In progress   |
| Crop recommendation engine     | 21–23 | ⬜ Pending       |
| User feedback & UAT            | 23–24 | ⬜ Pending       |
| Final report & presentation    | 24–26 | 🔄 In progress   |

---

## 3. Detailed Progress by Workstream

### 3.1 Frontend (React Native / Expo)

| Task                            | Status | Notes                                                     |
| ------------------------------- | ------ | --------------------------------------------------------- |
| Project scaffolding (Nx + Expo) | ✅     | Monorepo with 3 apps                                      |
| Login / SignUp (Firebase Auth)  | ✅     | Role selection farmer/buyer                               |
| Loading/Splash screen           | ✅     | Auth resolution before routing                            |
| Farmer dashboard                | ✅     | Weather card, quick actions, AI insight, carousel         |
| Buyer dashboard                 | ✅     | Buyer-specific tiles, market insight, recommended farmers |
| Yield prediction screen         | ✅     | Auto weather fill, result card                            |
| Market prices screen            | ✅     | HARTI live prices, search, accordion, bottom sheet        |
| Weather screen                  | ✅     | Open-Meteo geocoding + forecast                           |
| People directory                | ✅     | Searchable buyer/farmer list, region filter               |
| Notifications                   | 🚧     | Base + weather + daily tips; market alerts UI pending     |
| Profile completion/view         | ✅     | Farmer + buyer profiles with codes                        |
| Offline mode / i18n             | ⬜     | Planned for final implementation                          |

### 3.2 Spring Boot Backend (Java)

| Task                                        | Status | Notes                                            |
| ------------------------------------------- | ------ | ------------------------------------------------ |
| Project setup (Spring Boot 3.4.4 / Java 17) | ✅     | Maven + Nx                                       |
| FarmerService (CRUD + code gen)             | ✅     | `FARM-YYYY-####` via transactional counters      |
| BuyerService (CRUD + code gen)              | ✅     | `BUY-YYYY-####` via transactional counters       |
| HartiPriceService (PDF scraper)             | ✅     | Jsoup + PDFBox + fallback URL guessing           |
| FirestoreCollectionService (generic)        | ✅     | Collection allowlist, upsert/query/get           |
| YieldPredictionSaveService                  | ✅     | Prediction persistence                           |
| 14+ REST controllers                        | ✅     | Full API surface                                 |
| Automated unit tests                        | 🚧     | Test scope configured; service tests in progress |
| Auth interceptor (token verification)       | ⬜     | Known gap; frontend-gated only                   |

### 3.3 Python ML Backend (Flask)

| Task                                    | Status | Notes                                              |
| --------------------------------------- | ------ | -------------------------------------------------- |
| Data generation (`01_generate_data.py`) | ✅     | 20,000 synthetic records                           |
| EDA (`02_eda_correlation.py`)           | ✅     | Correlations, visualizations                       |
| Yield model (`03_model_yield.py`)       | ✅     | XGBoost selected                                   |
| Price model (`04_model_price.py`)       | ✅     | XGBoost with `relative_supply`                     |
| Flask API (`app.py`)                    | ✅     | 6 endpoints                                        |
| Prediction service                      | ✅     | Two-stage inference (production → price → revenue) |
| Tkinter desktop GUI                     | ✅     | Admin prediction tool                              |
| Auto weather fill                       | ✅     | Open-Meteo geocoding → rainfall/temperature        |
| Model versioning                        | ⬜     | File-based (joblib); registry planned              |
| Auto-retrain pipeline                   | ⬜     | Manual retraining currently                        |

### 3.4 Database (Firestore)

| Task                                | Status | Notes                           |
| ----------------------------------- | ------ | ------------------------------- |
| Farmers collection                  | ✅     | Profile + code                  |
| Buyers collection                   | ✅     | Profile + code                  |
| Yield predictions                   | ✅     | Saved ML results                |
| Crops, land_plots, market_prices    | ✅     | Collections defined             |
| Demand_records, harvest_predictions | ✅     | Collections defined, UI pending |
| Messages, notifications             | ✅     | Collections defined             |
| Counters (transactional)            | ✅     | Sequential code generation      |
| Weather_data                        | ✅     | Snapshots                       |

---

## 4. Sprint Burn (PR2 Window)

| Sprint | Period      | Planned                         | Delivered                       | Status   |
| ------ | ----------- | ------------------------------- | ------------------------------- | -------- |
| S1     | Weeks 13–14 | Spring Boot backend + Firestore | ✅ Farmer/Buyer CRUD + codes    | On track |
| S2     | Weeks 14–15 | Flask ML API + model serving    | ✅ 6 endpoints + joblib models  | On track |
| S3     | Weeks 15–16 | HARTI scraper                   | ✅ Live PDF parsing + fallback  | On track |
| S4     | Weeks 16–18 | Mobile app core screens         | ✅ Auth, dashboards, prediction | On track |
| S5     | Weeks 18–20 | Market prices, weather, people  | ✅ All screens functional       | On track |
| S6     | Weeks 20–21 | Integration + PR2 prep          | ✅ E2E flows + docs             | On track |

**Velocity:** Consistent ~2 major deliverables per sprint. No re-baselining required this review.

---

## 5. Remaining Schedule (PR3 / Final Implementation)

| Weeks | Task                                                     | Effort |
| ----- | -------------------------------------------------------- | ------ |
| 21–22 | Integration testing, bug fixes, performance optimization | M      |
| 21–22 | Automated unit + integration test suites                 | M      |
| 22–23 | Crop recommendation engine                               | L      |
| 23–24 | Push notifications (FCM)                                 | M      |
| 23–24 | In-app messaging (farmer–buyer)                          | M      |
| 23–24 | User acceptance testing, feedback collection             | M      |
| 24–25 | Final report writing, documentation finalization         | L      |
| 25–26 | Final presentation preparation & submission              | S      |

_Effort: S = small, M = medium, L = large._

---

## 6. Risk Register (Updated)

| Risk                                      | Likelihood | Impact | Mitigation                          |
| ----------------------------------------- | ---------- | ------ | ----------------------------------- |
| HARTI PDF format changes                  | Medium     | High   | Fallback URL guessing + monitoring  |
| Synthetic data → real-world drift         | Medium     | Medium | Field validation in final phase     |
| Scope creep (messaging, crops rec engine) | Medium     | Medium | Prioritise; defer low-value items   |
| iOS notification differences              | Medium     | Low    | Platform-specific testing           |
| Spring auth verification gap              | Medium     | Medium | Interceptor in final implementation |
| Firestore free-tier limits                | Low        | Medium | Monitor usage                       |

---

## 7. Progress Commentary

**PR2 achieved ~75% overall completion.** The core value chain is fully functional: farmer registers → profile saved → dashboard loads → prediction (weather auto-filled) → result (production/price/revenue) → persisted to Firestore; market prices scraped live from HARTI; dual-role dashboards operational. Remaining work is concentrated in secondary features (crop recommendations, messaging, demand forecasting UI), hardening (automated tests, auth interceptor), and polish (i18n, offline).

---

_End of document._
