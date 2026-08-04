import { MaterialCommunityIcons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import React from "react";
import {
    ActivityIndicator,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from "react-native";

import { getWeatherDescription, getWeatherIcon } from "../../lib/weather";
import {
    dashboardColors,
    dashboardRadius,
    dashboardShadow,
    dashboardSpacing,
} from "./theme";

type WeatherCardProps = {
  region: string;
  loading: boolean;
  error: string;
  temperature: number | null;
  humidity: number | null;
  windSpeed: number | null;
  weatherCode: number | null;
  locationName: string | null;
  updatedAt: string | null;
  onRefresh: () => void;
  onPress: () => void;
};

export function WeatherCard({
  region,
  loading,
  error,
  temperature,
  humidity,
  windSpeed,
  weatherCode,
  locationName,
  updatedAt,
  onRefresh,
  onPress,
}: WeatherCardProps) {
  const icon =
    weatherCode !== null
      ? getWeatherIcon(weatherCode)
      : "weather-partly-cloudy";
  const description =
    weatherCode !== null
      ? getWeatherDescription(weatherCode)
      : "Loading weather…";

  return (
    <LinearGradient
      colors={["#0F7A3A", "#16A34A", "#22C55E"]}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={styles.card}
    >
      <View style={styles.headerRow}>
        <View style={styles.headerText}>
          <Text style={styles.title}>Live Weather</Text>
          <Text style={styles.subtitle}>{region}</Text>
        </View>
        <TouchableOpacity
          style={styles.refreshButton}
          onPress={onRefresh}
          activeOpacity={0.8}
          disabled={loading}
          accessibilityLabel="Refresh weather"
        >
          {loading ? (
            <ActivityIndicator color={dashboardColors.white} size="small" />
          ) : (
            <MaterialCommunityIcons
              name="refresh"
              size={18}
              color={dashboardColors.white}
            />
          )}
        </TouchableOpacity>
      </View>

      <TouchableOpacity
        style={styles.body}
        onPress={onPress}
        activeOpacity={0.85}
      >
        {error ? (
          <Text style={styles.errorText}>{error}</Text>
        ) : (
          <>
            <View style={styles.mainRow}>
              <View style={styles.iconWrap}>
                <MaterialCommunityIcons
                  name={icon}
                  size={44}
                  color={dashboardColors.white}
                />
              </View>
              <View style={styles.tempWrap}>
                <Text style={styles.temp}>
                  {temperature !== null
                    ? `${Math.round(temperature)}°C`
                    : "--°C"}
                </Text>
                <Text style={styles.condition}>{description}</Text>
                {locationName ? (
                  <Text style={styles.location} numberOfLines={1}>
                    {locationName}
                  </Text>
                ) : null}
              </View>
            </View>

            <View style={styles.metricsRow}>
              <Metric
                icon="water-percent"
                label="Humidity"
                value={humidity !== null ? `${humidity}%` : "--"}
              />
              <Metric
                icon="weather-windy"
                label="Wind"
                value={windSpeed !== null ? `${windSpeed} km/h` : "--"}
              />
              <Metric icon="weather-rainy" label="Rain" value="40%" />
              <Metric icon="white-balance-sunny" label="UV" value="6" />
            </View>

            {updatedAt ? (
              <Text style={styles.updated}>
                Updated{" "}
                {new Date(updatedAt).toLocaleTimeString([], {
                  hour: "2-digit",
                  minute: "2-digit",
                })}
              </Text>
            ) : null}
          </>
        )}
      </TouchableOpacity>
    </LinearGradient>
  );
}

function Metric({
  icon,
  label,
  value,
}: {
  icon: keyof typeof MaterialCommunityIcons.glyphMap;
  label: string;
  value: string;
}) {
  return (
    <View style={styles.metric}>
      <MaterialCommunityIcons
        name={icon}
        size={15}
        color="rgba(255,255,255,0.9)"
      />
      <Text style={styles.metricValue}>{value}</Text>
      <Text style={styles.metricLabel}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: dashboardRadius.xl,
    padding: dashboardSpacing.xl,
    marginBottom: dashboardSpacing.lg,
    ...dashboardShadow.card,
  },
  headerRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: dashboardSpacing.md,
  },
  headerText: {
    flex: 1,
  },
  title: {
    fontSize: 15,
    fontWeight: "800",
    color: dashboardColors.white,
  },
  subtitle: {
    fontSize: 12,
    color: "rgba(255,255,255,0.85)",
    marginTop: 2,
  },
  refreshButton: {
    width: 38,
    height: 38,
    borderRadius: 19,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(255,255,255,0.2)",
  },
  body: {
    gap: dashboardSpacing.lg,
  },
  errorText: {
    color: dashboardColors.white,
    fontWeight: "600",
    fontSize: 13,
  },
  mainRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: dashboardSpacing.lg,
  },
  iconWrap: {
    width: 72,
    height: 72,
    borderRadius: 24,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(255,255,255,0.18)",
  },
  tempWrap: {
    flex: 1,
  },
  temp: {
    fontSize: 40,
    fontWeight: "900",
    color: dashboardColors.white,
  },
  condition: {
    fontSize: 15,
    fontWeight: "700",
    color: dashboardColors.white,
    marginTop: 2,
  },
  location: {
    fontSize: 12,
    color: "rgba(255,255,255,0.85)",
    marginTop: 2,
  },
  metricsRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    backgroundColor: "rgba(255,255,255,0.14)",
    borderRadius: dashboardRadius.lg,
    paddingVertical: dashboardSpacing.md,
    paddingHorizontal: dashboardSpacing.sm,
  },
  metric: {
    flex: 1,
    alignItems: "center",
    gap: 2,
  },
  metricValue: {
    fontSize: 13,
    fontWeight: "800",
    color: dashboardColors.white,
    marginTop: 2,
  },
  metricLabel: {
    fontSize: 9,
    fontWeight: "600",
    color: "rgba(255,255,255,0.8)",
    textTransform: "uppercase",
    letterSpacing: 0.3,
  },
  updated: {
    fontSize: 11,
    color: "rgba(255,255,255,0.8)",
    textAlign: "center",
  },
});
