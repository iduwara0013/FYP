import { MaterialCommunityIcons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import React from "react";
import {
  ActivityIndicator,
  FlatList,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

import { getWeatherDescription, getWeatherIcon } from "../../lib/weather";
import { NotificationBadge } from "../notifications/NotificationComponents";
import type { ProfileData } from "../screens/profile-types";
import { buyerColors, buyerRadius, buyerShadow, buyerSpacing } from "./theme";

/* ------------------------------------------------------------------ */
/* BuyerHeader — gradient hero with greeting, date, clock, notifications */
/* ------------------------------------------------------------------ */

type BuyerHeaderProps = {
  greeting: string;
  firstName: string;
  now: Date;
  onProfile: () => void;
  onNotifications: () => void;
  onSettings?: () => void;
  unreadCount?: number;
};

export function BuyerHeader({
  greeting,
  firstName,
  now,
  onProfile,
  onNotifications,
  onSettings,
  unreadCount = 0,
}: BuyerHeaderProps) {
  return (
    <LinearGradient
      colors={["#C47F00", "#F59E0B"]}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={styles.hero}
    >
      <View style={styles.heroTopRow}>
        <View style={styles.heroInfo}>
          <Text style={styles.heroDate}>
            {now.toLocaleDateString([], {
              weekday: "long",
              month: "long",
              day: "numeric",
            })}
          </Text>
          <Text style={styles.heroClock}>
            {now.toLocaleTimeString([], {
              hour: "2-digit",
              minute: "2-digit",
            })}
          </Text>
        </View>
        {onSettings ? (
          <TouchableOpacity
            style={styles.iconButton}
            onPress={onSettings}
            activeOpacity={0.8}
            accessibilityLabel="Settings"
          >
            <MaterialCommunityIcons
              name="cog-outline"
              size={20}
              color="#FFFFFF"
            />
          </TouchableOpacity>
        ) : null}

        <TouchableOpacity
          style={styles.iconButton}
          onPress={onNotifications}
          activeOpacity={0.8}
          accessibilityLabel="Notifications"
        >
          <MaterialCommunityIcons
            name="bell-outline"
            size={20}
            color="#FFFFFF"
          />
          {unreadCount > 0 ? (
            <View style={styles.badgeContainer}>
              <NotificationBadge count={unreadCount} size="sm" />
            </View>
          ) : (
            <View style={styles.badgeDot} />
          )}
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.iconButton, styles.avatarButton]}
          onPress={onProfile}
          activeOpacity={0.8}
          accessibilityLabel="Profile"
        >
          <MaterialCommunityIcons name="account" size={20} color="#FFFFFF" />
        </TouchableOpacity>
      </View>

      <Text style={styles.heroGreeting}>
        {greeting}, {firstName}
      </Text>
      <Text style={styles.heroSubtitle}>
        Find the best crops from trusted farmers.
      </Text>
      <View style={styles.buyerBadge}>
        <MaterialCommunityIcons
          name="storefront-outline"
          size={12}
          color="#FFFFFF"
        />
        <Text style={styles.buyerBadgeText}>Buyer</Text>
      </View>
    </LinearGradient>
  );
}

/* ------------------------------------------------------------------ */
/* BuyerProfileCard — glass profile with buyer details                 */
/* ------------------------------------------------------------------ */

type BuyerProfileCardProps = {
  profile: ProfileData;
  onPress?: () => void;
};

export function BuyerProfileCard({ profile, onPress }: BuyerProfileCardProps) {
  if (profile.role !== "buyer") return null;

  const chips = [
    {
      icon: "office-building-outline" as const,
      label: "Organization",
      value: profile.organizationName ?? "—",
    },
    { icon: "tag-outline" as const, label: "Type", value: profile.buyerType },
    {
      icon: "map-marker-outline" as const,
      label: "Region",
      value: profile.region,
    },
    {
      icon: "sprout-outline" as const,
      label: "Preferred Crop",
      value: profile.preferredCrop ?? "—",
    },
    {
      icon: "scale" as const,
      label: "Required Qty",
      value:
        profile.requiredQuantity != null
          ? `${profile.requiredQuantity} kg`
          : "—",
    },
    {
      icon: "warehouse" as const,
      label: "Storage",
      value: profile.hasStorage ? "Yes" : "No",
    },
    {
      icon: "truck-outline" as const,
      label: "Transport",
      value: profile.hasTransport ? "Yes" : "No",
    },
  ];

  return (
    <TouchableOpacity
      style={styles.profileCard}
      activeOpacity={0.9}
      onPress={onPress}
    >
      <View style={styles.profileTopRow}>
        <View style={styles.avatarWrap}>
          <MaterialCommunityIcons
            name="storefront-outline"
            size={24}
            color="#C47F00"
          />
        </View>
        <View style={styles.profileNameWrap}>
          <Text style={styles.profileName}>{profile.fullName}</Text>
          <Text style={styles.profileOrg}>
            {profile.organizationName ?? "Buyer"}
          </Text>
        </View>
      </View>
      <View style={styles.chipRow}>
        {chips.map((chip) => (
          <View key={chip.label} style={styles.chip}>
            <MaterialCommunityIcons
              name={chip.icon}
              size={13}
              color="#C47F00"
            />
            <Text style={styles.chipValue} numberOfLines={1}>
              {chip.value}
            </Text>
          </View>
        ))}
      </View>
    </TouchableOpacity>
  );
}

/* ------------------------------------------------------------------ */
/* WeatherCard — gradient hero weather (buyer gold theme)              */
/* ------------------------------------------------------------------ */

type BuyerWeatherCardProps = {
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

export function BuyerWeatherCard({
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
}: BuyerWeatherCardProps) {
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
      colors={["#C47F00", "#F59E0B"]}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={styles.weatherCard}
    >
      <View style={styles.weatherHeader}>
        <View>
          <Text style={styles.weatherTitle}>Live Weather</Text>
          <Text style={styles.weatherRegion}>{region}</Text>
        </View>
        <TouchableOpacity
          style={styles.weatherRefresh}
          onPress={onRefresh}
          disabled={loading}
          activeOpacity={0.8}
          accessibilityLabel="Refresh weather"
        >
          {loading ? (
            <ActivityIndicator color="#FFFFFF" size="small" />
          ) : (
            <MaterialCommunityIcons name="refresh" size={18} color="#FFFFFF" />
          )}
        </TouchableOpacity>
      </View>

      <TouchableOpacity
        style={styles.weatherBody}
        onPress={onPress}
        activeOpacity={0.85}
      >
        {error ? (
          <Text style={styles.weatherError}>{error}</Text>
        ) : (
          <>
            <View style={styles.weatherMainRow}>
              <View style={styles.weatherIconWrap}>
                <MaterialCommunityIcons name={icon} size={40} color="#FFFFFF" />
              </View>
              <View style={styles.weatherTempWrap}>
                <Text style={styles.weatherTemp}>
                  {temperature !== null
                    ? `${Math.round(temperature)}°C`
                    : "--°C"}
                </Text>
                <Text style={styles.weatherCondition}>{description}</Text>
                {locationName ? (
                  <Text style={styles.weatherLocation} numberOfLines={1}>
                    {locationName}
                  </Text>
                ) : null}
              </View>
            </View>
            <View style={styles.weatherMetrics}>
              <WeatherMetric
                icon="water-percent"
                value={humidity !== null ? `${humidity}%` : "--"}
                label="Humidity"
              />
              <WeatherMetric
                icon="weather-windy"
                value={windSpeed !== null ? `${windSpeed} km/h` : "--"}
                label="Wind"
              />
              <WeatherMetric icon="weather-rainy" value="40%" label="Rain" />
            </View>
            {updatedAt ? (
              <Text style={styles.weatherUpdated}>
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

function WeatherMetric({
  icon,
  value,
  label,
}: {
  icon: keyof typeof MaterialCommunityIcons.glyphMap;
  value: string;
  label: string;
}) {
  return (
    <View style={styles.weatherMetric}>
      <MaterialCommunityIcons
        name={icon}
        size={14}
        color="rgba(255,255,255,0.9)"
      />
      <Text style={styles.weatherMetricValue}>{value}</Text>
      <Text style={styles.weatherMetricLabel}>{label}</Text>
    </View>
  );
}

/* ------------------------------------------------------------------ */
/* MarketInsightCard — AI recommendation                               */
/* ------------------------------------------------------------------ */

type MarketInsightCardProps = {
  message: string;
  onLearnMore: () => void;
};

export function MarketInsightCard({
  message,
  onLearnMore,
}: MarketInsightCardProps) {
  return (
    <View style={styles.insightCard}>
      <View style={styles.insightHeader}>
        <View style={styles.insightBadge}>
          <MaterialCommunityIcons
            name="robot-outline"
            size={15}
            color="#FFFFFF"
          />
        </View>
        <Text style={styles.insightTitle}>AI Market Insight</Text>
      </View>
      <Text style={styles.insightMessage}>{message}</Text>
      <TouchableOpacity
        onPress={onLearnMore}
        activeOpacity={0.8}
        style={styles.insightLink}
      >
        <Text style={styles.insightLinkText}>Learn More</Text>
        <MaterialCommunityIcons name="arrow-right" size={15} color="#C47F00" />
      </TouchableOpacity>
    </View>
  );
}

/* ------------------------------------------------------------------ */
/* QuickActionGrid — 2-column rounded actions                          */
/* ------------------------------------------------------------------ */

export type BuyerQuickAction = {
  id: string;
  icon: keyof typeof MaterialCommunityIcons.glyphMap;
  title: string;
  description: string;
  background: string;
  iconColor: string;
};

type QuickActionGridProps = {
  actions: BuyerQuickAction[];
  onPress: (id: string) => void;
};

export function QuickActionGrid({ actions, onPress }: QuickActionGridProps) {
  return (
    <View style={styles.actionGrid}>
      {actions.map((action) => (
        <TouchableOpacity
          key={action.id}
          style={styles.actionCard}
          activeOpacity={0.85}
          onPress={() => onPress(action.id)}
          accessibilityLabel={action.title}
        >
          <View
            style={[
              styles.actionIconWrap,
              { backgroundColor: action.background },
            ]}
          >
            <MaterialCommunityIcons
              name={action.icon}
              size={24}
              color={action.iconColor}
            />
          </View>
          <Text style={styles.actionTitle}>{action.title}</Text>
          <Text style={styles.actionDescription}>{action.description}</Text>
        </TouchableOpacity>
      ))}
    </View>
  );
}

/* ------------------------------------------------------------------ */
/* MarketPriceCards — today's crop prices + view report button         */
/* ------------------------------------------------------------------ */

export type MarketPriceItem = {
  crop: string;
  price: string;
  change: string;
  trend: "up" | "down";
  updated: string;
};

type MarketPriceCardsProps = {
  items: MarketPriceItem[];
  onViewReport: () => void;
};

export function MarketPriceCards({
  items,
  onViewReport,
}: MarketPriceCardsProps) {
  return (
    <View style={styles.marketSection}>
      <View style={styles.marketList}>
        {items.map((item) => (
          <View key={item.crop} style={styles.marketItem}>
            <View style={styles.marketItemLeft}>
              <Text style={styles.marketCrop}>{item.crop}</Text>
              <Text style={styles.marketPrice}>{item.price}</Text>
            </View>
            <View style={styles.marketItemRight}>
              <View
                style={[
                  styles.trendChip,
                  {
                    backgroundColor:
                      item.trend === "up"
                        ? buyerColors.greenSoft
                        : buyerColors.redSoft,
                  },
                ]}
              >
                <MaterialCommunityIcons
                  name={item.trend === "up" ? "trending-up" : "trending-down"}
                  size={13}
                  color={item.trend === "up" ? "#16A34A" : "#EF4444"}
                />
                <Text
                  style={[
                    styles.trendText,
                    { color: item.trend === "up" ? "#16A34A" : "#EF4444" },
                  ]}
                >
                  {item.change}
                </Text>
              </View>
              <Text style={styles.marketUpdated}>{item.updated}</Text>
            </View>
          </View>
        ))}
      </View>
      <TouchableOpacity
        style={styles.reportButton}
        onPress={onViewReport}
        activeOpacity={0.85}
      >
        <Text style={styles.reportButtonText}>View Full Report</Text>
        <MaterialCommunityIcons name="arrow-right" size={16} color="#FFFFFF" />
      </TouchableOpacity>
    </View>
  );
}

/* ------------------------------------------------------------------ */
/* BuyerSummary — statistic tiles                                      */
/* ------------------------------------------------------------------ */

export type SummaryTile = {
  icon: keyof typeof MaterialCommunityIcons.glyphMap;
  label: string;
  value: string;
};

export function BuyerSummary({ tiles }: { tiles: SummaryTile[] }) {
  return (
    <View style={styles.summaryGrid}>
      {tiles.map((tile) => (
        <View key={tile.label} style={styles.summaryTile}>
          <View style={styles.summaryIcon}>
            <MaterialCommunityIcons
              name={tile.icon}
              size={15}
              color="#C47F00"
            />
          </View>
          <Text style={styles.summaryValue} numberOfLines={1}>
            {tile.value}
          </Text>
          <Text style={styles.summaryLabel}>{tile.label}</Text>
        </View>
      ))}
    </View>
  );
}

/* ------------------------------------------------------------------ */
/* RecommendedFarmers — horizontal cards                               */
/* ------------------------------------------------------------------ */

export type FarmerCard = {
  id: string;
  name: string;
  region: string;
  rating: number;
  crops: string;
  onContact: () => void;
};

export function RecommendedFarmers({ farmers }: { farmers: FarmerCard[] }) {
  return (
    <FlatList
      horizontal
      data={farmers}
      keyExtractor={(item) => item.id}
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={styles.farmerRow}
      renderItem={({ item }) => (
        <View style={styles.farmerCard}>
          <View style={styles.farmerAvatar}>
            <MaterialCommunityIcons name="account" size={22} color="#C47F00" />
          </View>
          <Text style={styles.farmerName} numberOfLines={1}>
            {item.name}
          </Text>
          <Text style={styles.farmerRegion}>{item.region}</Text>
          <View style={styles.farmerRating}>
            <MaterialCommunityIcons name="star" size={12} color="#F59E0B" />
            <Text style={styles.farmerRatingText}>
              {item.rating.toFixed(1)}
            </Text>
          </View>
          <Text style={styles.farmerCrops} numberOfLines={1}>
            {item.crops}
          </Text>
          <TouchableOpacity
            style={styles.contactButton}
            onPress={item.onContact}
            activeOpacity={0.85}
          >
            <MaterialCommunityIcons
              name="message-text-outline"
              size={14}
              color="#FFFFFF"
            />
            <Text style={styles.contactButtonText}>Contact</Text>
          </TouchableOpacity>
        </View>
      )}
    />
  );
}

/* ------------------------------------------------------------------ */
/* ActivityTimeline — recent activity rows                              */
/* ------------------------------------------------------------------ */

export type ActivityItem = {
  icon: keyof typeof MaterialCommunityIcons.glyphMap;
  title: string;
  time: string;
  color: string;
};

export function ActivityTimeline({ items }: { items: ActivityItem[] }) {
  return (
    <View style={styles.activityList}>
      {items.map((item) => (
        <View key={item.title} style={styles.activityRow}>
          <View
            style={[
              styles.activityIcon,
              { backgroundColor: item.color + "1A" },
            ]}
          >
            <MaterialCommunityIcons
              name={item.icon}
              size={16}
              color={item.color}
            />
          </View>
          <View style={styles.activityText}>
            <Text style={styles.activityTitle}>{item.title}</Text>
            <Text style={styles.activityTime}>{item.time}</Text>
          </View>
        </View>
      ))}
    </View>
  );
}

/* ------------------------------------------------------------------ */
/* BuyerTipCard — AI tip banner                                         */
/* ------------------------------------------------------------------ */

type BuyerTipCardProps = {
  message: string;
};

export function BuyerTipCard({ message }: BuyerTipCardProps) {
  return (
    <LinearGradient
      colors={["#C47F00", "#F59E0B"]}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={styles.tipCard}
    >
      <MaterialCommunityIcons
        name="lightbulb-on-outline"
        size={22}
        color="#FFFFFF"
      />
      <View style={styles.tipTextWrap}>
        <Text style={styles.tipTitle}>Buyer Tip</Text>
        <Text style={styles.tipMessage}>{message}</Text>
      </View>
    </LinearGradient>
  );
}

/* ------------------------------------------------------------------ */
/* SectionTitle                                                         */
/* ------------------------------------------------------------------ */

export function SectionTitle({ title }: { title: string }) {
  return <Text style={styles.sectionTitle}>{title}</Text>;
}

/* ------------------------------------------------------------------ */
/* Styles                                                               */
/* ------------------------------------------------------------------ */

const styles = StyleSheet.create({
  hero: {
    borderRadius: buyerRadius.xl,
    padding: buyerSpacing.xl,
    marginBottom: buyerSpacing.lg,
    ...buyerShadow.card,
  },
  heroTopRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "flex-end",
    gap: buyerSpacing.sm,
    marginBottom: buyerSpacing.lg,
  },
  heroInfo: {
    flex: 1,
  },
  heroDate: {
    fontSize: 12,
    fontWeight: "700",
    color: "rgba(255,255,255,0.9)",
  },
  heroClock: {
    fontSize: 22,
    fontWeight: "800",
    color: "#FFFFFF",
    fontVariant: ["tabular-nums"],
    marginTop: 1,
  },
  iconButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(255,255,255,0.18)",
  },
  avatarButton: {
    backgroundColor: "rgba(255,255,255,0.28)",
  },
  badgeDot: {
    position: "absolute",
    top: 8,
    right: 9,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: "#EF4444",
    borderWidth: 1.5,
    borderColor: "#FFFFFF",
  },
  badgeContainer: {
    position: "absolute",
    top: 3,
    right: 3,
  },
  heroGreeting: {
    fontSize: 24,
    fontWeight: "900",
    color: "#FFFFFF",
  },
  heroSubtitle: {
    marginTop: 4,
    fontSize: 13,
    color: "rgba(255,255,255,0.92)",
  },
  buyerBadge: {
    flexDirection: "row",
    alignItems: "center",
    alignSelf: "flex-start",
    gap: 5,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: buyerRadius.pill,
    backgroundColor: "rgba(255,255,255,0.2)",
    marginTop: buyerSpacing.md,
  },
  buyerBadgeText: {
    color: "#FFFFFF",
    fontSize: 11,
    fontWeight: "700",
  },
  profileCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: buyerRadius.xl,
    padding: buyerSpacing.lg,
    marginBottom: buyerSpacing.lg,
    borderWidth: 1,
    borderColor: "rgba(196,127,0,0.15)",
    ...buyerShadow.soft,
  },
  profileTopRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: buyerSpacing.md,
    marginBottom: buyerSpacing.md,
  },
  avatarWrap: {
    width: 48,
    height: 48,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#FFF7ED",
  },
  profileNameWrap: {
    flex: 1,
  },
  profileName: {
    fontSize: 17,
    fontWeight: "800",
    color: "#0F172A",
  },
  profileOrg: {
    fontSize: 12,
    color: "#64748B",
    marginTop: 1,
  },
  chipRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 6,
  },
  chip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 5,
    borderRadius: buyerRadius.pill,
    backgroundColor: "#FFF7ED",
  },
  chipValue: {
    fontSize: 10,
    fontWeight: "700",
    color: "#92400E",
  },
  weatherCard: {
    borderRadius: buyerRadius.xl,
    padding: buyerSpacing.xl,
    marginBottom: buyerSpacing.lg,
    ...buyerShadow.card,
  },
  weatherHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: buyerSpacing.md,
  },
  weatherTitle: {
    fontSize: 15,
    fontWeight: "800",
    color: "#FFFFFF",
  },
  weatherRegion: {
    fontSize: 12,
    color: "rgba(255,255,255,0.85)",
    marginTop: 2,
  },
  weatherRefresh: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(255,255,255,0.2)",
  },
  weatherBody: {
    gap: buyerSpacing.lg,
  },
  weatherError: {
    color: "#FFFFFF",
    fontWeight: "600",
    fontSize: 13,
  },
  weatherMainRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: buyerSpacing.lg,
  },
  weatherIconWrap: {
    width: 64,
    height: 64,
    borderRadius: 22,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(255,255,255,0.18)",
  },
  weatherTempWrap: {
    flex: 1,
  },
  weatherTemp: {
    fontSize: 36,
    fontWeight: "900",
    color: "#FFFFFF",
  },
  weatherCondition: {
    fontSize: 14,
    fontWeight: "700",
    color: "#FFFFFF",
    marginTop: 1,
  },
  weatherLocation: {
    fontSize: 11,
    color: "rgba(255,255,255,0.85)",
    marginTop: 2,
  },
  weatherMetrics: {
    flexDirection: "row",
    justifyContent: "space-between",
    backgroundColor: "rgba(255,255,255,0.14)",
    borderRadius: buyerRadius.lg,
    paddingVertical: buyerSpacing.md,
    paddingHorizontal: buyerSpacing.sm,
  },
  weatherMetric: {
    flex: 1,
    alignItems: "center",
    gap: 2,
  },
  weatherMetricValue: {
    fontSize: 12,
    fontWeight: "800",
    color: "#FFFFFF",
    marginTop: 2,
  },
  weatherMetricLabel: {
    fontSize: 8,
    fontWeight: "600",
    color: "rgba(255,255,255,0.8)",
    textTransform: "uppercase",
    letterSpacing: 0.3,
  },
  weatherUpdated: {
    fontSize: 10,
    color: "rgba(255,255,255,0.8)",
    textAlign: "center",
  },
  insightCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: buyerRadius.lg,
    padding: buyerSpacing.lg,
    marginBottom: buyerSpacing.lg,
    borderLeftWidth: 4,
    borderLeftColor: "#C47F00",
    ...buyerShadow.soft,
  },
  insightHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: buyerSpacing.sm,
    marginBottom: buyerSpacing.sm,
  },
  insightBadge: {
    width: 28,
    height: 28,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#C47F00",
  },
  insightTitle: {
    fontSize: 14,
    fontWeight: "800",
    color: "#0F172A",
  },
  insightMessage: {
    fontSize: 13,
    lineHeight: 19,
    color: "#64748B",
  },
  insightLink: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    marginTop: buyerSpacing.md,
    alignSelf: "flex-start",
  },
  insightLinkText: {
    fontSize: 13,
    fontWeight: "800",
    color: "#C47F00",
  },
  actionGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
    gap: buyerSpacing.md,
    marginBottom: buyerSpacing.lg,
  },
  actionCard: {
    width: "48%",
    backgroundColor: "#FFFFFF",
    borderRadius: buyerRadius.lg,
    padding: buyerSpacing.lg,
    ...buyerShadow.soft,
  },
  actionIconWrap: {
    width: 46,
    height: 46,
    borderRadius: 15,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: buyerSpacing.md,
  },
  actionTitle: {
    fontSize: 14,
    fontWeight: "800",
    color: "#0F172A",
    lineHeight: 19,
  },
  actionDescription: {
    marginTop: 4,
    fontSize: 11,
    color: "#64748B",
    lineHeight: 16,
  },
  marketSection: {
    backgroundColor: "#FFFFFF",
    borderRadius: buyerRadius.lg,
    padding: buyerSpacing.lg,
    marginBottom: buyerSpacing.lg,
    ...buyerShadow.soft,
  },
  marketList: {
    gap: buyerSpacing.sm,
  },
  marketItem: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: "#F8FAFC",
    borderRadius: buyerRadius.md,
    paddingHorizontal: buyerSpacing.md,
    paddingVertical: buyerSpacing.md,
  },
  marketItemLeft: {},
  marketItemRight: {
    alignItems: "flex-end",
  },
  marketCrop: {
    fontSize: 14,
    fontWeight: "800",
    color: "#0F172A",
  },
  marketPrice: {
    fontSize: 15,
    fontWeight: "900",
    color: "#C47F00",
    marginTop: 1,
  },
  trendChip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: buyerRadius.pill,
  },
  trendText: {
    fontSize: 11,
    fontWeight: "800",
  },
  marketUpdated: {
    fontSize: 9,
    color: "#94A3B8",
    marginTop: 3,
  },
  reportButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    marginTop: buyerSpacing.md,
    backgroundColor: "#C47F00",
    borderRadius: buyerRadius.md,
    paddingVertical: buyerSpacing.md,
  },
  reportButtonText: {
    color: "#FFFFFF",
    fontSize: 13,
    fontWeight: "800",
  },
  summaryGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: buyerSpacing.sm,
    marginBottom: buyerSpacing.lg,
  },
  summaryTile: {
    flexBasis: "31%",
    flexGrow: 1,
    backgroundColor: "#FFFFFF",
    borderRadius: buyerRadius.md,
    padding: buyerSpacing.md,
    alignItems: "center",
    ...buyerShadow.soft,
  },
  summaryIcon: {
    width: 30,
    height: 30,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#FFF7ED",
    marginBottom: 6,
  },
  summaryValue: {
    fontSize: 12,
    fontWeight: "800",
    color: "#0F172A",
  },
  summaryLabel: {
    fontSize: 8,
    fontWeight: "600",
    color: "#94A3B8",
    textTransform: "uppercase",
    letterSpacing: 0.3,
    marginTop: 1,
  },
  farmerRow: {
    gap: buyerSpacing.md,
    paddingBottom: buyerSpacing.sm,
  },
  farmerCard: {
    width: 150,
    backgroundColor: "#FFFFFF",
    borderRadius: buyerRadius.lg,
    padding: buyerSpacing.lg,
    alignItems: "center",
    ...buyerShadow.soft,
  },
  farmerAvatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#FFF7ED",
    marginBottom: 8,
  },
  farmerName: {
    fontSize: 13,
    fontWeight: "800",
    color: "#0F172A",
  },
  farmerRegion: {
    fontSize: 10,
    color: "#64748B",
    marginTop: 1,
  },
  farmerRating: {
    flexDirection: "row",
    alignItems: "center",
    gap: 3,
    marginTop: 4,
  },
  farmerRatingText: {
    fontSize: 11,
    fontWeight: "800",
    color: "#92400E",
  },
  farmerCrops: {
    fontSize: 9,
    color: "#94A3B8",
    marginTop: 4,
  },
  contactButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    marginTop: 8,
    backgroundColor: "#C47F00",
    borderRadius: buyerRadius.pill,
    paddingHorizontal: 12,
    paddingVertical: 5,
  },
  contactButtonText: {
    color: "#FFFFFF",
    fontSize: 10,
    fontWeight: "800",
  },
  activityList: {
    backgroundColor: "#FFFFFF",
    borderRadius: buyerRadius.lg,
    padding: buyerSpacing.lg,
    marginBottom: buyerSpacing.lg,
    gap: buyerSpacing.md,
    ...buyerShadow.soft,
  },
  activityRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: buyerSpacing.md,
  },
  activityIcon: {
    width: 34,
    height: 34,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  activityText: {
    flex: 1,
  },
  activityTitle: {
    fontSize: 13,
    fontWeight: "700",
    color: "#0F172A",
  },
  activityTime: {
    fontSize: 10,
    color: "#94A3B8",
    marginTop: 1,
  },
  tipCard: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: buyerSpacing.md,
    borderRadius: buyerRadius.lg,
    padding: buyerSpacing.lg,
    marginBottom: buyerSpacing.lg,
    ...buyerShadow.card,
  },
  tipTextWrap: {
    flex: 1,
  },
  tipTitle: {
    color: "#FFFFFF",
    fontSize: 14,
    fontWeight: "800",
  },
  tipMessage: {
    color: "rgba(255,255,255,0.92)",
    marginTop: 4,
    lineHeight: 19,
    fontSize: 12,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "800",
    color: "#0F172A",
    marginBottom: buyerSpacing.md,
  },
});
