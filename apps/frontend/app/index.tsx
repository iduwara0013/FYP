import React, { useEffect, useState } from "react";
import { View } from "react-native";

import { ForgotPasswordScreen } from "@/components/screens/ForgotPasswordScreen";
import { HomeScreen } from "@/components/screens/HomeScreen";
import { LoadingScreen } from "@/components/screens/LoadingScreen";
import { LoginScreen } from "@/components/screens/LoginScreen";
import { ProfileCompletionScreen } from "@/components/screens/ProfileCompletionScreen";
import { ProfileViewScreen } from "@/components/screens/ProfileViewScreen";
import { SignUpScreen } from "@/components/screens/SignUpScreen";
import {
    ProfileData,
    Role,
    SignupDetails,
} from "@/components/screens/profile-types";
import { getProfileByEmail } from "@/lib/spring-api";

type Screen =
  | "loading"
  | "login"
  | "forgot-password"
  | "signup"
  | "profile"
  | "profile-view"
  | "home";

export default function EntryScreen() {
  const [currentScreen, setCurrentScreen] = useState<Screen>("loading");
  const [userRole, setUserRole] = useState<Role | null>(null);
  const [signupDetails, setSignupDetails] = useState<SignupDetails | null>(
    null,
  );
  const [profileData, setProfileData] = useState<ProfileData | null>(null);

  useEffect(() => {
    const timer = setTimeout(() => setCurrentScreen("login"), 2400);
    return () => clearTimeout(timer);
  }, []);

  const handleSignUp = (role: Role, details: SignupDetails) => {
    setUserRole(role);
    setSignupDetails(details);
    setProfileData(null);
    setCurrentScreen("profile");
  };

  const handleLogin = async (email: string) => {
    const profile = await getProfileByEmail(email);
    setProfileData(profile);
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
          initialValues={signupDetails}
          onComplete={(profile) => {
            setProfileData(profile);
            setCurrentScreen("home");
          }}
        />
      )}

      {currentScreen === "profile-view" && profileData && (
        <ProfileViewScreen
          profile={profileData}
          onBackToHome={() => setCurrentScreen("home")}
        />
      )}

      {currentScreen === "home" && (
        <HomeScreen
          profile={profileData}
          onProfile={() =>
            setCurrentScreen(profileData ? "profile-view" : "profile")
          }
        />
      )}
    </View>
  );
}
