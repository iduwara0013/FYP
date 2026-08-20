import React, { useCallback, useEffect, useState } from "react";
import { View } from "react-native";

import { AgenticRecommendationScreen } from "@/components/screens/AgenticRecommendationScreen";
import { BuyerHomeScreen } from "@/components/screens/BuyerHomeScreen";
import { BuyersScreen } from "@/components/screens/BuyersScreen";
import { ForgotPasswordScreen } from "@/components/screens/ForgotPasswordScreen";
import { HomeScreen } from "@/components/screens/HomeScreen";
import { LoadingScreen } from "@/components/screens/LoadingScreen";
import { LoginScreen } from "@/components/screens/LoginScreen";
import { MarketPricesScreen } from "@/components/screens/MarketPricesScreen";
import { NotificationScreen } from "@/components/screens/NotificationScreen";
import { ProfileCompletionScreen } from "@/components/screens/ProfileCompletionScreen";
import { ProfileViewScreen } from "@/components/screens/ProfileViewScreen";
import { SettingsScreen } from "@/components/screens/SettingsScreen";
import { SignUpScreen } from "@/components/screens/SignUpScreen";
import { WeatherScreen } from "@/components/screens/WeatherScreen";
import { YieldPredictionScreen } from "@/components/screens/YieldPredictionScreen";
import {
  ProfileData,
  Role,
  SignupDetails,
} from "@/components/screens/profile-types";
import { ThemeProvider, useTheme } from "@/context/ThemeContext";
import { useNotifications } from "@/hooks/useNotifications";
import { I18nProvider } from "@/i18n";
import { getProfileByEmail } from "@/lib/spring-api";
import { buildCropPlan } from "@/lib/cropPlanBuilder";
import { CropPlanScreen } from "@/components/screens/CropPlanScreen";
import type { CropPlanDraft, CropOption } from "@/lib/plan-types";

type Screen =
  | "loading"
  | "login"
  | "forgot-password"
  | "signup"
  | "profile"
  | "profile-view"
  | "market-prices"
  | "weather"
  | "yield-prediction"
    | "agentic-recommendation"
  | "crop-plan"
  | "buyers"
  | "notifications"
  | "settings"
  | "home";

function AppContent() {
  const { theme } = useTheme();
  const [currentScreen, setCurrentScreen] = useState<Screen>("loading");
  const [userRole, setUserRole] = useState<Role | null>(null);
  const [signupDetails, setSignupDetails] = useState<SignupDetails | null>(
    null,
  );
    const [profileData, setProfileData] = useState<ProfileData | null>(null);
  const [cropPlan, setCropPlan] = useState<CropPlanDraft | null>(null);

  // Wire up the notification system (push permission, background checks,
  // deep-link handling, live unread count).
  const { unreadCount } = useNotifications({
    profile: profileData,
    onDeepLink: (deepLink) => {
      if (deepLink === "smartcrop://weather") setCurrentScreen("weather");
      else if (deepLink === "smartcrop://market-prices")
        setCurrentScreen("market-prices");
      else if (deepLink === "smartcrop://yield-prediction")
        setCurrentScreen("yield-prediction");
      else if (deepLink === "smartcrop://home") setCurrentScreen("home");
    },
    enabled: !!profileData,
  });

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
    setCurrentScreen(profile.role === "buyer" ? "buyers" : "home");
  };

    const handleLogout = () => {
    setProfileData(null);
    setUserRole(null);
    setSignupDetails(null);
    setCurrentScreen("login");
  };

  const handleViewPlan = useCallback(
    (option: CropOption) => {
      const month = new Date().getMonth() + 1;
      const season: "Yala" | "Maha" = [10, 11, 12, 1, 2, 3].includes(month)
        ? "Maha"
        : "Yala";
      const year = new Date().getFullYear();
      const landArea =
        profileData?.role === "farmer" && profileData?.totalLandArea
          ? profileData.totalLandArea
          : 1.0;
      const hasIrrigation =
        profileData?.role === "farmer"
          ? profileData?.hasIrrigation ?? true
          : true;
      setCropPlan(
        buildCropPlan(option, profileData, season, year, landArea, hasIrrigation),
      );
      setCurrentScreen("crop-plan");
    },
    [profileData],
  );

  return (
    <View style={{ flex: 1, backgroundColor: theme.colors.background }}>
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
            setCurrentScreen(profile.role === "buyer" ? "buyers" : "home");
          }}
        />
      )}

      {currentScreen === "profile-view" && profileData && (
        <ProfileViewScreen
          profile={profileData}
          onBackToHome={() => setCurrentScreen("home")}
        />
      )}

      {currentScreen === "settings" && (
        <SettingsScreen
          profile={profileData}
          onBackToHome={() => setCurrentScreen("home")}
          onEditProfile={() =>
            setCurrentScreen(profileData ? "profile-view" : "profile")
          }
          onViewProfile={() =>
            setCurrentScreen(profileData ? "profile-view" : "profile")
          }
          onLogout={handleLogout}
        />
      )}

      {currentScreen === "home" &&
        profileData &&
        (profileData.role === "buyer" ? (
          <BuyerHomeScreen
            profile={profileData}
            onMarketPrices={() => setCurrentScreen("market-prices")}
            onWeatherUpdate={() => setCurrentScreen("weather")}
            onBrowsePeople={() => setCurrentScreen("buyers")}
            onProfile={() =>
              setCurrentScreen(profileData ? "profile-view" : "profile")
            }
            onNotifications={() => setCurrentScreen("notifications")}
            onSettings={() => setCurrentScreen("settings")}
            unreadNotifications={unreadCount}
          />
        ) : (
          <HomeScreen
            profile={profileData}
            onMarketPrices={() => setCurrentScreen("market-prices")}
            onWeatherUpdate={() => setCurrentScreen("weather")}
            onBuyers={() => setCurrentScreen("buyers")}
            onYieldPrediction={() => setCurrentScreen("yield-prediction")}
                        onCropRecommendation={() =>
              setCurrentScreen("agentic-recommendation")
            }
            onGrowingPlan={() => setCurrentScreen("agentic-recommendation")}
            onProfile={() =>
              setCurrentScreen(profileData ? "profile-view" : "profile")
            }
            onNotifications={() => setCurrentScreen("notifications")}
            onSettings={() => setCurrentScreen("settings")}
            unreadNotifications={unreadCount}
          />
        ))}

      {currentScreen === "weather" && (
        <WeatherScreen
          region={profileData?.region?.trim() || "Kandy"}
          onBackToHome={() => setCurrentScreen("home")}
        />
      )}

      {currentScreen === "yield-prediction" && (
        <YieldPredictionScreen
          profile={profileData}
          onBackToHome={() => setCurrentScreen("home")}
        />
      )}

      {currentScreen === "agentic-recommendation" && (
                <AgenticRecommendationScreen
          profile={profileData}
          onBackToHome={() => setCurrentScreen("home")}
          onViewPlan={handleViewPlan}
        />
      )}

      {currentScreen === "crop-plan" && cropPlan && (
        <CropPlanScreen
          profile={profileData}
          plan={cropPlan}
          onBack={() => {
            setCropPlan(null);
            setCurrentScreen("home");
          }}
        />
      )}

      {currentScreen === "market-prices" && (
        <MarketPricesScreen onBackToHome={() => setCurrentScreen("home")} />
      )}

      {currentScreen === "buyers" && (
        <BuyersScreen
          onBackToHome={() => setCurrentScreen("home")}
          userRegion={profileData?.region}
        />
      )}

      {currentScreen === "notifications" && profileData && (
        <NotificationScreen
          profile={profileData}
          onBackToHome={() => setCurrentScreen("home")}
          onDeepLink={(deepLink) => {
            if (deepLink === "smartcrop://weather") setCurrentScreen("weather");
            else if (deepLink === "smartcrop://market-prices")
              setCurrentScreen("market-prices");
            else if (deepLink === "smartcrop://yield-prediction")
              setCurrentScreen("yield-prediction");
            else setCurrentScreen("home");
          }}
        />
      )}
    </View>
  );
}

export default function EntryScreen() {
  return (
    <I18nProvider>
      <ThemeProvider>
        <AppContent />
      </ThemeProvider>
    </I18nProvider>
  );
}
