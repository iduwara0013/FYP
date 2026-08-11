# SmartCrop — Testing Evidence (PR2)

**Last Updated:** 2026-08-05
**Scope:** Evidence of testing on completed modules through Progress Review 2.

---

## 1. Testing Strategy Overview

SmartCrop follows a layered testing approach appropriate for the PR2 stage (core modules complete, automated suites planned for final implementation):

| Layer                 | Tool / Method                                                        | Coverage Status |
| --------------------- | -------------------------------------------------------------------- | --------------- |
| ML Model Evaluation   | 5-algorithm comparison on 80/20 split                                | ✅ Complete     |
| API Testing (Manual)  | All REST endpoints (Spring + Flask) exercised via curl/Postman       | ✅ Complete     |
| Integration (Manual)  | Frontend ↔ Spring ↔ Python ↔ Firestore end-to-end                    | ✅ Manual       |
| UI Testing (Manual)   | Screen navigation, forms, validation, error/loading states on device | ✅ Manual       |
| HARTI Scraper Testing | Live PDF parsing + fallback logic                                    | ✅ Complete     |
| Weather API Testing   | Open-Meteo geocoding + forecast for Sri Lankan regions               | ✅ Complete     |
| Unit (Spring Boot)    | Test scope configured; service tests in progress                     | 🚧 In Progress  |

---

## 2. Machine Learning Model Testing

### 2.1 Dataset

- **20,000 synthetic records** anchored to real DOA AgStat 2018 values (yield t/ha, farmgate price Rs/kg).
- Realistic correlations preserved: `Production = land_area × yield_rate`; price responds to relative supply (elasticity −0.28) + 8% yearly inflation.
- Distributions: lognormal land area (smallholder-dominated), normal management/weather factors.

### 2.2 Model Selection (Algorithm Comparison)

| Algorithm                 | Yield Model    | Price Model    | Evaluated              |
| ------------------------- | -------------- | -------------- | ---------------------- |
| Linear Regression         | Included       | Included       | R² / MAE / RMSE / MAPE |
| Ridge                     | Included       | Included       | R² / MAE / RMSE / MAPE |
| Random Forest (300 trees) | Included       | Included       | R² / MAE / RMSE / MAPE |
| Gradient Boosting         | Included       | Included       | R² / MAE / RMSE / MAPE |
| **XGBoost (selected)**    | **✅ Best R²** | **✅ Best R²** | Final choice           |

**Evaluation setup:** `train_test_split(0.2, random_state=42)`, `StandardScaler` + `OneHotEncoder` in a sklearn ColumnTransformer Pipeline.

### 2.3 Yield Model (Model 1)

```
Features: land_area_ha, fertilizer_kg, rainfall_mm, farmer_experience_yrs,
          crop, season, region, district, irrigation
Target:   production_kg
Learned pattern: production scales with land area × yield rate (physical relationship)
Feature importance: land_area_ha > crop > irrigation > season > region
```

### 2.4 Price Model (Model 2)

```
Features: production_kg, relative_supply, year, crop, season, region
Target:   price_rs_per_kg
Learned pattern: negative elasticity (−0.28) — higher relative supply → lower price
Feature importance: crop identity > relative_supply > year (inflation)
```

**Key validation insight:** Within-crop production-price correlation is negative, confirming the elasticity relationship is captured correctly rather than an artefact of crop identity.

### 2.5 Inference Service Smoke Test

```bash
curl -X POST http://localhost:5000/predict-farm \
  -H "Content-Type: application/json" \
  -d '{
    "land_area_ha": 2.0,
    "crop": "Tomato",
    "season": "Maha",
    "region": "Up country",
    "district": "Nuwara Eliya",
    "irrigation": "Irrigated",
    "fertilizer_kg": 300.0,
    "rainfall_mm": 150.0,
    "farmer_experience_yrs": 10,
    "year": 2026
  }'
```

**Expected response (200):**

```json
{
  "production_kg": 24000.5,
  "price_rs_per_kg": 152.34,
  "revenue_rs": 3650000.0,
  "relative_supply": 0.85,
  "input": { ... }
}
```

**Result:** ✅ Passed — two-stage inference completes; models load from joblib; production → price chaining works.

### 2.6 Validation Case — Missing Fields

```bash
curl -X POST http://localhost:5000/predict-farm \
  -H "Content-Type: application/json" \
  -d '{"land_area_ha": 2.0}'
```

**Expected response (400):**

```json
{
  "error": "Missing required fields",
  "missing_fields": ["crop", "season", "region", "district", "irrigation"]
}
```

**Result:** ✅ Passed — field-level validation returns proper error.

---

## 3. Spring Boot Backend Testing

### 3.1 Endpoint Coverage Matrix (Manual)

| Method | Endpoint                  | Purpose               | Result                         |
| ------ | ------------------------- | --------------------- | ------------------------------ |
| GET    | `/health`                 | Health check          | ✅ 200                         |
| POST   | `/api/farmers`            | Create farmer profile | ✅ 201 + `FARM-2026-####` code |
| GET    | `/api/farmers`            | List farmers          | ✅ 200                         |
| GET    | `/api/farmers/by-email`   | Profile lookup        | ✅ 200 / 404 handling          |
| GET    | `/api/farmers/{id}`       | Get farmer by ID      | ✅ 200                         |
| POST   | `/api/buyers`             | Create buyer profile  | ✅ 201 + `BUY-2026-####` code  |
| GET    | `/api/buyers`             | List buyers           | ✅ 200                         |
| GET    | `/api/buyers/by-email`    | Profile lookup        | ✅ 200 / 404 handling          |
| GET    | `/api/buyers/{id}`        | Get buyer by ID       | ✅ 200                         |
| POST   | `/api/yield-predictions`  | Save prediction       | ✅ 201, Firestore doc created  |
| GET    | `/api/market-prices/live` | HARTI live prices     | ✅ 200, parsed entries         |
| GET    | `/api/market-prices`      | Bulletin archive      | ✅ 200                         |

### 3.2 HARTI Scraper Testing

| Test                   | Input                   | Result                                  |
| ---------------------- | ----------------------- | --------------------------------------- |
| Bulletin link scraping | HARTI daily price page  | ✅ Links extracted with Jsoup           |
| PDF download + parse   | Latest bulletin PDF     | ✅ Text extracted with PDFBox           |
| Regex price extraction | Parsed text             | ✅ Crop names + price columns extracted |
| Metadata filtering     | Raw PDF text            | ✅ Headers/footers filtered             |
| Fallback URL guessing  | Primary link fails      | ✅ Fallback date-based URL attempted    |
| Empty/format-change    | Simulated malformed PDF | ✅ Graceful error, no crash             |

### 3.3 Firestore CRUD Testing

| Test                | Collection         | Result                                    |
| ------------------- | ------------------ | ----------------------------------------- |
| Upsert              | `farmers`          | ✅ Document written with server timestamp |
| Query by field      | `farmers` → region | ✅ Filtered results                       |
| Get by ID           | `buyers`           | ✅ Single doc                             |
| Counter transaction | `counters`         | ✅ Sequential `FARM-2026-0001` codes      |

### 3.4 Spring ↔ Python Integration

| Flow                                                                       | Result                                          |
| -------------------------------------------------------------------------- | ----------------------------------------------- |
| Python `GET /farmers` → Spring `GET /api/farmers`                          | ✅ Returns farmer list                          |
| Python `POST /predict-farmer-yield` → Spring `POST /api/yield-predictions` | ✅ Prediction saved to Firestore                |
| `_fetch_weather()` via Open-Meteo                                          | ✅ Returns precipitation, temperature, humidity |

---

## 4. Frontend Testing (Manual / Device)

**Device:** Physical Android device via Expo dev client.
**Build:** `expo start` (Nx workspace).

### 4.1 Screen Navigation Matrix

| Screen                | Reaches | Loads Data               | Renders Without Error |
| --------------------- | ------- | ------------------------ | --------------------- |
| LoadingScreen         | ✅      | N/A                      | ✅                    |
| LoginScreen           | ✅      | N/A                      | ✅                    |
| SignUpScreen          | ✅      | N/A                      | ✅                    |
| HomeScreen (Farmer)   | ✅      | ✅ weather + predictions | ✅                    |
| BuyerHomeScreen       | ✅      | ✅ buyer data            | ✅                    |
| WeatherScreen         | ✅      | ✅ Open-Meteo            | ✅                    |
| MarketPricesScreen    | ✅      | ✅ HARTI prices          | ✅                    |
| YieldPredictionScreen | ✅      | ✅ Python ML             | ✅                    |
| BuyersScreen          | ✅      | ✅ buyer list            | ✅                    |
| NotificationScreen    | ✅      | ✅ scheduled list        | ✅                    |

### 4.2 Functional Test Cases

| ID    | Scenario              | Steps                         | Expected                                  | Result  |
| ----- | --------------------- | ----------------------------- | ----------------------------------------- | ------- |
| TC-01 | Farmer login          | Valid credentials → tap Login | Navigate to HomeScreen                    | ✅ Pass |
| TC-02 | Invalid login         | Wrong password                | Error toast                               | ✅ Pass |
| TC-03 | Sign-up as farmer     | Fill form → submit            | `FARM-2026-####` code returned            | ✅ Pass |
| TC-04 | Sign-up as buyer      | Fill form → submit            | `BUY-2026-####` code returned             | ✅ Pass |
| TC-05 | Profile lookup        | Login with existing email     | Profile loads from Firestore              | ✅ Pass |
| TC-06 | Prediction form       | Fill all fields → Predict     | Result card with production/price/revenue | ✅ Pass |
| TC-07 | Prediction validation | Submit with missing field     | Inline error                              | ✅ Pass |
| TC-08 | Auto weather fill     | Select region                 | Rainfall/temperature auto-populate        | ✅ Pass |
| TC-09 | Market prices         | Open Market screen            | Live HARTI prices render                  | ✅ Pass |
| TC-10 | Market search         | Type product name             | Filtered results                          | ✅ Pass |
| TC-11 | Product bottom sheet  | Tap product                   | Details sheet opens                       | ✅ Pass |
| TC-12 | Weather screen        | Open Weather tab              | Forecast renders                          | ✅ Pass |
| TC-13 | Buyer directory       | Open Buyers screen            | Buyer list renders w/ region filter       | ✅ Pass |
| TC-14 | Role routing          | Login as buyer                | BuyerHomeScreen loads                     | ✅ Pass |

### 4.3 Static Analysis

| Tool       | Command                  | Result                |
| ---------- | ------------------------ | --------------------- |
| TypeScript | `tsc --noEmit` (per app) | ✅ No type errors     |
| ESLint     | `npx eslint .`           | ✅ No blocking errors |

---

## 5. Integration / End-to-End Evidence

| Flow                                         | Components                               | Result        |
| -------------------------------------------- | ---------------------------------------- | ------------- |
| Signup → Profile save → Dashboard            | Firebase Auth → Spring → Firestore       | ✅ End-to-end |
| Prediction form → Auto weather → ML → Result | Frontend → Python → XGBoost → ResultCard | ✅ End-to-end |
| Market screen → HARTI scrape → Groups        | Frontend → Spring → Jsoup/PDFBox → UI    | ✅ End-to-end |
| Farmer yield auto-save                       | Python → Spring → Firestore              | ✅ End-to-end |

---

## 6. Known Defects / Gaps

| ID   | Description                                                       | Severity | Target               |
| ---- | ----------------------------------------------------------------- | -------- | -------------------- |
| D-01 | Spring Boot service-level automated unit tests still in progress  | Medium   | Final implementation |
| D-02 | HARTI PDF format changes could break parsing (fallback mitigates) | Low      | Monitoring           |
| D-03 | No automated integration test suite yet                           | Medium   | Final implementation |
| D-04 | iOS notification background scheduling not yet validated          | Low      | Final implementation |
| D-05 | Root README still default Expo template                           | Low      | Final implementation |

---

## 7. Next Testing Steps (Final Implementation)

- Expand Spring Boot unit tests for services.
- Add automated API test suite (Spring + Flask).
- K-fold cross-validation + residual analysis for ML models.
- User acceptance testing (UAT) with 5–10 farmers/buyers.
- Load testing prediction API under concurrent requests.
- Field validation: compare predictions vs actual harvest data.

---

_End of document._
