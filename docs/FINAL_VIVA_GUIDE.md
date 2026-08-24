# AgriLanka Final Viva Guide

## One-minute introduction

AgriLanka is a role-based smart-agriculture platform for Sri Lankan farmers and buyers. Farmers can manage crop plans, obtain weather-aware yield and price predictions, review live HARTI prices and trade with buyers. Buyers can publish purchase requests, compare offers and manage orders. Administrators monitor users, crop plans, market bulletins, prediction records and AI services. Operational data is stored in Firestore, while business APIs are separated from ML and agentic-AI workloads.

## Architecture

```text
Expo mobile app ───────┬──── Spring Boot API ─── Firestore
                      │          │
Admin dashboard ──────┤          ├── HARTI PDF collector (daily)
                      │          └── model retraining trigger (weekly)
                      │
                      ├──── Flask prediction API ─── trained model artifacts
                      └──── FastAPI AI service ───── optional LLM and Neo4j
```

- Spring Boot owns validated application data and scheduled ingestion.
- Flask serves deterministic ML inference and guarded model retraining.
- FastAPI isolates conversational and agentic workflows.
- Clients consume APIs and do not contain private backend credentials.

## Recommended demonstration order

1. Open admin and show service status.
2. Sign in as a farmer using Firebase Authentication.
3. Complete the profile and show it in admin.
4. Open GPS weather and explain the live location-based data.
5. Open HARTI prices, select a market and show history.
6. Run yield prediction and identify predicted production, price source and revenue.
7. Run AI crop recommendation and explain deterministic scoring versus optional LLM wording.
8. Save a crop plan and reopen it from Growing Plans.
9. Create a Trade Hub listing and show it from a buyer account.
10. Return to admin and show Firestore/model status.

Prepare one farmer and one buyer account before the viva. Do not depend on creating accounts live unless requested.

## HARTI model explanation

- Spring downloads HARTI PDF bulletins daily at 07:30 Asia/Colombo.
- Bulletin date is the Firestore document ID, so repeated collection does not duplicate data.
- Weekly training starts after at least 20 observations across three bulletin dates.
- Evaluation uses a chronological holdout.
- A candidate is promoted only when MAE is within 2% of the active model.
- The previous model remains active after a failure or quality decline.
- Farm price combines the current HARTI model (80%) with farm context (20%).

A small archive produces only a prototype forecast. Reliable seasonal forecasting requires months or years of uninterrupted observations.

## OOP concepts

- Encapsulation: controllers use services rather than direct storage/ML internals.
- Abstraction: mobile API modules hide HTTP details from screens.
- Composition: ML pipelines combine preprocessing and estimators.
- Single responsibility: collection, storage, prediction and UI are separate modules.
- Polymorphism: `ProfileData` is a farmer/buyer union with role-specific behavior.

## Testing evidence to capture

- Mobile TypeScript and Expo lint output.
- Admin production build output.
- Spring unit/controller test output.
- Python tests, including HARTI model tests.
- One live HARTI fetch and archived bulletin.
- One farmer, buyer, crop plan, prediction and trade record.

Never claim a test passed unless it completed successfully on the viva machine.

## Honest current limitations

- Trade chat uses periodic refresh rather than WebSockets.
- Payment/invoice features store workflow records but do not transfer money.
- Disease screening is not a clinically validated pathology model.
- Offline trade synchronization needs multi-device conflict resolution.
- Push notifications need a development/production build, not Expo Go.
- Generic Spring collection endpoints need user-token authorization before public deployment.
- HARTI PDF layout changes may require parser maintenance.
- Forecast quality depends on a growing historical archive.

## Security checklist

- Rotate the Firebase service-account key previously tracked by Git.
- Purge the key and `.env` from Git history before publishing.
- Restrict Firebase Authentication domains and Firestore rules.
- Configure production CORS origins.
- Add verified Firebase bearer tokens to Spring and set `API_AUTH_TOKEN` for FastAPI before internet deployment.
- Use HTTPS release endpoints.
- Never display credentials or `.env` content during the viva.

## Day-before checklist

- Phone and laptop are on the same network.
- Mobile `.env` contains the laptop's current IPv4 address.
- Credentials and Firebase web configuration are valid.
- Ports 8080, 5000, 5001 and 3000 are available.
- All five services start and health endpoints respond.
- HARTI data is already archived in case the public site is unavailable.
- Farmer and buyer demo accounts are ready.
- APK/development build is installed for notification support.
- A screen recording and screenshots exist as an offline fallback.

## Likely questions

**Why Firebase and Spring together?** Firebase provides managed identity and Firestore. Spring centralizes validation, identifiers, collection policy, scheduling and integrations.

**Why two Python servers?** Deterministic prediction and agentic AI have different behavior; separation prevents an LLM outage from taking down core prediction.

**Is the AI always an LLM?** No. Yield, price and recommendation scoring are deterministic. The optional LLM improves natural-language explanations.

**How is bad retraining prevented?** Chronological validation MAE is compared with the active artifact; degraded candidates are not promoted.

**Is all data real?** Operational records use Firestore, weather uses the configured live API and prices use HARTI. Some prediction models began with a synthetic-but-realistic dataset; distinguish predictions from observations.
