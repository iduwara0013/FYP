import React, { useEffect, useMemo, useRef, useState } from "react";
import { Animated, Easing, View } from "react-native";

import { ForgotPasswordScreen } from "@/components/screens/ForgotPasswordScreen";
import { HomeScreen } from "@/components/screens/HomeScreen";
import { LoadingScreen } from "@/components/screens/LoadingScreen";
import { LoginScreen } from "@/components/screens/LoginScreen";
import { ProfileCompletionScreen } from "@/components/screens/ProfileCompletionScreen";
import { ProfileViewScreen } from "@/components/screens/ProfileViewScreen";
import { SignUpScreen } from "@/components/screens/SignUpScreen";
import { FarmToolkitScreen } from "@/components/screens/FarmToolkitScreen";
import { AgenticRecommendationScreen } from "@/components/screens/AgenticRecommendationScreen";
import { GrowingPlansScreen } from "@/components/screens/GrowingPlansScreen";
import { CropPlanScreen } from "@/components/screens/CropPlanScreen";
import { buildCropPlan } from "@/lib/cropPlanBuilder";
import type { CropPlanDraft } from "@/lib/plan-types";
import { getProfileByEmail } from "@/lib/spring-api";
import { useTheme } from "@/context/ThemeContext";
import {
    ProfileData,
    Role,
    SignupDetails,
} from "@/components/screens/profile-types";

type Screen =
  | "loading"
  | "login"
  | "forgot-password"
  | "signup"
  | "profile"
  | "profile-view"
  | "farm-tools"
  | "crop-recommendation"
  | "crop-plan"
  | "growing-plans"
  | "home";

export default function EntryScreen() {
  const { theme } = useTheme();
  const [currentScreen, setCurrentScreen] = useState<Screen>("loading");
  const [userRole, setUserRole] = useState<Role | null>(null);
  const [signupDetails, setSignupDetails] = useState<SignupDetails | null>(
    null,
  );
  const [profileData, setProfileData] = useState<ProfileData | null>(null);
  const [selectedPlan, setSelectedPlan] = useState<CropPlanDraft | null>(null);
  const screenOpacity = useRef(new Animated.Value(0)).current;
  const screenOffset = useRef(new Animated.Value(14)).current;

  useEffect(() => {
    const timer = setTimeout(() => setCurrentScreen("login"), 2400);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    screenOpacity.setValue(0);
    screenOffset.setValue(14);

    Animated.parallel([
      Animated.timing(screenOpacity, {
        toValue: 1,
        duration: 420,
        easing: Easing.bezier(0.16, 1, 0.3, 1),
        useNativeDriver: true,
      }),
      Animated.timing(screenOffset, {
        toValue: 0,
        duration: 420,
        easing: Easing.bezier(0.16, 1, 0.3, 1),
        useNativeDriver: true,
      }),
    ]).start();
  }, [currentScreen, screenOpacity, screenOffset]);

  const screenStyle = useMemo(
    () => ({
      flex: 1,
      opacity: screenOpacity,
      transform: [{ translateY: screenOffset }],
    }),
    [screenOpacity, screenOffset],
  );

  const handleSignUp = (role: Role, details: SignupDetails) => {
    setUserRole(role);
    setSignupDetails(details);
    setProfileData(null);
    setCurrentScreen("profile");
  };

  const handleLogin = async (email: string) => {
    try {
      setProfileData(await getProfileByEmail(email));
    } catch {
      setProfileData(null);
    }
    setCurrentScreen("home");
  };

  return (
    <View style={{ flex: 1, backgroundColor: theme.colors.background }}>
      <Animated.View style={screenStyle}>
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
          <ForgotPasswordScreen
            onBackToLogin={() => setCurrentScreen("login")}
          />
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
            onProfileUpdated={setProfileData}
          />
        )}

        {currentScreen === "home" && (
          <HomeScreen
            profile={profileData}
            onFarmTools={() => setCurrentScreen("farm-tools")}
            onCropRecommendation={() => setCurrentScreen("crop-recommendation")}
            onGrowingPlan={() => setCurrentScreen("growing-plans")}
            onProfile={() => {
              setCurrentScreen(profileData ? "profile-view" : "profile");
            }}
          />
        )}

        {currentScreen === "farm-tools" && (
          <FarmToolkitScreen onBack={() => setCurrentScreen("home")} />
        )}

        {currentScreen === "crop-recommendation" && (
          <AgenticRecommendationScreen
            profile={profileData}
            onBackToHome={() => setCurrentScreen("home")}
            onViewPlan={(crop) => {
              const month = new Date().getMonth() + 1;
              const season = [10, 11, 12, 1, 2, 3].includes(month) ? "Maha" : "Yala";
              setSelectedPlan(buildCropPlan(
                crop,
                profileData,
                season,
                new Date().getFullYear(),
                profileData?.role === "farmer" ? profileData.totalLandArea ?? 1 : 1,
                profileData?.role === "farmer" ? profileData.hasIrrigation : true,
              ));
              setCurrentScreen("crop-plan");
            }}
          />
        )}

        {currentScreen === "crop-plan" && selectedPlan && (
          <CropPlanScreen profile={profileData} plan={selectedPlan} alreadySaved onBack={() => setCurrentScreen("crop-recommendation")} />
        )}

        {currentScreen === "growing-plans" && (
          <GrowingPlansScreen profile={profileData} onBack={() => setCurrentScreen("home")} />
        )}
      </Animated.View>
    </View>
  );
}
