import React, { useEffect, useState } from "react";
import { View } from "react-native";

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
import { SignUpScreen } from "@/components/screens/SignUpScreen";
import { WeatherScreen } from "@/components/screens/WeatherScreen";
import { YieldPredictionScreen } from "@/components/screens/YieldPredictionScreen";
import {
  ProfileData,
  Role,
  SignupDetails,
} from "@/components/screens/profile-types";
import { useNotifications } from "@/hooks/useNotifications";
import { getProfileByEmail } from "@/lib/spring-api";

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
  | "buyers"
  | "notifications"
  | "home";

export default function EntryScreen() {
  const [currentScreen, setCurrentScreen] = useState<Screen>("loading");
  const [userRole, setUserRole] = useState<Role | null>(null);
  const [signupDetails, setSignupDetails] = useState<SignupDetails | null>(
    null,
  );
  const [profileData, setProfileData] = useState<ProfileData | null>(null);

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
            unreadNotifications={unreadCount}
          />
        ) : (
          <HomeScreen
            profile={profileData}
            onMarketPrices={() => setCurrentScreen("market-prices")}
            onWeatherUpdate={() => setCurrentScreen("weather")}
            onBuyers={() => setCurrentScreen("buyers")}
            onYieldPrediction={() => setCurrentScreen("yield-prediction")}
            onCropRecommendation={() => setCurrentScreen("yield-prediction")}
            onProfile={() =>
              setCurrentScreen(profileData ? "profile-view" : "profile")
            }
            onNotifications={() => setCurrentScreen("notifications")}
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
