# SmartCrop — Ethical, Social & Security Update (PR2)

**Last Updated:** 2026-08-05
**Scope:** New considerations identified since PR1, grounded in the implemented system.

---

## 1. Ethical Considerations

### 1.1 AI Prediction Transparency and Accountability

**Issue:** The yield and price predictions directly influence a farmer's planting, input, and selling decisions. An opaque "black box" prediction could mislead a farmer into over-investing or underpricing.

**Mitigation implemented:**

- The two-stage pipeline (production → price → revenue) is **architecturally interpretable** — each stage has distinct, explainable features.
- The result includes `relative_supply` and the full input echo, so the user can see what drove the prediction.
- Predictions are framed as **decision support**, not prescriptions. The UI shows production, price, and revenue as estimates with units.

**Remaining (final phase):** Model card / disclaimer screen explaining training data scope, synthetic origin, and limitations.

### 1.2 Synthetic Data and Bias

**Issue:** The ML models are trained on synthetic data anchored to DOA AgStat 2018. If the anchor values over-represent certain regions/crops, predictions for under-represented areas may be less reliable.

**Mitigation implemented:**

- Feature selection was validated against agronomic intuition (land area > crop > irrigation > season > region).
- `relative_supply` normalises predictions across crops, reducing crop-identity bias.
- The synthetic generation preserves known economic relationships (negative elasticity, inflation).

**Remaining (final phase):** Field validation with real harvest data; publish district-level accuracy statements.

### 1.3 No Manipulative Design (Dark Patterns)

**Issue:** Agricultural apps can pressure users with urgency ("sell now or lose money!").

**Mitigation:** Market price display uses neutral language with source attribution (HARTI). No countdown timers, artificial scarcity, or pressure copy is used. Predictions explicitly state they are estimates.

---

## 2. Social Considerations

### 2.1 Digital Inclusion and Literacy

**Issue:** The target user base includes farmers with varying smartphone literacy. A complex UI risks excluding exactly the users who need decision support most.

**Mitigation implemented:**

- Large tap targets, clear role routing (farmer vs buyer), and a simple dashboard-first layout.
- Prediction form auto-fills weather from live data, reducing required user knowledge.
- Plain-language labels (region, irrigation, crop, season) instead of technical jargon.

**Remaining (final phase):** Sinhala and Tamil localisation is a known gap and a priority for true inclusion.

### 2.2 Market Information Equity

**Issue:** Providing live HARTI prices + AI price prediction could create information asymmetry if only some farmers have access.

**Mitigation:** The app is free, mobile-only (no desktop requirement), and uses the public HARTI bulletin. The People Directory is bidirectional — both farmers and buyers can browse each other, reducing one-sided information advantage.

**Remaining (final phase):** Offline mode for low-connectivity rural areas.

### 2.3 Rural Connectivity

**Issue:** Rural Sri Lanka has intermittent internet; an always-online app disadvantages rural users.

**Mitigation:** The app is designed primarily for online use with graceful loading states. Fallback URL guessing on HARTI keeps the market screen functional even when a single bulletin link fails.

**Remaining (final phase):** Offline caching of last-known prices and weather.

---

## 3. Security Considerations

### 3.1 Authentication

**Current state:** Firebase Auth (email/password) with role selection at sign-up. The frontend gates navigation on auth state and role.

**New consideration:** Spring Boot endpoints currently accept CRUD requests without server-side token verification. A malicious client could POST arbitrary profiles or predictions.

**Mitigation planned (final phase):** Spring Boot interceptor that verifies the Firebase ID token on each request and loads the user role from Firestore. This is documented as a known gap in the architecture and plan documents.

### 3.2 API Key Management

**Current state:** All API keys and Firebase credentials are in `.env` files, which are gitignored. `.env.example` documents required keys without leaking values.

**New consideration:** The HARTI, Open-Meteo, and Firebase Admin credentials must never be committed. The `.gitignore` covers `.env` and Firebase service-account JSON.

**Verified:** No credentials in tracked files.

### 3.3 Input Validation

**Current state:**

- Python backend validates required fields and returns 400 with field-level `missing_fields` lists.
- Spring validates DTOs via `spring-boot-starter-validation`.
- Frontend forms have inline validation.

**New consideration:** ML endpoints accept numeric inputs; range validation (e.g., land area > 0 and < 100 ha, rainfall realistic bounds) is recommended before production use.

### 3.4 Data Minimisation

**Current state:** Profiles collect only the minimum required fields (name, phone, email, region; optional organisation/land fields). No national ID or financial data is collected in the current implementation.

**New consideration:** The `national_id` field exists in the farmer profile type. Recommend removing it unless strictly required, per data-minimisation principles.

### 3.5 Firestore Access Control

**Current state:** A collection allowlist in `FirestoreCollectionService` restricts which collections are accessible through the generic endpoint.

**New consideration:** Firestore security rules should be tightened for production — currently the dev-phase allows broad read/write from the backend service account. Production rules should restrict to authenticated, authorised operations.

### 3.6 Notification Security

**Current state:** Notifications are local (expo-notifications) — no server-side push payload.

**New consideration:** When FCM remote push is added (final phase), push payloads must not include sensitive data, and notification permissions should be requested with clear rationale.

---

## 4. Summary of New Considerations Since PR1

| Area     | Consideration                                               | Status             |
| -------- | ----------------------------------------------------------- | ------------------ |
| Ethical  | Prediction transparency (two-stage, interpretable features) | ✅ Implemented     |
| Ethical  | Synthetic data bias acknowledgement                         | ✅ Documented      |
| Ethical  | No dark patterns / neutral language                         | ✅ Implemented     |
| Social   | Digital inclusion (plain language, large taps)              | ✅ Implemented     |
| Social   | Sinhala/Tamil i18n                                          | ⬜ Planned (final) |
| Social   | Rural connectivity / offline mode                           | ⬜ Planned (final) |
| Security | Server-side Firebase token verification                     | ⬜ Planned (final) |
| Security | ML input range validation                                   | ⬜ Planned (final) |
| Security | Data minimisation (review national_id)                      | 🔄 Under review    |
| Security | Firestore production security rules                         | ⬜ Planned (final) |
| Security | FCM push payload hygiene                                    | ⬜ Planned (final) |

---

_End of document._
