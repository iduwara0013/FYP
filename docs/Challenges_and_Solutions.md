# SmartCrop — Challenges & Solutions (PR2)

**Last Updated:** 2026-08-05

---

## 1. Technical Challenges

### TC-1: HARTI PDF Parsing — Unstructured Bulletin Text

**Challenge:**
HARTI publishes daily vegetable prices as PDF bulletins. The PDF text contains mixed Sinhala/English, inconsistent formatting, and unnecessary metadata lines (headers, footers, announcements). Extracting clean crop names and price columns required significant custom parsing.

**Solution:**

- Used **Jsoup** to scrape bulletin download links from `harti.gov.lk/daily-price.php`.
- Used **Apache PDFBox** to extract raw text from the downloaded PDF.
- Applied a **regex-based price extraction** pipeline with metadata line filtering.
- Cleaned crop names (normalising whitespace, trimming units, removing duplicates).
- Added **fallback URL guessing** — if the primary bulletin link fails, the service attempts date-pattern URLs so the market screen stays available.

**Outcome:** Market Prices screen loads live HARTI data reliably. Fallback logic prevents a single bulletin failure from breaking the screen.

---

### TC-2: No Real Farm-Level Dataset for Sri Lankan Vegetables

**Challenge:**
There is no publicly available farm-level microdata for Sri Lankan vegetable production (fertilizer, irrigation, experience, per-farm yield). This made supervised ML training impossible with real data alone.

**Solution:**

- Generated a **20,000-record synthetic dataset** anchored to **DOA AgStat Volume XV (2018)** real anchor values:
  - Table 5.1: Extent, Production and Average Yield of Vegetables (Maha 2016/17 & Yala 2017)
  - Table 5.4.1: Farmgate and Retail Prices of Vegetables — All Island
  - Table 5.4.2 (HARTI): Wholesale Prices of Vegetables
- Preserved **physical relationships** (production = land area × yield rate) and **economic relationships** (negative price elasticity −0.28, 8% yearly inflation).
- Used lognormal land-area distribution (smallholder-dominated) and normal noise for management/weather factors.

**Outcome:** A realistic, reproducible dataset that supports meaningful ML experimentation. Documented in `01_generate_data.py`.

---

### TC-3: Firebase Admin SDK + Spring Boot Integration Complexity

**Challenge:**
Integrating the Firebase Admin SDK into Spring Boot required conditional bean loading, credentials via environment variables, and careful handling of the service-account JSON.

**Solution:**

- Implemented **conditional Firestore bean loading** — the bean activates only when credentials are present.
- Credentials provided via **environment variables** (JSON string or file path), keeping secrets out of source control.
- Added a **collection allowlist** in `FirestoreCollectionService` so only expected collections are accessible through the generic endpoint.

**Outcome:** Clean, secure Firestore integration with no credential leaks. Documented in `.env.example`.

---

### TC-4: Cross-Backend Communication (Spring ↔ Python)

**Challenge:**
The system needs Spring Boot for transactional CRUD and Python for ML inference. Coordinating two backends with different runtimes, ports, and error shapes created integration friction.

**Solution:**

- Spring uses **RestTemplate** to proxy to Python `/predict-yield` where needed.
- Python uses **urllib** to call Spring `/api/farmers` and `/api/yield-predictions`.
- Both backends expose a **`/health`** endpoint for availability monitoring.
- Frontend uses two typed clients — `spring-api.ts` (Java) and `prediction-api.ts` (Python) — each with its own base URL from `.env`.

**Outcome:** Both backends interoperate in the `predict-farmer-yield` flow (Python fetches farmer → predicts → saves via Spring → Firestore).

---

### TC-5: Expo + Firebase Auth Client Setup

**Challenge:**
Setting up Firebase Auth on the Expo client required the `firebase/auth` client SDK alongside the Firebase Admin SDK on the backend — two different SDK surfaces with different configuration.

**Solution:**

- Frontend uses `firebase/auth` client SDK for login/signup and auth-state observation (`onAuthStateChanged`).
- Backend uses Firebase Admin SDK for Firestore CRUD (no auth verification in dev phase).
- Kept auth config in `.env` and documented in `.env.example`.

**Outcome:** Seamless client auth with role capture at sign-up; role stored with the profile.

---

### TC-6: Price Prediction Generalization — Absolute Production is Crop-Dependent

**Challenge:**
A single price model trained on absolute production fails to generalise across crops because 40,000 kg of pumpkin is not comparable to 40,000 kg of capsicum. Within-crop price responses to supply differ.

**Solution:**

- Introduced the **`relative_supply`** feature: `production_kg / crop_median_production`.
- This normalises production to the crop's typical level, capturing **supply/demand elasticity** regardless of crop scale.
- Confirmed negative elasticity (−0.28) in validation: higher relative supply → lower price.

**Outcome:** Price model R² improved significantly; within-crop production-price correlation is now correctly negative.

---

### TC-7: Monorepo Build Orchestration (Expo + Spring + Python)

**Challenge:**
Orchestrating a React Native app, a Maven Spring Boot project, and a Python Flask service in one repository with different build tools was complex.

**Solution:**

- Used **Nx workspace** (`nx.json`, `project.json` per app) with scripts:
  - `serve:spring`
  - `serve:python`
  - `start:frontend`
- Each app pins its own dependencies via `package.json` / `pom.xml` / `requirements.txt`.

**Outcome:** One-command startup per tier; clean separation; version-aligned monorepo.

---

### TC-8: Weather Auto-Fill for Prediction

**Challenge:**
The prediction form requires rainfall and temperature, but farmers may not know these values. Manually entering them is error-prone and reduces trust.

**Solution:**

- Used **Open-Meteo geocoding API** to resolve the farmer's region to coordinates.
- Called the **Open-Meteo forecast API** to get current precipitation, temperature, and humidity.
- Auto-populated the prediction form's rainfall/temperature/humidity fields from live weather.

**Outcome:** One-tap accurate weather inputs; prediction trust improved (testers appreciated not guessing values).

---

## 2. Research Challenges

### RC-1: Lack of Publicly Available Farm-Level Microdata

**Challenge:** No farm-level dataset with fertilizer, irrigation, experience, and yield exists publicly for Sri Lankan vegetables.

**Mitigation:** Synthetic data generation anchored to official DOA statistics, with physical and economic relationships preserved. Documented and reproducible.

### RC-2: Validating Synthetic Data Realism

**Challenge:** Synthetic data must reflect reality well enough for the models to be meaningful.

**Mitigation:** Anchored distributions to real DOA anchor values; validated correlations (production vs land area strong; price vs production negative within crop); compared feature importance against agronomic intuition.

### RC-3: Modeling Price Elasticity Without Demand-Side Data

**Challenge:** Price depends on demand, but only production-side features exist in the dataset.

**Mitigation:** Used `relative_supply` as a proxy for supply/demand balance; captured inflation via year feature. Acknowledged as a limitation in the report.

### RC-4: Capturing Weather Shocks and Management Quality

**Challenge:** Weather shocks (drought, floods) and management quality are not directly measurable in the dataset.

**Mitigation:** Included rainfall and irrigation as proxy features; assumed average management in synthetic generation. Future: add weather anomaly features.

### RC-5: Two-Stage Model Error Propagation

**Challenge:** The price model depends on the yield model's output, so yield errors propagate to price predictions.

**Mitigation:** Both models trained on the same dataset for consistency; price model uses `relative_supply` which dampens absolute-error propagation. Documented as a known limitation.

---

## 3. Lessons Learned

1. **Synthetic data can be effective when anchored to real statistics** and designed with domain knowledge (physical relationships, economic elasticity).
2. **Two-stage modeling (production → price) is more interpretable and accurate** than a single end-to-end model.
3. **Feature engineering matters more than model choice** — `relative_supply` improved price generalization more than any algorithm swap.
4. **PDF scraping is fragile** — always implement fallback strategies (URL guessing, multiple bulletins, graceful degradation).
5. **Polyglot backends are fine with good contracts** — two backends work well when the API client patterns and error envelopes are consistent.
6. **Auto-filling inputs from live data** (weather) dramatically improves trust and usability.
7. **Role-based routing from day one** avoids reworking the app shell when buyer users arrive.
8. **Mobile UI polish** (animated splash, loading skeletons, error states) significantly improves perceived performance.

---

_End of document._
