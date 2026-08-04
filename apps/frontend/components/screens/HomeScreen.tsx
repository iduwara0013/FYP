import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import {
  Animated,
  Easing,
  RefreshControl,
  SafeAreaView,
  ScrollView,
  StyleSheet,
} from "react-native";

import { AIInsightCard } from "../dashboard/AIInsightCard";
import { DashboardHeader } from "../dashboard/DashboardHeader";
import { FloatingBottomNav } from "../dashboard/FloatingBottomNav";
import {
  AlertCard,
  DashboardFarmSummaryCard,
  MarketPreviewCard,
  SectionTitle,
  type MarketPreviewItem,
} from "../dashboard/InfoCards";
import {
  PredictionCarousel,
  type PredictionItem,
} from "../dashboard/PredictionCarousel";
import { ProfileCard } from "../dashboard/ProfileCard";
import {
  QuickActionGrid,
  type QuickAction,
} from "../dashboard/QuickActionGrid";
import { WeatherCard } from "../dashboard/WeatherCard";
import { dashboardColors, dashboardSpacing } from "../dashboard/theme";
import { ProfileData } from "./profile-types";

const farmerActionCards: QuickAction[] = [
  {
    id: "weather",
    icon: "weather-partly-cloudy",
    title: "Weather",
    description: "Live forecast for your region",
    background: "#DBEAFE",
    iconColor: "#2563EB",
  },
  {
    id: "market",
    icon: "currency-usd",
    title: "Market Prices",
    description: "Today's HARTI bulletin",
    background: "#FFEDD5",
    iconColor: "#EA580C",
  },
  {
    id: "crop",
    icon: "leaf",
    title: "Crop Recommendation",
    description: "AI-powered suggestions",
    background: "#DCFCE7",
    iconColor: "#15803D",
  },
  {
    id: "yield",
    icon: "chart-line",
    title: "Yield Prediction",
    description: "Forecast your harvest",
    background: "#FEF3C7",
    iconColor: "#B45309",
  },
];

const buyerActionCards: QuickAction[] = [
  {
    id: "weather",
    icon: "weather-partly-cloudy",
    title: "Weather",
    description: "Live forecast for your region",
    background: "#DBEAFE",
    iconColor: "#2563EB",
  },
  {
    id: "market",
    icon: "currency-usd",
    title: "Market Prices",
    description: "Today's HARTI bulletin",
    background: "#FFEDD5",
    iconColor: "#EA580C",
  },
  {
    id: "buyers",
    icon: "account-group-outline",
    title: "Buyers Directory",
    description: "Browse registered buyers",
    background: "#E0E7FF",
    iconColor: "#4338CA",
  },
];

type WeatherState = {
  locationName: string;
  temperature: number;
  humidity: number | null;
  windSpeed: number | null;
  weatherCode: number;
  description: string;
  updatedAt: string;
};

type MarketEntry = {
  tableIndex: number;
  summary: string;
  values: string[];
  [key: string]: unknown;
};

type MarketState = {
  sourceUrl: string;
  pageTitle: string;
  fetchedAt: string;
  tableCount: number;
  success: boolean;
  entries: MarketEntry[];
};

const recentPredictions: PredictionItem[] = [
  {
    crop: "Rice",
    confidence: "94%",
    status: "Excellent",
    accent: "#16A34A",
    yieldValue: "2,450 kg",
  },
  {
    crop: "Wheat",
    confidence: "87%",
    status: "Good",
    accent: "#2563EB",
    yieldValue: "1,820 kg",
  },
  {
    crop: "Corn",
    confidence: "91%",
    status: "Excellent",
    accent: "#F59E0B",
    yieldValue: "3,100 kg",
  },
];

const marketPreviewItems: MarketPreviewItem[] = [
  { crop: "Rice", price: "Rs 185/kg" },
  { crop: "Carrot", price: "Rs 220/kg" },
  { crop: "Tomato", price: "Rs 150/kg" },
];

type HomeScreenProps = {
  profile?: ProfileData | null;
  onProfile?: () => void;
  onMarketPrices?: () => void;
  onWeatherUpdate?: () => void;
  onBuyers?: () => void;
  onYieldPrediction?: () => void;
  onCropRecommendation?: () => void;
};

function getGreeting(date: Date) {
  const hour = date.getHours();
  if (hour < 12) return "Good Morning";
  if (hour < 17) return "Good Afternoon";
  return "Good Evening";
}

function getWeatherDescription(code: number) {
  if (code === 0) return "Clear sky";
  if (code === 1 || code === 2) return "Partly cloudy";
  if (code === 3) return "Overcast";
  if (code === 45 || code === 48) return "Foggy";
  if ([51, 53, 55, 56, 57].includes(code)) return "Drizzle";
  if ([61, 63, 65, 66, 67].includes(code)) return "Rain";
  if ([71, 73, 75, 77].includes(code)) return "Snow";
  if ([80, 81, 82].includes(code)) return "Showers";
  if ([95, 96, 99].includes(code)) return "Thunderstorm";
  return "Current weather";
}

function getWeatherIcon(code: number) {
  if (code === 0) return "weather-sunny";
  if (code === 1 || code === 2) return "weather-partly-cloudy";
  if (code === 3) return "weather-cloudy";
  if (code === 45 || code === 48) return "weather-fog";
  if ([51, 53, 55, 56, 57].includes(code)) return "weather-rainy";
  if ([61, 63, 65, 66, 67, 80, 81, 82].includes(code)) return "weather-pouring";
  if ([71, 73, 75, 77].includes(code)) return "weather-snowy";
  if ([95, 96, 99].includes(code)) return "weather-lightning-rainy";
  return "weather-partly-cloudy";
}

export function HomeScreen({
  profile,
  onProfile,
  onMarketPrices,
  onWeatherUpdate,
  onBuyers,
  onYieldPrediction,
  onCropRecommendation,
}: HomeScreenProps) {
  const isFarmer = profile?.role !== "buyer";
  const cardOpacity = useRef(new Animated.Value(0)).current;
  const cardOffset = useRef(new Animated.Value(12)).current;
  const greetingName = profile?.fullName?.split(" ")[0] ?? "Farmer";
  const weatherRegion = profile?.region?.trim() || "Kandy";
  const [weatherLoading, setWeatherLoading] = useState(false);
  const [weatherError, setWeatherError] = useState("");
  const [weatherState, setWeatherState] = useState<WeatherState | null>(null);
  const [now, setNow] = useState(new Date());
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    Animated.parallel([
      Animated.timing(cardOpacity, {
        toValue: 1,
        duration: 520,
        easing: Easing.bezier(0.16, 1, 0.3, 1),
        useNativeDriver: true,
      }),
      Animated.timing(cardOffset, {
        toValue: 0,
        duration: 520,
        easing: Easing.bezier(0.16, 1, 0.3, 1),
        useNativeDriver: true,
      }),
    ]).start();
  }, [cardOpacity, cardOffset]);

  useEffect(() => {
    const timer = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const handleWeatherPress = useCallback(async () => {
    try {
      setWeatherLoading(true);
      setWeatherError("");

      const geoResponse = await fetch(
        `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(weatherRegion)}&count=1&language=en&format=json`,
      );

      if (!geoResponse.ok) {
        throw new Error("Unable to find your region.");
      }

      const geoData = (await geoResponse.json()) as {
        results?: {
          name: string;
          country?: string;
          latitude: number;
          longitude: number;
        }[];
      };

      const location = geoData.results?.[0];

      if (!location) {
        throw new Error(`No weather location found for ${weatherRegion}.`);
      }

      const weatherResponse = await fetch(
        `https://api.open-meteo.com/v1/forecast?latitude=${location.latitude}&longitude=${location.longitude}&current=temperature_2m,relative_humidity_2m,wind_speed_10m,weather_code&timezone=auto`,
      );

      if (!weatherResponse.ok) {
        throw new Error("Unable to load live weather right now.");
      }

      const weatherData = (await weatherResponse.json()) as {
        current?: {
          temperature_2m: number;
          relative_humidity_2m?: number;
          wind_speed_10m?: number;
          weather_code: number;
          time: string;
        };
      };

      if (!weatherData.current) {
        throw new Error("Weather data is not available right now.");
      }

      setWeatherState({
        locationName: `${location.name}${location.country ? `, ${location.country}` : ""}`,
        temperature: weatherData.current.temperature_2m,
        humidity:
          typeof weatherData.current.relative_humidity_2m === "number"
            ? weatherData.current.relative_humidity_2m
            : null,
        windSpeed:
          typeof weatherData.current.wind_speed_10m === "number"
            ? weatherData.current.wind_speed_10m
            : null,
        weatherCode: weatherData.current.weather_code,
        description: getWeatherDescription(weatherData.current.weather_code),
        updatedAt: weatherData.current.time,
      });
    } catch (error) {
      setWeatherState(null);
      setWeatherError(
        error instanceof Error ? error.message : "Unable to load weather.",
      );
    } finally {
      setWeatherLoading(false);
    }
  }, [weatherRegion]);

  useEffect(() => {
    void handleWeatherPress();
  }, [handleWeatherPress]);

  const handleRefresh = useCallback(async () => {
    setRefreshing(true);
    await handleWeatherPress();
    setRefreshing(false);
  }, [handleWeatherPress]);

  const handleQuickAction = useCallback(
    (id: string) => {
      if (id === "weather") {
        (onWeatherUpdate ?? handleWeatherPress)();
      } else if (id === "market") {
        onMarketPrices?.();
      } else if (id === "buyers") {
        onBuyers?.();
      } else if (id === "yield") {
        onYieldPrediction?.();
      } else if (id === "crop") {
        onCropRecommendation?.();
      }
    },
    [
      onWeatherUpdate,
      handleWeatherPress,
      onMarketPrices,
      onBuyers,
      onYieldPrediction,
      onCropRecommendation,
    ],
  );

  const handleNavSelect = useCallback(
    (key: string) => {
      if (key === "profile") {
        onProfile?.();
      } else if (key === "predict") {
        onYieldPrediction?.();
      }
    },
    [onProfile, onYieldPrediction],
  );

  const farmTiles = useMemo(() => {
    const landArea =
      profile?.role === "farmer" && profile.totalLandArea
        ? `${profile.totalLandArea} ha`
        : "1.8 ha";

    return [
      { icon: "vector-square" as const, label: "Land Area", value: landArea },
      { icon: "sprout" as const, label: "Active Crops", value: "3" },
      {
        icon: "chart-line" as const,
        label: "Expected Yield",
        value: "2,450 kg",
      },
      {
        icon: "calendar-check" as const,
        label: "Harvest Date",
        value: "Nov 15",
      },
      { icon: "water-outline" as const, label: "Moisture", value: "62%" },
      { icon: "water" as const, label: "Water Usage", value: "1.2k L" },
    ];
  }, [profile]);

  const buyerTiles = useMemo(
    () => [
      { icon: "cart-outline" as const, label: "Today's Demand", value: "High" },
      { icon: "trending-up" as const, label: "Top Selling", value: "Rice" },
      { icon: "account-group" as const, label: "Nearby Farmers", value: "24" },
      { icon: "file-document-outline" as const, label: "Requests", value: "8" },
    ],
    [],
  );

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            tintColor={dashboardColors.primary}
            colors={[dashboardColors.primary]}
          />
        }
      >
        <Animated.View
          style={{
            opacity: cardOpacity,
            transform: [{ translateY: cardOffset }],
          }}
        >
          <DashboardHeader
            greeting={getGreeting(now)}
            firstName={greetingName}
            now={now}
            isFarmer={isFarmer}
            onProfile={() => onProfile?.()}
            onNotifications={() => {}}
          />
        </Animated.View>

        <ProfileCard profile={profile} onPress={() => onProfile?.()} />

        <WeatherCard
          region={weatherRegion}
          loading={weatherLoading}
          error={weatherError}
          temperature={weatherState?.temperature ?? null}
          humidity={weatherState?.humidity ?? null}
          windSpeed={weatherState?.windSpeed ?? null}
          weatherCode={weatherState?.weatherCode ?? null}
          locationName={weatherState?.locationName ?? null}
          updatedAt={weatherState?.updatedAt ?? null}
          onRefresh={handleWeatherPress}
          onPress={onWeatherUpdate ?? handleWeatherPress}
        />

        <AIInsightCard
          profile={profile}
          onLearnMore={() => onCropRecommendation?.()}
        />

        <AlertCard
          title="Weather Alert"
          message="Moderate rainfall expected in the next 48 hours. Good timing for land preparation."
          severity="warning"
        />

        <SectionTitle title="Quick Actions" />
        <QuickActionGrid
          actions={isFarmer ? farmerActionCards : buyerActionCards}
          onPress={handleQuickAction}
        />

        <SectionTitle
          title="Market Prices"
          actionLabel="View all"
          onAction={onMarketPrices}
        />
        <MarketPreviewCard
          items={marketPreviewItems}
          onViewReport={() => onMarketPrices?.()}
        />

        <SectionTitle title="Recent Predictions" />
        <PredictionCarousel items={recentPredictions} />

        <SectionTitle title={isFarmer ? "Farm Summary" : "Buyer Dashboard"} />
        <DashboardFarmSummaryCard tiles={isFarmer ? farmTiles : buyerTiles} />
      </ScrollView>

      <FloatingBottomNav active="home" onSelect={handleNavSelect} />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: dashboardColors.background,
  },
  scrollContent: {
    paddingHorizontal: dashboardSpacing.lg,
    paddingTop: dashboardSpacing.lg,
    paddingBottom: 110,
  },
});
