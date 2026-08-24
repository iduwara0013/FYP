# AgriLanka

AgriLanka is a smart-agriculture platform for Sri Lankan farmers and buyers. It combines an Expo mobile application, Spring Boot and Firestore, Python prediction services, agentic AI, and an admin dashboard.

## Applications

| Component | Port | Responsibility |
|---|---:|---|
| Spring Boot | 8080 | Profiles, Firestore records, HARTI ingestion and scheduling |
| Python Flask | 5000 | Yield, farm and HARTI price predictions |
| Python FastAPI | 5001 | AI assistant, recommendations and what-if analysis |
| Expo mobile | Expo assigned | Farmer and buyer application |
| Admin dashboard | 3000 | Operations, HARTI, model and system monitoring |

## First-time configuration

1. Copy `apps/frontend/.env.example` to `apps/frontend/.env` and enter the Firebase web configuration and your computer's LAN IP addresses.
2. Keep the Firebase service-account JSON outside the repository. Set `FIREBASE_CREDENTIALS_PATH` to its absolute path for Spring and Python.
3. Optionally set `GROQ_API_KEY` or `OPENAI_API_KEY`. Deterministic recommendations work without an LLM key.
4. Never commit `.env` files or service-account JSON files.

## Run for the viva

Open five terminals from the repository root:

```powershell
npm run serve:spring
npm run serve:python
npx nx run python_backend:serve:agent
npm run start:frontend -- --clear
npm run serve:admin
```

For a physical phone, use the development computer's Wi-Fi/LAN IPv4 address in `apps/frontend/.env`; `127.0.0.1` refers to the phone itself.

## Quality checks

```powershell
npm run lint
cd apps/frontend; npx tsc --noEmit
cd ../admin-dashboard; npm run build
cd ../Backend/Spring_Backend; mvn test
cd ../python_backend; python -m pytest -q
```

See [Final Viva Guide](docs/FINAL_VIVA_GUIDE.md) for architecture, demo order, limitations and the final checklist.
