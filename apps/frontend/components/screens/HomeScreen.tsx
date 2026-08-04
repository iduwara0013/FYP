import { MaterialCommunityIcons } from "@expo/vector-icons";
import React, { useCallback, useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  Animated,
  Easing,
  FlatList,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

import { ProfileData } from "./profile-types";

const actionCards = [
  {
    id: "crop",
    icon: "leaf",
    title: "Crop Recommendation",
    description: "Get AI-powered crop suggestions",
    background: "#DCFCE7",
    iconColor: "#15803D",
  },
  {
    id: "yield",
    icon: "chart-line",
    title: "Yield Prediction",
    description: "Forecast your harvest yield",
    background: "#FEF3C7",
    iconColor: "#B45309",
  },
  {
    id: "weather",
    icon: "weather-partly-cloudy",
    title: "Weather Update",
    description: "Tap to load live weather for your region",
    background: "#DBEAFE",
    iconColor: "#2563EB",
  },
  {
    id: "market",
    icon: "currency-usd",
    title: "Market Prices",
    description: "Open the latest HARTI PDF bulletin",
    background: "#FFEDD5",
    iconColor: "#EA580C",
  },
] as const;

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

const recentPredictions = [
  { crop: "Rice", confidence: "94%", status: "Excellent", accent: "#16A34A" },
  { crop: "Wheat", confidence: "87%", status: "Good", accent: "#2563EB" },
  { crop: "Corn", confidence: "91%", status: "Excellent", accent: "#F59E0B" },
];

type HomeScreenProps = {
  profile?: ProfileData | null;
  onProfile?: () => void;
  onMarketPrices?: () => void;
  onWeatherUpdate?: () => void;
  onYieldPrediction?: () => void;
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
  onYieldPrediction,
}: HomeScreenProps) {
  const isFarmer = profile?.role !== "buyer";
  const accentColor = isFarmer ? "#0F7A3A" : "#C47F00";
  const accentSoft = isFarmer ? "#DCFCE7" : "#FEF3C7";
  const roleLabel = isFarmer ? "Farmer Profile" : "Buyer Profile";
  const cardOpacity = useRef(new Animated.Value(0)).current;
  const cardOffset = useRef(new Animated.Value(12)).current;
  const greetingName = profile?.fullName?.split(" ")[0] ?? "Farmer";
  const weatherRegion = profile?.region?.trim() || "Kandy";
  const [weatherLoading, setWeatherLoading] = useState(false);
  const [weatherError, setWeatherError] = useState("");
  const [weatherState, setWeatherState] = useState<WeatherState | null>(null);
  const [now, setNow] = useState(new Date());

  const profileMeta = isFarmer
    ? profile
      ? `Region: ${profile.region} | Land: ${profile.totalLandArea ?? "--"} ha`
      : "Region: Kandy | Land: 1.8 ha"
    : profile
      ? `Region: ${profile.region} | ${profile.organizationName ?? "Buyer"}`
      : "Region: Kandy | Buyer profile";

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

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <Animated.View
          style={[
            styles.header,
            {
              opacity: cardOpacity,
              transform: [{ translateY: cardOffset }],
            },
          ]}
        >
          <View>
            <Text style={styles.greeting}>
              {getGreeting(now)}, {greetingName}
            </Text>
            <Text style={styles.headerSubtitle}>
              Let&apos;s plan today&apos;s crop decisions.
            </Text>
          </View>
          <TouchableOpacity
            style={[styles.avatar, { backgroundColor: accentColor }]}
            onPress={onProfile}
            activeOpacity={0.8}
          >
            <MaterialCommunityIcons
              name="account-circle-outline"
              size={22}
              color="#FFFFFF"
            />
          </TouchableOpacity>
        </Animated.View>

        <Animated.View
          style={[
            styles.profileCard,
            { backgroundColor: accentColor },
            {
              opacity: cardOpacity,
              transform: [{ translateY: cardOffset }],
            },
          ]}
        >
          <View style={[styles.profileIcon, { backgroundColor: accentSoft }]}>
            <MaterialCommunityIcons
              name={isFarmer ? "sprout" : "storefront-outline"}
              size={30}
              color={accentColor}
            />
          </View>
          <View style={styles.profileInfo}>
            <Text style={styles.profileName}>
              {profile?.fullName ?? "John Farmer"}
            </Text>
            <View style={styles.roleChip}>
              <Text style={styles.roleChipText}>{roleLabel}</Text>
            </View>
            <Text style={styles.profileMeta}>{profileMeta}</Text>
          </View>
          <View style={styles.dateBox}>
            <Text style={styles.dateLabel}>Today</Text>
            <Text style={styles.dateValue}>
              {now.toLocaleDateString([], {
                month: "short",
                day: "numeric",
                year: "numeric",
              })}
            </Text>
            <Text style={styles.dateTimeValue}>
              {now.toLocaleTimeString([], {
                hour: "2-digit",
                minute: "2-digit",
                second: "2-digit",
              })}
            </Text>
          </View>
        </Animated.View>

        <Text style={styles.sectionTitle}>Quick Actions</Text>
        <View style={styles.grid}>
          {actionCards.map((card) => (
            <TouchableOpacity
              key={card.title}
              style={styles.actionCard}
              activeOpacity={0.9}
              onPress={
                card.id === "weather"
                  ? (onWeatherUpdate ?? handleWeatherPress)
                  : card.id === "yield"
                    ? onYieldPrediction
                    : card.id === "market"
                      ? onMarketPrices
                      : undefined
              }
            >
              <View
                style={[
                  styles.actionIconWrap,
                  { backgroundColor: card.background },
                ]}
              >
                <MaterialCommunityIcons
                  name={card.icon as never}
                  size={26}
                  color={card.iconColor}
                />
              </View>
              <Text style={styles.actionTitle}>{card.title}</Text>
              <Text style={styles.actionDescription}>{card.description}</Text>
            </TouchableOpacity>
          ))}
        </View>

        {weatherLoading || weatherError || weatherState ? (
          <Animated.View
            style={[
              styles.weatherCard,
              {
                opacity: cardOpacity,
                transform: [{ translateY: cardOffset }],
              },
            ]}
          >
            <View style={styles.weatherHeaderRow}>
              <View>
                <Text style={styles.weatherTitle}>Live Weather</Text>
                <Text style={styles.weatherSubtitle}>{weatherRegion}</Text>
              </View>
              <TouchableOpacity
                onPress={handleWeatherPress}
                activeOpacity={0.85}
                style={styles.refreshButton}
                disabled={weatherLoading}
              >
                {weatherLoading ? (
                  <ActivityIndicator color="#0F7A3A" />
                ) : (
                  <MaterialCommunityIcons
                    name="refresh"
                    size={18}
                    color="#0F7A3A"
                  />
                )}
              </TouchableOpacity>
            </View>

            <TouchableOpacity
              onPress={onWeatherUpdate ?? handleWeatherPress}
              activeOpacity={0.75}
              style={styles.weatherBodyPressable}
            >
              {weatherError ? (
                <Text style={styles.weatherError}>{weatherError}</Text>
              ) : weatherState ? (
                <View style={styles.weatherContent}>
                  <View style={styles.weatherIconWrap}>
                    <MaterialCommunityIcons
                      name={getWeatherIcon(weatherState.weatherCode) as never}
                      size={34}
                      color="#0F7A3A"
                    />
                  </View>
                  <View style={styles.weatherInfo}>
                    <Text style={styles.weatherLocation}>
                      {weatherState.locationName}
                    </Text>
                    <Text style={styles.weatherTemp}>
                      {Math.round(weatherState.temperature)}°C
                    </Text>
                    <Text style={styles.weatherDescription}>
                      {weatherState.description}
                    </Text>
                    <Text style={styles.weatherMetaLine}>
                      Humidity: {weatherState.humidity ?? "--"}% | Wind:{" "}
                      {weatherState.windSpeed ?? "--"} km/h
                    </Text>
                    <Text style={styles.weatherUpdated}>
                      Updated{" "}
                      {new Date(weatherState.updatedAt).toLocaleTimeString([], {
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </Text>
                  </View>
                </View>
              ) : null}

              <View style={styles.viewDetailsRow}>
                <Text style={styles.viewDetailsText}>
                  {weatherError
                    ? "View weather screen"
                    : "View full weather details"}
                </Text>
                <MaterialCommunityIcons
                  name="chevron-right"
                  size={18}
                  color="#2563EB"
                />
              </View>
            </TouchableOpacity>
          </Animated.View>
        ) : null}

        <Animated.View
          style={[
            styles.alertCard,
            {
              opacity: cardOpacity,
              transform: [{ translateY: cardOffset }],
            },
          ]}
        >
          <MaterialCommunityIcons
            name="weather-partly-rainy"
            size={26}
            color="#FFFFFF"
          />
          <View style={styles.alertTextWrap}>
            <Text style={styles.alertTitle}>Weather Alert</Text>
            <Text style={styles.alertText}>
              Moderate rainfall expected in the next 48 hours. Good timing for
              land preparation.
            </Text>
          </View>
        </Animated.View>

        <Text style={styles.sectionTitle}>Recent Predictions</Text>
        <FlatList
          horizontal
          data={recentPredictions}
          keyExtractor={(item) => item.crop}
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.predictionRow}
          renderItem={({ item }) => (
            <View style={styles.predictionCard}>
              <View style={styles.predictionHeader}>
                <Text style={styles.predictionCrop}>{item.crop}</Text>
                <View
                  style={[styles.statusDot, { backgroundColor: item.accent }]}
                />
              </View>
              <Text style={styles.predictionValue}>{item.confidence}</Text>
              <Text style={styles.predictionStatus}>{item.status}</Text>
            </View>
          )}
        />
      </ScrollView>

      <Animated.View
        style={[
          styles.bottomNav,
          {
            opacity: cardOpacity,
            transform: [{ translateY: cardOffset }],
          },
        ]}
      >
        <View style={styles.bottomNavInner}>
          <TouchableOpacity style={styles.navItemActive}>
            <MaterialCommunityIcons
              name="home-variant"
              size={24}
              color="#0F7A3A"
            />
            <Text style={styles.navItemActiveText}>Home</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.navItem}>
            <MaterialCommunityIcons
              name="chart-line"
              size={24}
              color="#64748B"
            />
            <Text style={styles.navItemText}>Predict</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.navItem}>
            <MaterialCommunityIcons
              name="bell-outline"
              size={24}
              color="#64748B"
            />
            <Text style={styles.navItemText}>Alerts</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.navItem} onPress={onProfile}>
            <MaterialCommunityIcons
              name="account-outline"
              size={24}
              color="#64748B"
            />
            <Text style={styles.navItemText}>Profile</Text>
          </TouchableOpacity>
        </View>
      </Animated.View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F8FAFC",
  },
  scrollContent: {
    paddingHorizontal: 18,
    paddingTop: 12,
    paddingBottom: 110,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 18,
  },
  greeting: {
    fontSize: 25,
    fontWeight: "800",
    color: "#0F172A",
  },
  headerSubtitle: {
    color: "#64748B",
    marginTop: 6,
  },
  avatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: "#0F7A3A",
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#0F7A3A",
    shadowOpacity: 0.2,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 6 },
    elevation: 4,
  },
  profileCard: {
    borderRadius: 26,
    padding: 18,
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
    marginBottom: 22,
  },
  profileIcon: {
    width: 58,
    height: 58,
    borderRadius: 29,
    alignItems: "center",
    justifyContent: "center",
  },
  profileInfo: {
    flex: 1,
    gap: 6,
  },
  profileName: {
    color: "#FFFFFF",
    fontWeight: "800",
    fontSize: 18,
  },
  roleChip: {
    alignSelf: "flex-start",
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 4,
    backgroundColor: "rgba(255,255,255,0.16)",
  },
  roleChipText: {
    color: "#FFFFFF",
    fontSize: 11,
    fontWeight: "700",
  },
  profileMeta: {
    color: "rgba(255,255,255,0.82)",
    lineHeight: 18,
  },
  dateBox: {
    alignItems: "flex-end",
  },
  dateLabel: {
    color: "rgba(255,255,255,0.7)",
    fontSize: 12,
  },
  dateValue: {
    color: "#FFFFFF",
    fontWeight: "700",
    marginTop: 4,
  },
  dateTimeValue: {
    color: "rgba(255,255,255,0.9)",
    fontWeight: "600",
    marginTop: 2,
    fontSize: 13,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "800",
    color: "#0F172A",
    marginBottom: 12,
  },
  grid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
    gap: 12,
    marginBottom: 16,
  },
  actionCard: {
    width: "48%",
    backgroundColor: "#FFFFFF",
    borderRadius: 22,
    padding: 16,
    shadowColor: "#0F172A",
    shadowOpacity: 0.06,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 8 },
    elevation: 4,
    minHeight: 154,
  },
  actionIconWrap: {
    width: 48,
    height: 48,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 12,
  },
  actionTitle: {
    color: "#0F172A",
    fontWeight: "800",
    fontSize: 15,
    lineHeight: 20,
  },
  actionDescription: {
    color: "#64748B",
    marginTop: 6,
    lineHeight: 19,
    fontSize: 12,
  },
  weatherCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 24,
    padding: 18,
    marginBottom: 20,
    shadowColor: "#0F172A",
    shadowOpacity: 0.06,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 8 },
    elevation: 4,
  },
  weatherHeaderRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 12,
  },
  weatherTitle: {
    color: "#0F172A",
    fontWeight: "800",
    fontSize: 16,
  },
  weatherSubtitle: {
    color: "#64748B",
    marginTop: 4,
  },
  refreshButton: {
    width: 38,
    height: 38,
    borderRadius: 19,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#DCFCE7",
  },
  weatherContent: {
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
  },
  weatherIconWrap: {
    width: 64,
    height: 64,
    borderRadius: 20,
    backgroundColor: "#EEFDF3",
    alignItems: "center",
    justifyContent: "center",
  },
  weatherInfo: {
    flex: 1,
    gap: 4,
  },
  weatherLocation: {
    color: "#0F172A",
    fontWeight: "800",
    fontSize: 14,
  },
  weatherTemp: {
    color: "#0F7A3A",
    fontSize: 28,
    fontWeight: "900",
  },
  weatherDescription: {
    color: "#334155",
    fontWeight: "700",
  },
  weatherMetaLine: {
    color: "#64748B",
    fontSize: 12,
  },
  weatherUpdated: {
    color: "#94A3B8",
    fontSize: 11,
  },
  weatherBodyPressable: {
    borderRadius: 16,
  },
  viewDetailsRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    marginTop: 12,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: "#E2E8F0",
  },
  viewDetailsText: {
    color: "#2563EB",
    fontWeight: "700",
    fontSize: 13,
  },
  weatherError: {
    color: "#B91C1C",
    fontWeight: "600",
  },
  marketCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 24,
    padding: 18,
    marginBottom: 20,
    shadowColor: "#0F172A",
    shadowOpacity: 0.06,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 8 },
    elevation: 4,
  },
  marketHeaderRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 12,
  },
  marketTitle: {
    color: "#0F172A",
    fontWeight: "800",
    fontSize: 16,
  },
  marketSubtitle: {
    color: "#64748B",
    marginTop: 4,
  },
  marketBody: {
    gap: 10,
  },
  marketMeta: {
    color: "#475569",
    fontSize: 12,
    lineHeight: 18,
  },
  marketList: {
    gap: 10,
  },
  marketItem: {
    borderRadius: 16,
    backgroundColor: "#FFF7ED",
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderWidth: 1,
    borderColor: "#FED7AA",
  },
  marketCrop: {
    color: "#9A3412",
    fontWeight: "700",
    fontSize: 13,
  },
  marketDetail: {
    marginTop: 4,
    color: "#C2410C",
    fontSize: 11,
  },
  marketError: {
    color: "#B91C1C",
    fontWeight: "600",
  },
  alertCard: {
    backgroundColor: "#2563EB",
    borderRadius: 24,
    padding: 18,
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 12,
    marginBottom: 20,
  },
  alertTextWrap: {
    flex: 1,
  },
  alertTitle: {
    color: "#FFFFFF",
    fontWeight: "800",
    fontSize: 16,
  },
  alertText: {
    color: "rgba(255,255,255,0.92)",
    marginTop: 6,
    lineHeight: 20,
  },
  predictionRow: {
    gap: 12,
    paddingBottom: 6,
  },
  predictionCard: {
    width: 160,
    backgroundColor: "#FFFFFF",
    borderRadius: 20,
    padding: 16,
    shadowColor: "#0F172A",
    shadowOpacity: 0.06,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 8 },
    elevation: 4,
  },
  predictionHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  predictionCrop: {
    color: "#0F172A",
    fontWeight: "800",
  },
  statusDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  predictionValue: {
    color: "#0F172A",
    fontSize: 28,
    fontWeight: "900",
    marginTop: 18,
  },
  predictionStatus: {
    color: "#64748B",
    marginTop: 4,
  },
  bottomNav: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "#FFFFFF",
    borderTopWidth: 1,
    borderTopColor: "#E2E8F0",
    paddingVertical: 10,
    paddingHorizontal: 14,
  },
  bottomNavInner: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  navItem: {
    alignItems: "center",
    justifyContent: "center",
    flex: 1,
    gap: 4,
  },
  navItemActive: {
    alignItems: "center",
    justifyContent: "center",
    flex: 1,
    gap: 4,
  },
  navItemText: {
    color: "#64748B",
    fontSize: 11,
    fontWeight: "700",
  },
  navItemActiveText: {
    color: "#0F7A3A",
    fontSize: 11,
    fontWeight: "800",
  },
});
