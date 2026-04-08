# Spring_Backend

Spring Boot backend for Firebase connection, authentication, Firestore access, and business APIs.

## Starter features

- Spring Boot application entry point
- `/health` endpoint
- Firebase Admin / Firestore configuration placeholder

## Run

```bash
cd apps/Backend/Spring_Backend
mvn spring-boot:run
```

## Notes

- Enable Firebase with `firebase.enabled=true`
- Provide credentials through `firebase.credentials.path` or `firebase.credentials.json`
