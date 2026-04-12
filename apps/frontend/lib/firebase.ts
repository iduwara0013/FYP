import AsyncStorage from "@react-native-async-storage/async-storage";
import { getApp, getApps, initializeApp } from "firebase/app";
import { getAuth, initializeAuth, type Auth } from "firebase/auth";
import { getReactNativePersistence } from "firebase/auth/react-native";
import { Platform } from "react-native";

import { getFirebaseConfig } from "./firebase-config";

let authInstance: Auth | null = null;

export function getFirebaseAuth(): Auth {
  if (authInstance) {
    return authInstance;
  }

  const app = getApps().length ? getApp() : initializeApp(getFirebaseConfig());

  if (Platform.OS === "web") {
    authInstance = getAuth(app);
    return authInstance;
  }

  try {
    authInstance = initializeAuth(app, {
      persistence: getReactNativePersistence(AsyncStorage),
    });
  } catch {
    authInstance = getAuth(app);
  }

  return authInstance;
}
