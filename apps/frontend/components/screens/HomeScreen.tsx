import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import * as Location from "expo-location";
import {
  Animated,
  Easing,
  RefreshControl,
  ScrollView,
  StyleSheet,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { useTheme } from "../../context/ThemeContext";
import { useI18n } from "../../i18n";
import { AIInsightCard } from "../dashboard/AIInsightCard";
import { DashboardHeader } from "../dashboard/DashboardHeader";
import { FloatingBottomNav } from "../dashboard/FloatingBottomNav";
import {
  DashboardFarmSummaryCard,
  MarketPreviewCard,
  SectionTitle,
  type MarketPreviewItem,
} from "../dashboard/InfoCards";
import { ProfileCard } from "../dashboard/ProfileCard";
import {
  QuickActionGrid,
  type QuickAction,
} from "../dashboard/QuickActionGrid";
import { WeatherCard } from "../dashboard/WeatherCard";
import { dashboardSpacing } from "../dashboard/theme";
import { ProfileData } from "./profile-types";
import { fetchWeatherForCoordinates } from "../../lib/weather";
import { getCropPlansForFarmer, getLiveMarketPrices, type SavedCropPlan } from "../../lib/spring-api";

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
    id: "growing-plan",
    icon: "clipboard-outline",
    title: "Growing Plan",
    description: "Plan & confirm your crop schedule",
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
  {
    id: "farm-tools",
    icon: "toolbox-outline",
    title: "Farmer Toolkit",
    description: "Calendar, finance, inventory & more",
    background: "#E0F2FE",
    iconColor: "#0369A1",
  },
  { id: "trade-hub", icon: "handshake-outline", title: "Trade Hub", description: "Market, chat, offers & orders", background: "#F3E8FF", iconColor: "#7E22CE" },
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

type HomeScreenProps = {
  profile?: ProfileData | null;
  onProfile?: () => void;
  onMarketPrices?: () => void;
  onWeatherUpdate?: () => void;
  onBuyers?: () => void;
  onYieldPrediction?: () => void;
    onCropRecommendation?: () => void;
  onGrowingPlan?: () => void;
  onNotifications?: () => void;
  onSettings?: () => void;
  onFarmTools?: () => void;
  onTradeHub?: () => void;
  unreadNotifications?: number;
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

function highestDisplayedPrice(value: string): number {
  const values = value.match(/\d[\d,]*(?:\.\d+)?/g)?.map((part) => Number(part.replace(/,/g, ""))).filter(Number.isFinite) ?? [];
  return values.length ? Math.max(...values) : -1;
}

function compactPriceRange(value: string): string {
  const values = value.match(/\d[\d,]*(?:\.\d+)?/g)?.map((part) => Number(part.replace(/,/g, ""))).filter(Number.isFinite) ?? [];
  if (!values.length) return "Price unavailable";
  const low = Math.min(...values); const high = Math.max(...values);
  const format = (price:number) => price.toLocaleString("en-US", { maximumFractionDigits: 0 });
  return low === high ? `Rs ${format(low)}/kg` : `Rs ${format(low)}–${format(high)}/kg`;
}

export function HomeScreen({
  profile,
  onProfile,
  onMarketPrices,
  onWeatherUpdate,
  onBuyers,
  onYieldPrediction,
    onCropRecommendation,
  onGrowingPlan,
  onNotifications,
  onSettings,
  onFarmTools,
  onTradeHub,
  unreadNotifications = 0,
}: HomeScreenProps) {
  const { theme } = useTheme();
  const { colors } = theme;
  const { t } = useI18n();
  const isFarmer = profile?.role !== "buyer";
  const cardOpacity = useRef(new Animated.Value(0)).current;
  const cardOffset = useRef(new Animated.Value(12)).current;
  const greetingName = profile?.fullName?.split(" ")[0] ?? t("farmer");
  const weatherRegion = profile?.region?.trim() || "Kandy";
  const [weatherLoading, setWeatherLoading] = useState(false);
  const [weatherError, setWeatherError] = useState("");
  const [weatherState, setWeatherState] = useState<WeatherState | null>(null);
  const [now, setNow] = useState(new Date());
  const [refreshing, setRefreshing] = useState(false);
  const [marketPreviewItems, setMarketPreviewItems] = useState<MarketPreviewItem[]>([]);
  const [marketUpdatedLabel, setMarketUpdatedLabel] = useState<string | null>(null);
  const [cropPlans, setCropPlans] = useState<SavedCropPlan[]>([]);

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

      try {
        const permission = await Location.requestForegroundPermissionsAsync();
        if (permission.status === "granted") {
          const position = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
          const { latitude, longitude } = position.coords;
          let label = `${latitude.toFixed(2)}°, ${longitude.toFixed(2)}°`;
          try {
            const [place] = await Location.reverseGeocodeAsync({ latitude, longitude });
            const parts = place ? [place.city, place.district, place.region].filter((part): part is string => Boolean(part)) : [];
            if (parts.length) label = [...new Set(parts)].join(", ");
          } catch { /* Coordinates remain a valid location label. */ }
          const gpsWeather = await fetchWeatherForCoordinates(latitude, longitude, label);
          setWeatherState(gpsWeather);
          return;
        }
      } catch {
        // Fall back to the farmer's saved region below.
      }

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

  const loadDashboardData = useCallback(async () => {
    const [marketResult, planResult] = await Promise.allSettled([
      getLiveMarketPrices(),
      profile?.id ? getCropPlansForFarmer(profile.id) : Promise.resolve([]),
    ]);
    if (marketResult.status === "fulfilled") {
      setMarketPreviewItems([...(marketResult.value.entries ?? [])].sort((a,b)=>highestDisplayedPrice(b.displayPrice)-highestDisplayedPrice(a.displayPrice)).slice(0, 3).map((entry) => ({
        crop: entry.cropName,
        price: compactPriceRange(entry.displayPrice),
      })));
      setMarketUpdatedLabel(marketResult.value.bulletinDate ?? (marketResult.value.fetchedAt ? new Date(marketResult.value.fetchedAt).toLocaleDateString() : null));
    } else {
      setMarketPreviewItems([]);
      setMarketUpdatedLabel(null);
    }
    setCropPlans(planResult.status === "fulfilled" ? planResult.value : []);
  }, [profile?.id]);

  useEffect(() => { void loadDashboardData(); }, [loadDashboardData]);

  const handleRefresh = useCallback(async () => {
    setRefreshing(true);
    await Promise.all([handleWeatherPress(), loadDashboardData()]);
    setRefreshing(false);
  }, [handleWeatherPress, loadDashboardData]);

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
      } else if (id === "growing-plan") {
        onGrowingPlan?.();
      } else if (id === "farm-tools") {
        onFarmTools?.();
      } else if (id === "trade-hub") {
        onTradeHub?.();
      }
    },
    [
      onWeatherUpdate,
      handleWeatherPress,
      onMarketPrices,
      onBuyers,
            onYieldPrediction,
      onCropRecommendation,
      onGrowingPlan,
      onFarmTools,
      onTradeHub,
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
        : "Not set";

    const plannedArea = cropPlans.reduce((sum, plan) => sum + Number(plan.cultivatedArea ?? 0), 0);
    const production = cropPlans.reduce((sum, plan) => sum + Number(plan.predictedProduction ?? 0), 0);
    const activePlans = cropPlans.filter((plan) => (plan.status ?? "active") === "active");

    return [
      { icon: "vector-square" as const, label: "Land Area", value: landArea },
      { icon: "sprout" as const, label: "Active Plans", value: String(activePlans.length) },
      { icon: "chart-line" as const, label: "Expected Production", value: production > 0 ? `${production.toFixed(1)} t` : "No data" },
      { icon: "vector-square" as const, label: "Planned Area", value: plannedArea > 0 ? `${plannedArea.toFixed(1)} ha` : "No data" },
      { icon: "map-marker-outline" as const, label: "Region", value: profile?.region || "Not set" },
      { icon: "water" as const, label: "Irrigation", value: profile?.role === "farmer" ? (profile.hasIrrigation ? "Available" : "Not available") : "Not set" },
    ];
  }, [profile, cropPlans]);

  return (
    <SafeAreaView
      style={[styles.container, { backgroundColor: colors.background }]}
    >
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            tintColor={colors.primary}
            colors={[colors.primary]}
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
            greeting={t(
              isFarmer
                ? getGreeting(now) === "Good Morning"
                  ? "goodMorningFarmer"
                  : getGreeting(now) === "Good Afternoon"
                    ? "goodAfternoonFarmer"
                    : "goodEveningFarmer"
                : getGreeting(now) === "Good Morning"
                  ? "goodMorningBuyer"
                  : getGreeting(now) === "Good Afternoon"
                    ? "goodAfternoonBuyer"
                    : "goodEveningBuyer",
            )}
            firstName={greetingName}
            now={now}
            isFarmer={isFarmer}
            onProfile={() => onProfile?.()}
            onNotifications={() => onNotifications?.()}
            onSettings={() => onSettings?.()}
            unreadCount={unreadNotifications}
          />
        </Animated.View>

        <ProfileCard profile={profile} onPress={() => onProfile?.()} />

        <WeatherCard
          region={weatherState?.locationName ?? weatherRegion}
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

        <SectionTitle title={t("quickActions")} />
        <QuickActionGrid
          actions={isFarmer ? farmerActionCards : buyerActionCards}
          onPress={handleQuickAction}
        />

        <AIInsightCard
          profile={profile}
          onLearnMore={() => onCropRecommendation?.()}
        />

        {marketPreviewItems.length > 0 ? <>
          <SectionTitle title={t("marketPrices")} actionLabel={t("viewAll")} onAction={onMarketPrices} />
          <MarketPreviewCard items={marketPreviewItems} updatedLabel={marketUpdatedLabel} onViewReport={() => onMarketPrices?.()} />
        </> : null}

        <SectionTitle
          title={isFarmer ? t("farmSummary") : t("buyerDashboard")}
        />
        <DashboardFarmSummaryCard tiles={farmTiles} />
      </ScrollView>

      <FloatingBottomNav active="home" onSelect={handleNavSelect} />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: dashboardSpacing.lg,
    paddingTop: dashboardSpacing.lg,
    paddingBottom: 156,
  },
});
