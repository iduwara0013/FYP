import { getApp, getApps, initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";

import { getFirebaseConfig } from "./firebase-config";

let authInstance = null;

export function getFirebaseAuth() {
  if (authInstance) {
    return authInstance;
  }

  const app = getApps().length ? getApp() : initializeApp(getFirebaseConfig());
  authInstance = getAuth(app);

  return authInstance;
}
