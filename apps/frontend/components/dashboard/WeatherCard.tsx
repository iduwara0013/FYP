import { MaterialCommunityIcons } from "@expo/vector-icons";
import React from "react";
import {
    ActivityIndicator,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from "react-native";

import { getWeatherDescription, getWeatherIcon } from "../../lib/weather";
import { useTheme } from "../../context/ThemeContext";
import {
    dashboardRadius,
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
  const { theme } = useTheme();
  const { colors } = theme;
  const icon =
    weatherCode !== null
      ? getWeatherIcon(weatherCode)
      : "weather-partly-cloudy";
  const description =
    weatherCode !== null
      ? getWeatherDescription(weatherCode)
      : "Loading weather…";

  return (
    <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }, theme.shadows.card]}> 
      <View style={styles.headerRow}>
        <View style={styles.headerText}>
          <View style={styles.liveRow}><View style={[styles.liveDot,{backgroundColor:error?colors.danger:colors.success}]}/><Text style={[styles.title,{color:colors.text}]}>Live weather</Text></View>
          <Text style={[styles.subtitle,{color:colors.textMuted}]}>{region}</Text>
        </View>
        <TouchableOpacity
          style={[styles.refreshButton,{backgroundColor:colors.weatherSoft}]}
          onPress={onRefresh}
          activeOpacity={0.8}
          disabled={loading}
          accessibilityLabel="Refresh weather"
        >
          {loading ? (
            <ActivityIndicator color={colors.weather} size="small" />
          ) : (
            <MaterialCommunityIcons
              name="refresh"
              size={18}
              color={colors.weather}
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
          <View style={[styles.errorBox,{backgroundColor:colors.dangerSoft}]}><MaterialCommunityIcons name="cloud-alert-outline" size={20} color={colors.danger}/><Text style={[styles.errorText,{color:colors.danger}]}>{error}</Text></View>
        ) : (
          <>
            <View style={styles.mainRow}>
              <View style={[styles.iconWrap,{backgroundColor:colors.weatherSoft}]}> 
                <MaterialCommunityIcons
                  name={icon}
                  size={44}
                  color={colors.weather}
                />
              </View>
              <View style={styles.tempWrap}>
                <Text style={[styles.temp,{color:colors.text}]}> 
                  {temperature !== null
                    ? `${Math.round(temperature)}°C`
                    : "--°C"}
                </Text>
                <Text style={[styles.condition,{color:colors.weather}]}>{description}</Text>
                {locationName ? (
                  <Text style={[styles.location,{color:colors.textMuted}]} numberOfLines={1}>
                    {locationName}
                  </Text>
                ) : null}
              </View>
            </View>

            <View style={[styles.metricsRow,{backgroundColor:colors.background}]}> 
              <Metric
                icon="water-percent"
                label="Humidity"
                value={humidity !== null ? `${humidity}%` : "--"}
                color={colors.weather}
                textColor={colors.text}
                mutedColor={colors.textMuted}
              />
              <Metric
                icon="weather-windy"
                label="Wind"
                value={windSpeed !== null ? `${windSpeed} km/h` : "--"}
                color={colors.primary}
                textColor={colors.text}
                mutedColor={colors.textMuted}
              />
            </View>

            {updatedAt ? (
              <Text style={[styles.updated,{color:colors.textMuted}]}> 
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
    </View>
  );
}

function Metric({
  icon,
  label,
  value,
  color,
  textColor,
  mutedColor,
}: {
  icon: keyof typeof MaterialCommunityIcons.glyphMap;
  label: string;
  value: string;
  color: string;
  textColor: string;
  mutedColor: string;
}) {
  return (
    <View style={styles.metric}>
      <MaterialCommunityIcons
        name={icon}
        size={15}
        color={color}
      />
      <Text style={[styles.metricValue,{color:textColor}]}>{value}</Text>
      <Text style={[styles.metricLabel,{color:mutedColor}]}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: dashboardRadius.xl,
    padding: dashboardSpacing.xl,
    marginBottom: dashboardSpacing.lg,
    borderWidth: 1,
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
  },
  liveRow: { flexDirection: "row", alignItems: "center", gap: 7 }, liveDot: { width: 8, height: 8, borderRadius: 4 },
  subtitle: {
    fontSize: 12,
    marginTop: 2,
  },
  refreshButton: {
    width: 38,
    height: 38,
    borderRadius: 13,
    alignItems: "center",
    justifyContent: "center",
  },
  body: {
    gap: dashboardSpacing.lg,
  },
  errorText: {
    fontWeight: "600",
    fontSize: 13,
    flex: 1,
  },
  errorBox: { flexDirection: "row", alignItems: "center", gap: 8, borderRadius: 14, padding: 13 },
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
  },
  tempWrap: {
    flex: 1,
  },
  temp: {
    fontSize: 40,
    fontWeight: "900",
  },
  condition: {
    fontSize: 15,
    fontWeight: "700",
    marginTop: 2,
  },
  location: {
    fontSize: 12,
    marginTop: 2,
  },
  metricsRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    borderRadius: dashboardRadius.lg,
    paddingVertical: dashboardSpacing.md,
    paddingHorizontal: dashboardSpacing.md,
    gap: dashboardSpacing.sm,
  },
  metric: {
    flex: 1,
    alignItems: "center",
    gap: 2,
  },
  metricValue: {
    fontSize: 13,
    fontWeight: "800",
    marginTop: 2,
  },
  metricLabel: {
    fontSize: 9,
    fontWeight: "600",
    textTransform: "uppercase",
    letterSpacing: 0.3,
  },
  updated: {
    fontSize: 11,
    textAlign: "center",
  },
});
