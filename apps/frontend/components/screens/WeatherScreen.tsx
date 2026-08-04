import { MaterialCommunityIcons } from "@expo/vector-icons";
import * as Location from "expo-location";
import React, { useCallback, useEffect, useState } from "react";
import {
  ActivityIndicator,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

import {
  fetchWeatherForCoordinates,
  fetchWeatherForRegion,
  getWeatherIcon,
  WeatherState,
} from "../../lib/weather";

type WeatherScreenProps = {
  region: string;
  onBackToHome: () => void;
};

type LocationInfo = {
  latitude: number;
  longitude: number;
  label: string;
  source: "gps" | "region";
};

function formatUpdatedAt(iso: string) {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) {
    return "--";
  }
  return date.toLocaleString([], {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

async function resolveLocation(region: string): Promise<LocationInfo> {
  try {
    const { status } = await Location.requestForegroundPermissionsAsync();

    if (status === "granted") {
      const position = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Balanced,
      });

      if (position?.coords) {
        const { latitude, longitude } = position.coords;
        let label = `${latitude.toFixed(2)}°, ${longitude.toFixed(2)}°`;

        try {
          const [placemark] = await Location.reverseGeocodeAsync({
            latitude,
            longitude,
          });

          if (placemark) {
            const parts = [
              placemark.city,
              placemark.district,
              placemark.region,
              placemark.country,
            ].filter((part): part is string => Boolean(part));

            if (parts.length > 0) {
              label = parts.join(", ");
            }
          }
        } catch {
          // Keep the coordinate label if reverse geocoding fails
        }

        return {
          latitude,
          longitude,
          label,
          source: "gps",
        };
      }
    }
  } catch {
    // Fall through to region-based lookup
  }

  return {
    latitude: 0,
    longitude: 0,
    label: region,
    source: "region",
  };
}

type MetricItem = {
  key: string;
  label: string;
  value: string;
  icon: "water-percent" | "weather-windy" | "map-marker-outline";
  tint: string;
  background: string;
};

export function WeatherScreen({ region, onBackToHome }: WeatherScreenProps) {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [weather, setWeather] = useState<WeatherState | null>(null);
  const [locationSource, setLocationSource] = useState<"gps" | "region">(
    "region",
  );

  const loadWeather = useCallback(async () => {
    try {
      setLoading(true);
      setError("");

      const location = await resolveLocation(region);
      setLocationSource(location.source);

      const result =
        location.source === "gps"
          ? await fetchWeatherForCoordinates(
              location.latitude,
              location.longitude,
              location.label,
            )
          : await fetchWeatherForRegion(location.label);

      setWeather(result);
    } catch (requestError) {
      setWeather(null);
      setError(
        requestError instanceof Error
          ? requestError.message
          : "Unable to load weather details.",
      );
    } finally {
      setLoading(false);
    }
  }, [region]);

  useEffect(() => {
    void loadWeather();
  }, [loadWeather]);

  const metrics: MetricItem[] = weather
    ? [
        {
          key: "humidity",
          label: "Humidity",
          value:
            weather.humidity != null
              ? `${Math.round(weather.humidity)}%`
              : "--",
          icon: "water-percent",
          tint: "#2563EB",
          background: "#DBEAFE",
        },
        {
          key: "wind",
          label: "Wind Speed",
          value:
            weather.windSpeed != null
              ? `${Math.round(weather.windSpeed)} km/h`
              : "--",
          icon: "weather-windy",
          tint: "#0F7A3A",
          background: "#DCFCE7",
        },
        {
          key: "location",
          label: "Coordinates",
          value: `${weather.latitude.toFixed(2)}°, ${weather.longitude.toFixed(2)}°`,
          icon: "map-marker-outline",
          tint: "#B45309",
          background: "#FEF3C7",
        },
      ]
    : [];

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.topBlob} />
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.headerRow}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={onBackToHome}
            activeOpacity={0.85}
          >
            <MaterialCommunityIcons
              name="arrow-left"
              size={22}
              color="#0F172A"
            />
            <Text style={styles.backButtonText}>Home</Text>
          </TouchableOpacity>
          <View style={styles.headerIconWrap}>
            <MaterialCommunityIcons
              name="weather-partly-cloudy"
              size={22}
              color="#2563EB"
            />
          </View>
        </View>

        <Text style={styles.title}>Weather Details</Text>
        <Text style={styles.subtitle}>
          Live conditions based on your{" "}
          {locationSource === "gps"
            ? "current GPS location"
            : `region: ${region}`}
          .
        </Text>

        {locationSource === "gps" && weather ? (
          <View style={styles.gpsBadge}>
            <MaterialCommunityIcons
              name="crosshairs-gps"
              size={16}
              color="#0F7A3A"
            />
            <Text style={styles.gpsBadgeText}>Using your current location</Text>
          </View>
        ) : null}

        {loading ? (
          <View style={styles.centerState}>
            <ActivityIndicator color="#2563EB" size="large" />
            <Text style={styles.centerText}>Loading live weather…</Text>
          </View>
        ) : error ? (
          <View style={styles.errorCard}>
            <MaterialCommunityIcons
              name="cloud-alert-outline"
              size={44}
              color="#B91C1C"
            />
            <Text style={styles.errorText}>{error}</Text>
            <TouchableOpacity
              style={styles.retryButton}
              onPress={loadWeather}
              activeOpacity={0.85}
            >
              <MaterialCommunityIcons
                name="refresh"
                size={18}
                color="#FFFFFF"
              />
              <Text style={styles.retryButtonText}>Try again</Text>
            </TouchableOpacity>
          </View>
        ) : weather ? (
          <>
            <View style={styles.heroCard}>
              <View style={styles.heroTopRow}>
                <View style={styles.heroIconWrap}>
                  <MaterialCommunityIcons
                    name={getWeatherIcon(weather.weatherCode) as never}
                    size={52}
                    color="#2563EB"
                  />
                </View>
                <Text style={styles.heroTemp}>
                  {Math.round(weather.temperature)}°C
                </Text>
              </View>
              <Text style={styles.heroLocation}>{weather.locationName}</Text>
              <Text style={styles.heroDescription}>{weather.description}</Text>
              <Text style={styles.heroUpdated}>
                Updated {formatUpdatedAt(weather.updatedAt)}
              </Text>
            </View>

            <Text style={styles.sectionTitle}>Current Conditions</Text>
            <View style={styles.metricsGrid}>
              {metrics.map((metric) => (
                <View key={metric.key} style={styles.metricCard}>
                  <View
                    style={[
                      styles.metricIconWrap,
                      { backgroundColor: metric.background },
                    ]}
                  >
                    <MaterialCommunityIcons
                      name={metric.icon}
                      size={24}
                      color={metric.tint}
                    />
                  </View>
                  <Text style={styles.metricLabel}>{metric.label}</Text>
                  <Text style={styles.metricValue}>{metric.value}</Text>
                </View>
              ))}
            </View>

            <View style={styles.card}>
              <View style={styles.cardHeaderRow}>
                <MaterialCommunityIcons
                  name="information-outline"
                  size={20}
                  color="#0F7A3A"
                />
                <Text style={styles.cardTitle}>Forecast Note</Text>
              </View>
              <Text style={styles.cardText}>
                Current conditions are fetched live for{" "}
                {locationSource === "gps"
                  ? "your current GPS location"
                  : region}
                . Expect conditions to vary through the day. Refresh anytime for
                the latest update from the weather service.
              </Text>
            </View>

            <TouchableOpacity
              style={styles.refreshFullButton}
              onPress={loadWeather}
              activeOpacity={0.9}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator color="#FFFFFF" />
              ) : (
                <MaterialCommunityIcons
                  name="refresh"
                  size={20}
                  color="#FFFFFF"
                />
              )}
              <Text style={styles.refreshFullText}>Refresh Weather</Text>
            </TouchableOpacity>
          </>
        ) : null}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F8FAFC",
  },
  topBlob: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    height: 220,
    backgroundColor: "#DBEAFE",
    borderBottomLeftRadius: 60,
    borderBottomRightRadius: 60,
  },
  scrollContent: {
    paddingHorizontal: 18,
    paddingTop: 12,
    paddingBottom: 40,
  },
  headerRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 18,
  },
  backButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: "#FFFFFF",
    borderRadius: 999,
    paddingHorizontal: 14,
    paddingVertical: 10,
    shadowColor: "#0F172A",
    shadowOpacity: 0.06,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 6 },
    elevation: 3,
  },
  backButtonText: {
    color: "#0F172A",
    fontWeight: "700",
    fontSize: 14,
  },
  headerIconWrap: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: "#FFFFFF",
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#0F172A",
    shadowOpacity: 0.06,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 6 },
    elevation: 3,
  },
  title: {
    fontSize: 28,
    fontWeight: "900",
    color: "#0F172A",
  },
  subtitle: {
    color: "#64748B",
    marginTop: 6,
    marginBottom: 12,
    lineHeight: 20,
  },
  gpsBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    alignSelf: "flex-start",
    backgroundColor: "#DCFCE7",
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 6,
    marginBottom: 16,
  },
  gpsBadgeText: {
    color: "#0F7A3A",
    fontWeight: "700",
    fontSize: 12,
  },
  centerState: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 60,
    gap: 14,
  },
  centerText: {
    color: "#64748B",
    fontWeight: "600",
  },
  errorCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 24,
    padding: 28,
    alignItems: "center",
    gap: 14,
    shadowColor: "#0F172A",
    shadowOpacity: 0.06,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 8 },
    elevation: 4,
  },
  errorText: {
    color: "#B91C1C",
    fontWeight: "600",
    textAlign: "center",
    lineHeight: 20,
  },
  retryButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    backgroundColor: "#2563EB",
    borderRadius: 999,
    paddingHorizontal: 18,
    paddingVertical: 12,
  },
  retryButtonText: {
    color: "#FFFFFF",
    fontWeight: "700",
  },
  heroCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 28,
    padding: 22,
    shadowColor: "#0F172A",
    shadowOpacity: 0.08,
    shadowRadius: 18,
    shadowOffset: { width: 0, height: 10 },
    elevation: 5,
    marginBottom: 20,
  },
  heroTopRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  heroIconWrap: {
    width: 88,
    height: 88,
    borderRadius: 28,
    backgroundColor: "#DBEAFE",
    alignItems: "center",
    justifyContent: "center",
  },
  heroTemp: {
    fontSize: 56,
    fontWeight: "900",
    color: "#0F172A",
  },
  heroLocation: {
    color: "#0F172A",
    fontWeight: "800",
    fontSize: 20,
    marginTop: 16,
  },
  heroDescription: {
    color: "#2563EB",
    fontWeight: "700",
    fontSize: 16,
    marginTop: 4,
  },
  heroUpdated: {
    color: "#94A3B8",
    fontSize: 12,
    marginTop: 10,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "800",
    color: "#0F172A",
    marginBottom: 12,
  },
  metricsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
    gap: 12,
    marginBottom: 20,
  },
  metricCard: {
    width: "48%",
    backgroundColor: "#FFFFFF",
    borderRadius: 22,
    padding: 16,
    shadowColor: "#0F172A",
    shadowOpacity: 0.06,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 8 },
    elevation: 4,
  },
  metricIconWrap: {
    width: 44,
    height: 44,
    borderRadius: 15,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 12,
  },
  metricLabel: {
    color: "#64748B",
    fontSize: 12,
    fontWeight: "600",
  },
  metricValue: {
    color: "#0F172A",
    fontSize: 16,
    fontWeight: "800",
    marginTop: 4,
  },
  card: {
    backgroundColor: "#FFFFFF",
    borderRadius: 22,
    padding: 18,
    marginBottom: 20,
    shadowColor: "#0F172A",
    shadowOpacity: 0.06,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 8 },
    elevation: 4,
  },
  cardHeaderRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 8,
  },
  cardTitle: {
    color: "#0F172A",
    fontWeight: "800",
    fontSize: 15,
  },
  cardText: {
    color: "#475569",
    lineHeight: 20,
  },
  refreshFullButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    backgroundColor: "#2563EB",
    borderRadius: 999,
    paddingVertical: 14,
  },
  refreshFullText: {
    color: "#FFFFFF",
    fontWeight: "800",
    fontSize: 15,
  },
});
