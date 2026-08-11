# SmartCrop — Working System Demonstration (PR2)

**Last Updated:** 2026-08-05
**Demonstration mode:** Live demo preferred; recorded video backup available.

---

## 1. Demonstration Overview

A working build of SmartCrop is demonstrated on a physical Android device via the Expo dev client. The demonstration covers all completed modules end-to-end. A screen recording is available as a backup in case of live network or device issues.

| Item         | Detail                                                    |
| ------------ | --------------------------------------------------------- |
| App build    | Expo (React Native) dev client                            |
| Device       | Physical Android phone                                    |
| Backends     | Spring Boot (Java) + Python Flask (ML) running locally    |
| Data sources | Firebase Auth, Firestore, HARTI, Open-Meteo               |
| Backup       | Screen recording (video) stored with project deliverables |

---

## 2. Prerequisites (Live Demo)

1. Start Spring Boot backend: `cd apps/Backend/Spring_Backend && ./mvnw spring-boot:run` (port 8080).
2. Start Python backend: `cd apps/Backend/python_backend && python app.py` (port 5000).
3. Ensure trained models exist in `python_backend/src/services/models/` (run `scripts/train_models.py` if missing).
4. Start Expo: `cd apps/frontend && npx expo start`.
5. Open the app on the device via Expo Go or dev client.
6. Verify Firebase Auth + Firestore credentials are configured in `.env`.

**Health checks:**

- Spring: `GET http://localhost:8080/health` → `{"status":"ok"}`
- Python: `GET http://localhost:5000/health` → `{"status":"ok","message":"Python backend is running."}`

---

## 3. Demonstration Script

### Scene 1: Onboarding (≈2 min)

1. Launch app → animated `LoadingScreen` resolves auth state.
2. Tap "Sign Up" → select role **Farmer**.
3. Fill name, phone, email, address, region, land area, experience.
4. Submit → profile created in Firestore with unique **`FARM-2026-####`** code.
5. User routed to **Farmer Dashboard**.

**Shows:** Firebase Auth, Firestore profile save, transactional code generation, role routing.

### Scene 2: Farmer Dashboard (≈2 min)

6. `HomeScreen` loads: greeting header, `ProfileCard`, live `WeatherCard` (Open-Meteo), `AIInsightCard`, `QuickActionGrid`, `PredictionCarousel` of recent predictions.
7. Tap each quick action → navigates to the corresponding screen.
8. Verify weather card shows live temperature and condition for the user's region.

**Shows:** Dashboard composition, live weather integration, navigation.

### Scene 3: Yield & Price Prediction (≈3 min)

9. Open Prediction tab → `YieldPredictionScreen`.
10. Select crop (e.g., Tomato), season (Maha), region (Up country), district (Nuwara Eliya), irrigation (Irrigated).
11. Enter land area (2.0 ha); rainfall/temperature auto-filled from live Open-Meteo weather.
12. Tap "Predict" → Python backend runs two-stage XGBoost inference.
13. `ResultCard` renders: **production (kg)**, **price (Rs/kg)**, **total revenue (Rs)**, **relative supply**.

**Shows:** End-to-end ML inference (frontend → Flask → XGBoost → result), auto weather-fill, two-stage pipeline.

### Scene 4: Market Prices (≈3 min)

14. Open Market tab → `MarketPricesScreen`.
15. `MarketSelector` picks the desired market.
16. `CategoryAccordion` renders grouped commodities with live HARTI prices.
17. Use `SearchBar` to filter products; tap a product → `ProductBottomSheet` opens with price details.

**Shows:** Spring Boot `HartiPriceService` (Jsoup + PDFBox scraping), live data, bottom-sheet UX.

### Scene 5: Weather (≈1.5 min)

18. Open Weather tab → current conditions + region geocoding.
19. Show temperature, humidity, precipitation from Open-Meteo.

**Shows:** Hyperlocal weather integration.

### Scene 6: Buyer Marketplace / People Directory (≈2 min)

20. Open Buyers tab → searchable list of buyers with region filter, role badges, contact details.
21. Tap a buyer → profile detail with organisation and preferred crop.

**Shows:** People directory, region filtering, contact access.

### Scene 7: Buyer Role (≈2 min)

22. Log out → log in / sign up as **Buyer**.
23. `BuyerHomeScreen` loads (not the farmer dashboard).
24. Show buyer-specific dashboard: market insight, today's market prices, buyer summary tiles, recommended farmers, activity timeline.

**Shows:** Role-based routing and the buyer experience.

### Scene 8: Notifications (if available; ≈1.5 min)

25. Open Notifications tab → list of scheduled notifications.
26. Show weather alert and daily-tip scheduling (local expo-notifications).

**Shows:** Notification engine.

---

## 4. Total Demonstration Time

≈ 17 minutes, including Q&A buffer.

---

## 5. Backup Plan

If a live demo cannot run (network, device, API outage):

- Play the pre-recorded screen capture (video) covering all 8 scenes.
- The recording is narrated and highlights the same integration points.
- Source code is available on GitHub for live inspection: https://github.com/iduwara0013/FYP.git

---

## 6. Key Integration Points Demonstrated

| Integration                                   | Demonstrated In | Evidence                                         |
| --------------------------------------------- | --------------- | ------------------------------------------------ |
| Firebase Auth                                 | Scene 1, 7      | Login + signup + role routing                    |
| Firestore                                     | Scene 1, 3, 6   | Profile save, prediction persistence, buyer list |
| Spring Boot (`FarmerService`, `BuyerService`) | Scene 1, 6      | CRUD + code generation                           |
| HARTI PDF scraper                             | Scene 4         | Live market prices                               |
| Python Flask ML API                           | Scene 3         | Two-stage XGBoost inference                      |
| Open-Meteo                                    | Scene 2, 3, 5   | Weather card + auto-fill + weather screen        |
| Cross-backend (Spring ↔ Python)               | Scene 3         | Prediction auto-save flow                        |

---

_End of document._
