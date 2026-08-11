# SmartCrop — PR2 Deliverables Index

**Project:** SmartCrop — Smart Crop Forecasting System
**Review:** Progress Review 2 (PR2)
**Completion:** ~75%
**Last Updated:** 2026-08-05
**Repository:** https://github.com/iduwara0013/FYP.git

---

## Deliverables Checklist

| #   | Required Deliverable                                         | Document                                                                 | Status |
| --- | ------------------------------------------------------------ | ------------------------------------------------------------------------ | ------ |
| 1   | Working system demonstration (live or recorded video backup) | [Working_System_Demonstration.md](./Working_System_Demonstration.md)     | ✅     |
| 2   | List of completed, in-progress, and remaining features (75%) | [Feature_Completion_List.md](./Feature_Completion_List.md)               | ✅     |
| 3   | Updated architecture and design documents                    | [Architecture_and_Design.md](./Architecture_and_Design.md)               | ✅     |
| 4   | Evidence of testing on completed modules                     | [Testing_Evidence.md](./Testing_Evidence.md)                             | ✅     |
| 5   | Updated project plan (progress vs. milestones)               | [Project_Plan_Update.md](./Project_Plan_Update.md)                       | ✅     |
| 6   | Discussion of challenges and solutions                       | [Challenges_and_Solutions.md](./Challenges_and_Solutions.md)             | ✅     |
| 7   | Ethical, social, and security update                         | [Ethical_Social_Security_Update.md](./Ethical_Social_Security_Update.md) | ✅     |
| 8   | Updated research diary                                       | [Research_Diary.md](./Research_Diary.md)                                 | ✅     |
| 9   | Code repository / evidence of implementation depth           | [Code_Repository_Evidence.md](./Code_Repository_Evidence.md)             | ✅     |

---

## Quick Summary

**SmartCrop** is a mobile-first decision-support platform for Sri Lankan vegetable farmers and buyers. At PR2, the system is ~75% complete with 22 completed features, 5 in progress, and 9 remaining.

### Core Completed Modules

- **Authentication & Onboarding** — Firebase Auth, role selection (farmer/buyer), animated splash
- **Farmer & Buyer Dashboards** — themed, componentised dashboards with live weather
- **Yield & Price Prediction** — two-stage XGBoost pipeline (production → price → revenue) with auto weather-fill
- **Market Prices** — live HARTI PDF bulletin scraper with fallback URL guessing
- **Weather** — Open-Meteo geocoding + forecast integration
- **People Directory** — searchable buyer/farmer marketplace
- **Backend Services** — 14+ Spring REST controllers, 6 Flask endpoints, 12 Firestore collections

### Tech Stack

- **Frontend:** React Native (Expo SDK 54) + TypeScript 5.9
- **Backend (transactional):** Spring Boot 3.4.4 (Java 17) + Jsoup + PDFBox
- **Backend (ML):** Python / Flask + XGBoost + joblib
- **Database:** Firebase Firestore (NoSQL)
- **Auth:** Firebase Auth
- **External APIs:** HARTI (prices), Open-Meteo (weather + geocoding)
- **Repo:** GitHub (Nx monorepo, 3 apps)

### Key Research Findings (PR2)

- Land area is the dominant predictor of production (physical scaling relationship).
- Crop identity dominates price; `relative_supply` captures supply/demand elasticity.
- Two-stage modeling is more interpretable than a single end-to-end model.
- Feature engineering matters more than model choice.

---

## How to Navigate

1. Start with **Feature_Completion_List.md** for the 75% status overview.
2. Read **Architecture_and_Design.md** for the technical structure.
3. Review **Testing_Evidence.md** for validation of completed modules.
4. Check **Project_Plan_Update.md** for progress vs. milestones.
5. See **Challenges_and_Solutions.md** for engineering and research decisions.
6. Review **Ethical_Social_Security_Update.md** for responsible-innovation notes.
7. Read **Research_Diary.md** for the development journey.
8. Verify implementation depth in **Code_Repository_Evidence.md**.
9. Use **Working_System_Demonstration.md** as the demo script.

---

_End of index._
