# SmartCrop — Code Repository & Implementation Depth Evidence (PR2)

**Last Updated:** 2026-08-05
**Repository:** https://github.com/iduwara0013/FYP.git
**Branch:** `main`
**Latest commit:** `0d8585a`

---

## 1. Repository Overview

SmartCrop is developed in a single Git repository using an Nx-style monorepo layout. All three application tiers (React Native frontend, Spring Boot backend, Python ML backend) are version-aligned in the same repo, enabling atomic cross-tier changes.

### 1.1 Repository Statistics

| Metric          | Value                                       |
| --------------- | ------------------------------------------- |
| Repository      | https://github.com/iduwara0013/FYP.git      |
| Branch          | `main` (also `origin/main`)                 |
| Latest commit   | `0d8585a`                                   |
| Commits to date | 8 (from `f43ca37` first commit → `0d8585a`) |
| Remote          | GitHub (`origin`)                           |

### 1.2 Commit History

```
0d8585a  chnagers        (HEAD -> main, origin/main)
34e4667  changes
144f75c  changers
c8378c3  chnagers
b8e996d  changers
71f81b9  changers
add58f7  changers
f43ca37  first commit
```

---

## 2. Monorepo Structure (Nx)

```
FYP/
├── apps/
│   ├── frontend/                  # React Native (Expo) + TypeScript
│   │   ├── app/                   # App shell, routing
│   │   ├── components/            # Feature-first components (dashboard, market, prediction, buyer, notifications, screens)
│   │   ├── lib/                   # Typed API clients (spring-api, prediction-api, weather) + notification engine
│   │   ├── hooks/                 # useNotifications
│   │   ├── constants/             # Shared constants
│   │   ├── assets/                # Images, fonts
│   │   ├── .env / .env.example    # Environment config
│   │   ├── app.json               # Expo config
│   │   └── project.json           # Nx project config
│   └── Backend/
│       ├── Spring_Backend/        # Java / Spring Boot 3.4.4
│       │   ├── pom.xml            # Maven deps (Jsoup, PDFBox, Firebase Admin, validation)
│       │   ├── project.json       # Nx project config
│       │   └── src/main/java/com/smartcrop/backend/
│       │       ├── controller/    # 14+ REST controllers
│       │       ├── service/       # Farmer, Buyer, HartiPrice, FirestoreCollection, YieldPredictionSave
│       │       ├── config/        # FirebaseConfig, CorsConfig
│       │       └── dto/           # Request/response DTOs
│       └── python_backend/        # Python / Flask + XGBoost
│           ├── app.py             # Flask routes + Tkinter GUI
│           ├── requirements.txt   # Pinned deps
│           ├── sri_lanka_vegetable_dataset.csv  # 20,000-row dataset
│           ├── scripts/           # train_models.py
│           └── src/services/      # prediction_service.py, yield_prediction.py, models/
├── docs/                          # All project documentation (this set)
├── hooks/                         # Shared React Native hooks
├── libs/                          # Shared libraries
├── scripts/                       # Build / utility scripts
├── package.json                   # Workspace root
├── tsconfig.base.json
├── nx.json
└── app.json
```

---

## 3. Implementation Depth by Tier

### 3.1 Frontend (React Native / Expo / TypeScript)

**Location:** `apps/frontend/`

| Area                | Key Files                                                                  | Evidence of Depth                                                                                                             |
| ------------------- | -------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------- |
| App shell & routing | `app/index.tsx`, `EntryScreen.tsx`, `components/screens/LoadingScreen.tsx` | Auth gating + role routing (farmer/buyer) + animated splash                                                                   |
| Screens (9)         | `components/screens/*`                                                     | Login, SignUp, Home (farmer), BuyerHome, Weather, MarketPrices, YieldPrediction, Buyers, Notification                         |
| Dashboard module    | `components/dashboard/*`                                                   | 8 themed components (header, profile, weather card, quick actions, AI insight, carousel, info cards, floating nav)            |
| Market module       | `components/market/*`                                                      | 9 components (search, selector, summary, accordion, bottom sheet, skeleton, header, empty state, theme, types, report groups) |
| Prediction module   | `components/prediction/*`                                                  | 7 components (header, farm summary, input, selectors, button, result, skeleton)                                               |
| Buyer module        | `components/buyer/*`                                                       | Buyer components + theme                                                                                                      |
| Notification module | `components/notifications/*`, `lib/notifications/*`                        | Services (weather, market, daily tips, base), preferences, types, UI cards                                                    |
| API clients         | `lib/spring-api.ts`, `lib/prediction-api.ts`, `lib/weather.ts`             | Typed REST clients with error normalisation                                                                                   |
| Hooks               | `hooks/useNotifications.ts`                                                | Cross-cutting notification state                                                                                              |

**Depth indicators:**

- Per-feature `theme.ts` enforces visual consistency without a global design system.
- Typed API clients separate network concerns from UI.
- Role-based routing is data-driven, not hardcoded.
- Loading skeletons for every async screen.

### 3.2 Spring Boot Backend (Java)

**Location:** `apps/Backend/Spring_Backend/src/main/java/com/smartcrop/backend/`

| Service                      | Key Features                                                                |
| ---------------------------- | --------------------------------------------------------------------------- |
| `FarmerService`              | CRUD + `FARM-YYYY-####` code generation (transactional counters)            |
| `BuyerService`               | CRUD + `BUY-YYYY-####` code generation                                      |
| `HartiPriceService`          | HARTI PDF scraper: Jsoup links + PDFBox parse + regex extraction + fallback |
| `FirestoreCollectionService` | Generic collection access with allowlist                                    |
| `YieldPredictionSaveService` | Persists predictions linked to farmer                                       |

**Backend surface:** 14+ REST controllers, 6 services, CORS + Firebase config, DTO validation.

### 3.3 Python Backend (Flask + ML)

**Location:** `apps/Backend/python_backend/`

| File                                 | Purpose                                                                                                                                       |
| ------------------------------------ | --------------------------------------------------------------------------------------------------------------------------------------------- |
| `app.py`                             | Flask routes (`/health`, `/predict-yield`, `/predict-farm`, `/prediction-options`, `/farmers`, `/predict-farmer-yield`) + Tkinter desktop GUI |
| `src/services/prediction_service.py` | Two-stage inference (production → price → revenue) with joblib model caching                                                                  |
| `src/services/yield_prediction.py`   | Single-model yield inference                                                                                                                  |
| `scripts/train_models.py`            | Offline training pipeline                                                                                                                     |
| `sri_lanka_vegetable_dataset.csv`    | 20,000-row synthetic dataset                                                                                                                  |
| `requirements.txt`                   | Pinned deps (flask, xgboost, scikit-learn, pandas, numpy, joblib)                                                                             |

**ML pipeline scripts (source data):**

- `01_generate_data.py` — data generation & cleaning
- `02_eda_correlation.py` — exploratory data analysis
- `03_model_yield.py` — yield model training
- `04_model_price.py` — price model training
- `predict.py` — standalone inference demo

---

## 4. Configuration & Environment Management

| File                                           | Purpose                                                 |
| ---------------------------------------------- | ------------------------------------------------------- |
| `apps/frontend/.env` + `.env.example`          | Environment config (gitignored; example documents keys) |
| `apps/Backend/python_backend/requirements.txt` | Pinned Python deps                                      |
| `apps/Backend/Spring_Backend/pom.xml`          | Maven deps                                              |
| `package.json`                                 | Workspace root + script definitions                     |
| `tsconfig.base.json`                           | Shared TS config                                        |
| `nx.json`                                      | Nx monorepo config                                      |
| `eslint.config.js`                             | Linting rules                                           |
| `babel.config.js`                              | Babel config for React Native                           |

---

## 5. Code Quality Indicators

| Indicator                 | Status                                                    |
| ------------------------- | --------------------------------------------------------- |
| TypeScript                | ✅ Used across frontend                                   |
| ESLint                    | ✅ Configured                                             |
| `.gitignore`              | ✅ Present (excludes node_modules, .env, build artefacts) |
| `.env.example`            | ✅ Present (documents secrets without leaking)            |
| Typed API clients         | ✅ `spring-api.ts`, `prediction-api.ts`, `weather.ts`     |
| Error normalisation       | ✅ Uniform `{ error, missing_fields }` envelope on Python |
| Component size discipline | ✅ Most components <150 lines                             |
| Feature-level theming     | ✅ Per-feature `theme.ts`                                 |
| DTO validation            | ✅ Spring `spring-boot-starter-validation`                |
| Input validation (ML)     | ✅ Python returns 400 with field-level errors             |

---

## 6. How to Run

```bash
# Clone
git clone https://github.com/iduwara0013/FYP.git
cd FYP

# Frontend
cd apps/frontend
npm install
npx expo start

# Spring Boot
cd ../Backend/Spring_Backend
./mvnw spring-boot:run

# Python backend
cd ../python_backend
pip install -r requirements.txt
python app.py
```

---

## 7. Implementation Depth Summary

- **3 technology stacks** in one Nx monorepo.
- **9 screens** + **8 dashboard components** + **9 market components** + **7 prediction components**.
- **14+ Spring REST controllers**, **6 services**, **12 Firestore collections**.
- **6 Flask endpoints**, **2 XGBoost models**, **5-algorithm comparison**, **20,000-row dataset**.
- **3 external integrations**: Firebase (Auth + Firestore), HARTI (PDF scraping), Open-Meteo (weather + geocoding).
- **2-way backend integration** (Spring ↔ Python) with auto-save of predictions.

---

_End of document._
