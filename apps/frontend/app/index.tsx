import React, { useEffect, useState } from "react";
import { View } from "react-native";

import { ForgotPasswordScreen } from "@/components/screens/ForgotPasswordScreen";
import { HomeScreen } from "@/components/screens/HomeScreen";
import { LoadingScreen } from "@/components/screens/LoadingScreen";
import { LoginScreen } from "@/components/screens/LoginScreen";
import { ProfileCompletionScreen } from "@/components/screens/ProfileCompletionScreen";
import { SignUpScreen } from "@/components/screens/SignUpScreen";

type Screen = "loading" | "login" | "forgot-password" | "signup" | "home";
type ExtendedScreen = Screen | "profile";
type Role = "farmer" | "buyer";

export default function EntryScreen() {
  const [currentScreen, setCurrentScreen] = useState<ExtendedScreen>("loading");
  const [userRole, setUserRole] = useState<Role | null>(null);

  useEffect(() => {
    const timer = setTimeout(() => setCurrentScreen("login"), 2400);
    return () => clearTimeout(timer);
  }, []);

  const handleSignUp = (role: Role) => {
    setUserRole(role);
    setCurrentScreen("profile");
  };

  const handleLogin = () => {
    setCurrentScreen("home");
  };

  return (
    <View style={{ flex: 1, backgroundColor: "#F8FAFC" }}>
      {currentScreen === "loading" && (
        <LoadingScreen onLoadComplete={() => setCurrentScreen("login")} />
      )}

      {currentScreen === "login" && (
        <LoginScreen
          onForgotPassword={() => setCurrentScreen("forgot-password")}
          onSignUp={() => setCurrentScreen("signup")}
          onLogin={handleLogin}
        />
      )}

      {currentScreen === "forgot-password" && (
        <ForgotPasswordScreen onBackToLogin={() => setCurrentScreen("login")} />
      )}

      {currentScreen === "signup" && (
        <SignUpScreen
          onLogin={() => setCurrentScreen("login")}
          onSignUp={handleSignUp}
        />
      )}

      {currentScreen === "profile" && userRole && (
        <ProfileCompletionScreen
          role={userRole}
          onComplete={() => setCurrentScreen("home")}
        />
      )}

      {currentScreen === "home" && (
        <HomeScreen
          onProfile={() => {
            if (!userRole) {
              setUserRole("farmer");
            }
            setCurrentScreen("profile");
          }}
        />
      )}
    </View>
  );
}
