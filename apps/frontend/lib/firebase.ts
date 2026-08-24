import { getApp, getApps, initializeApp } from "firebase/app";
import { getAuth, type Auth } from "firebase/auth";

import { getFirebaseConfig } from "./firebase-config";

let authInstance: Auth | null = null;

export function getFirebaseAuth(): Auth {
  if (authInstance) {
    return authInstance;
  }

  const app = getApps().length ? getApp() : initializeApp(getFirebaseConfig());

  authInstance = getAuth(app);
  return authInstance;
}
