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

import {
  ActivityTimeline,
  BuyerHeader,
  BuyerProfileCard,
  BuyerSummary,
  BuyerTipCard,
  BuyerWeatherCard,
  MarketInsightCard,
  MarketPriceCards,
  QuickActionGrid,
  RecommendedFarmers,
  SectionTitle,
  type ActivityItem,
  type BuyerQuickAction,
  type FarmerCard,
  type MarketPriceItem,
  type SummaryTile,
} from "../buyer/BuyerComponents";
import { buyerColors, buyerSpacing } from "../buyer/theme";
import { ProfileData } from "./profile-types";

type BuyerHomeScreenProps = {
  profile: ProfileData;
  onMarketPrices: () => void;
  onWeatherUpdate: () => void;
  onBrowsePeople: () => void;
  onProfile: () => void;
  onNotifications?: () => void;
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

export function BuyerHomeScreen({
  profile,
  onMarketPrices,
  onWeatherUpdate,
  onBrowsePeople,
  onProfile,
  onNotifications,
  unreadNotifications = 0,
}: BuyerHomeScreenProps) {
  const cardOpacity = useRef(new Animated.Value(0)).current;
  const cardOffset = useRef(new Animated.Value(12)).current;
  const greetingName = profile?.fullName?.split(" ")[0] ?? "Buyer";
  const weatherRegion = profile?.region?.trim() || "Kandy";
  const [weatherLoading, setWeatherLoading] = useState(false);
  const [weatherError, setWeatherError] = useState("");
  const [weatherState, setWeatherState] = useState<{
    locationName: string;
    temperature: number;
    humidity: number | null;
    windSpeed: number | null;
    weatherCode: number;
    description: string;
    updatedAt: string;
  } | null>(null);
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

  const quickActions: BuyerQuickAction[] = useMemo(
    () => [
      {
        id: "weather",
        icon: "weather-partly-cloudy",
        title: "Weather",
        description: "Check local forecast",
        background: "#DBEAFE",
        iconColor: "#2563EB",
      },
      {
        id: "market",
        icon: "currency-usd",
        title: "Market Prices",
        description: "Latest HARTI prices",
        background: "#FFEDD5",
        iconColor: "#EA580C",
      },
      {
        id: "browse",
        icon: "account-group-outline",
        title: "Browse Farmers",
        description: "Connect with sellers",
        background: "#E0E7FF",
        iconColor: "#4338CA",
      },
      {
        id: "requirements",
        icon: "clipboard-text-outline",
        title: "Requirements",
        description: "Manage your needs",
        background: "#FCE7F3",
        iconColor: "#BE185D",
      },
      {
        id: "history",
        icon: "history",
        title: "Purchase History",
        description: "Past orders",
        background: "#DCFCE7",
        iconColor: "#15803D",
      },
      {
        id: "saved",
        icon: "star-outline",
        title: "Saved Farmers",
        description: "Your favorites",
        background: "#FEF3C7",
        iconColor: "#B45309",
      },
    ],
    [],
  );

  const handleQuickAction = useCallback(
    (id: string) => {
      if (id === "weather") onWeatherUpdate();
      else if (id === "market") onMarketPrices();
      else if (id === "browse") onBrowsePeople();
    },
    [onWeatherUpdate, onMarketPrices, onBrowsePeople],
  );

  const marketItems: MarketPriceItem[] = useMemo(
    () => [
      {
        crop: "Rice",
        price: "Rs 185/kg",
        change: "+2.5%",
        trend: "up",
        updated: "Updated 10:30 AM",
      },
      {
        crop: "Tomato",
        price: "Rs 150/kg",
        change: "-1.2%",
        trend: "down",
        updated: "Updated 10:30 AM",
      },
      {
        crop: "Carrot",
        price: "Rs 220/kg",
        change: "+0.8%",
        trend: "up",
        updated: "Updated 10:30 AM",
      },
      {
        crop: "Beans",
        price: "Rs 195/kg",
        change: "+3.1%",
        trend: "up",
        updated: "Updated 10:30 AM",
      },
    ],
    [],
  );

  const summaryTiles: SummaryTile[] = useMemo(
    () => [
      {
        icon: "office-building-outline",
        label: "Organization",
        value:
          profile.role === "buyer" ? (profile.organizationName ?? "—") : "—",
      },
      {
        icon: "sprout-outline",
        label: "Preferred Crop",
        value: profile.role === "buyer" ? (profile.preferredCrop ?? "—") : "—",
      },
      {
        icon: "scale",
        label: "Required Qty",
        value:
          profile.role === "buyer" && profile.requiredQuantity != null
            ? `${profile.requiredQuantity} kg`
            : "—",
      },
      {
        icon: "warehouse",
        label: "Storage",
        value:
          profile.role === "buyer" ? (profile.hasStorage ? "Yes" : "No") : "—",
      },
      {
        icon: "truck-outline",
        label: "Transport",
        value:
          profile.role === "buyer"
            ? profile.hasTransport
              ? "Yes"
              : "No"
            : "—",
      },
      { icon: "map-marker-outline", label: "Region", value: profile.region },
      { icon: "account-group", label: "Nearby Farmers", value: "24" },
    ],
    [profile],
  );

  const farmers: FarmerCard[] = useMemo(
    () => [
      {
        id: "1",
        name: "Prabhath Silva",
        region: "Kandy",
        rating: 4.8,
        crops: "Rice, Carrot",
        onContact: () => onBrowsePeople(),
      },
      {
        id: "2",
        name: "Nimal Perera",
        region: "Nuwara Eliya",
        rating: 4.6,
        crops: "Tomato, Leeks",
        onContact: () => onBrowsePeople(),
      },
      {
        id: "3",
        name: "Kumari Jaya",
        region: "Badulla",
        rating: 4.9,
        crops: "Beans, Cabbage",
        onContact: () => onBrowsePeople(),
      },
    ],
    [onBrowsePeople],
  );

  const activities: ActivityItem[] = useMemo(
    () => [
      {
        icon: "cart-outline",
        title: "Purchased Tomatoes",
        time: "2 hours ago",
        color: "#16A34A",
      },
      {
        icon: "eye-outline",
        title: "Viewed Rice Prices",
        time: "Yesterday",
        color: "#2563EB",
      },
      {
        icon: "account-plus-outline",
        title: "Connected with Farmer",
        time: "2 days ago",
        color: "#C47F00",
      },
      {
        icon: "clipboard-edit-outline",
        title: "Updated Requirement",
        time: "3 days ago",
        color: "#BE185D",
      },
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
            tintColor={buyerColors.primary}
            colors={[buyerColors.primary]}
          />
        }
      >
        <Animated.View
          style={{
            opacity: cardOpacity,
            transform: [{ translateY: cardOffset }],
          }}
        >
          <BuyerHeader
            greeting={getGreeting(now)}
            firstName={greetingName}
            now={now}
            onProfile={() => onProfile()}
            onNotifications={() => onNotifications?.()}
            unreadCount={unreadNotifications}
          />
        </Animated.View>

        <Animated.View
          style={{
            opacity: cardOpacity,
            transform: [{ translateY: cardOffset }],
          }}
        >
          <BuyerProfileCard profile={profile} onPress={() => onProfile()} />
        </Animated.View>

        <Animated.View
          style={{
            opacity: cardOpacity,
            transform: [{ translateY: cardOffset }],
          }}
        >
          <BuyerWeatherCard
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
            onPress={onWeatherUpdate}
          />
        </Animated.View>

        <Animated.View
          style={{
            opacity: cardOpacity,
            transform: [{ translateY: cardOffset }],
          }}
        >
          <MarketInsightCard
            message="📈 Tomato prices expected to increase tomorrow. Consider placing purchase orders today."
            onLearnMore={() => onMarketPrices()}
          />
        </Animated.View>

        <Animated.View
          style={{
            opacity: cardOpacity,
            transform: [{ translateY: cardOffset }],
          }}
        >
          <SectionTitle title="Quick Actions" />
          <QuickActionGrid actions={quickActions} onPress={handleQuickAction} />
        </Animated.View>

        <Animated.View
          style={{
            opacity: cardOpacity,
            transform: [{ translateY: cardOffset }],
          }}
        >
          <SectionTitle title="Today's Market" />
          <MarketPriceCards
            items={marketItems}
            onViewReport={() => onMarketPrices()}
          />
        </Animated.View>

        <Animated.View
          style={{
            opacity: cardOpacity,
            transform: [{ translateY: cardOffset }],
          }}
        >
          <SectionTitle title="Buyer Summary" />
          <BuyerSummary tiles={summaryTiles} />
        </Animated.View>

        <Animated.View
          style={{
            opacity: cardOpacity,
            transform: [{ translateY: cardOffset }],
          }}
        >
          <SectionTitle title="Recommended Farmers" />
          <RecommendedFarmers farmers={farmers} />
        </Animated.View>

        <Animated.View
          style={{
            opacity: cardOpacity,
            transform: [{ translateY: cardOffset }],
          }}
        >
          <SectionTitle title="Recent Activity" />
          <ActivityTimeline items={activities} />
        </Animated.View>

        <Animated.View
          style={{
            opacity: cardOpacity,
            transform: [{ translateY: cardOffset }],
          }}
        >
          <BuyerTipCard message="Connect with farmers in high-supply regions like Kandy for the best wholesale prices this week." />
        </Animated.View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: buyerColors.background,
  },
  scrollContent: {
    paddingHorizontal: buyerSpacing.lg,
    paddingTop: buyerSpacing.lg,
    paddingBottom: 100,
  },
});
