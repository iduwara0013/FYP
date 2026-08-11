import { MaterialCommunityIcons } from "@expo/vector-icons";
import React, { useCallback, useEffect, useRef, useState } from "react";
import {
  Alert,
  Animated,
  Easing,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

import { signOut } from "firebase/auth";

import { useTheme } from "../../context/ThemeContext";
import { useI18n } from "../../i18n";
import { getFirebaseAuth } from "../../lib/firebase";
import {
  getNotificationPreferences,
  saveNotificationPreferences,
} from "../../lib/notifications/NotificationPreferences";
import { NotificationPreferences } from "../../lib/notifications/types";
import { LanguageSelector } from "../settings/LanguageSelector";
import { SettingsRow } from "../settings/SettingsRow";
import { SettingsSection } from "../settings/SettingsSection";
import { ThemeSelector } from "../settings/ThemeSelector";
import { ProfileData } from "./profile-types";

type SettingsScreenProps = {
  profile: ProfileData | null;
  onBackToHome: () => void;
  onEditProfile?: () => void;
  onViewProfile?: () => void;
  onLogout?: () => void;
};

type NotificationToggleProps = {
  icon: keyof typeof MaterialCommunityIcons.glyphMap;
  label: string;
  description: string;
  value: boolean;
  onToggle: () => void;
  color: string;
};

function NotificationToggle({
  icon,
  label,
  description,
  value,
  onToggle,
  color,
}: NotificationToggleProps) {
  const { theme } = useTheme();
  const { colors, spacing, radius } = theme;

  return (
    <View
      style={[
        styles.toggleRow,
        {
          paddingVertical: spacing.md,
          paddingHorizontal: spacing.md,
          borderBottomColor: colors.border,
          minHeight: 56,
        },
      ]}
    >
      <View
        style={[
          styles.toggleIconWrap,
          {
            backgroundColor: color + "1A",
            borderRadius: radius.md,
          },
        ]}
      >
        <MaterialCommunityIcons name={icon} size={20} color={color} />
      </View>
      <View style={styles.toggleTextWrap}>
        <Text style={[styles.toggleLabel, { color: colors.text }]}>
          {label}
        </Text>
        <Text style={[styles.toggleDescription, { color: colors.textMuted }]}>
          {description}
        </Text>
      </View>
      <Switch
        value={value}
        onValueChange={onToggle}
        trackColor={{ false: colors.border, true: colors.primary }}
        thumbColor={colors.white}
        ios_backgroundColor={colors.border}
        accessible
        accessibilityLabel={`Toggle ${label}`}
        accessibilityRole="switch"
        accessibilityState={{ checked: value }}
      />
    </View>
  );
}

export function SettingsScreen({
  profile,
  onBackToHome,
  onEditProfile,
  onViewProfile,
  onLogout,
}: SettingsScreenProps) {
  const { theme } = useTheme();
  const { colors, spacing, radius } = theme;
  const { t, language } = useI18n();
  const [preferences, setPreferences] =
    useState<NotificationPreferences | null>(null);
  const headerAnim = useRef(new Animated.Value(0)).current;
  const sectionAnim = useRef(new Animated.Value(0)).current;

  const userId = profile?.id ?? profile?.email ?? "";

  useEffect(() => {
    Animated.timing(headerAnim, {
      toValue: 1,
      duration: 500,
      easing: Easing.bezier(0.16, 1, 0.3, 1),
      useNativeDriver: true,
    }).start();
    Animated.timing(sectionAnim, {
      toValue: 1,
      duration: 600,
      delay: 150,
      easing: Easing.bezier(0.16, 1, 0.3, 1),
      useNativeDriver: true,
    }).start();
  }, [headerAnim, sectionAnim]);

  const loadPreferences = useCallback(async () => {
    if (!userId) return;
    try {
      const prefs = await getNotificationPreferences(userId);
      setPreferences(prefs);
    } catch {
      // Non-fatal
    }
  }, [userId]);

  useEffect(() => {
    void loadPreferences();
  }, [loadPreferences]);

  const handleTogglePreference = useCallback(
    async (key: keyof NotificationPreferences) => {
      if (!preferences || !userId) return;
      const updated = { ...preferences, [key]: !preferences[key] };
      setPreferences(updated);
      try {
        await saveNotificationPreferences(userId, updated);
      } catch {
        // Non-fatal
      }
    },
    [preferences, userId],
  );

  const handleLogout = useCallback(() => {
    Alert.alert(
      t("logout"),
      t("logoutConfirm"),
      [
        { text: t("cancel"), style: "cancel" },
        {
          text: t("logout"),
          style: "destructive",
          onPress: async () => {
            try {
              await signOut(getFirebaseAuth());
            } catch {
              // Non-fatal
            }
            onLogout?.();
          },
        },
      ],
      { cancelable: true },
    );
  }, [onLogout, t]);

  const displayName = profile?.fullName ?? t("farmer");
  const displayEmail = profile?.email ?? t("notSignedIn");
  const displayRegion = profile?.region ?? "—";

  return (
    <SafeAreaView
      style={[styles.container, { backgroundColor: colors.background }]}
    >
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <Animated.View
          style={{
            opacity: headerAnim,
            transform: [
              {
                translateY: headerAnim.interpolate({
                  inputRange: [0, 1],
                  outputRange: [-20, 0],
                }),
              },
            ],
          }}
        >
          <View style={styles.header}>
            <TouchableOpacity
              style={[
                styles.backButton,
                {
                  backgroundColor: colors.surface,
                  borderColor: colors.border,
                  borderRadius: radius.pill,
                },
              ]}
              onPress={onBackToHome}
              activeOpacity={0.85}
              accessible
              accessibilityLabel="Go back to home"
              accessibilityRole="button"
            >
              <MaterialCommunityIcons
                name="arrow-left"
                size={22}
                color={colors.text}
              />
              <Text style={[styles.backButtonText, { color: colors.text }]}>
                {t("home")}
              </Text>
            </TouchableOpacity>
          </View>

          <View style={styles.titleWrap}>
            <Text style={[styles.title, { color: colors.text }]}>
              {t("settings")}
            </Text>
            <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
              {t("managePreferences")}
            </Text>
          </View>
        </Animated.View>

        <Animated.View
          style={{
            opacity: sectionAnim,
            transform: [
              {
                translateY: sectionAnim.interpolate({
                  inputRange: [0, 1],
                  outputRange: [16, 0],
                }),
              },
            ],
          }}
        >
          {/* Account */}
          <SettingsSection title={t("account")} icon="account-circle-outline">
            <SettingsRow
              icon="account"
              label={t("profile")}
              value={displayName}
              onPress={onViewProfile}
            />
            <SettingsRow
              icon="account-edit-outline"
              label={t("editProfile")}
              onPress={onEditProfile}
            />
            <SettingsRow
              icon="email-outline"
              label={t("accountInfo")}
              value={displayEmail}
              last
            />
          </SettingsSection>

          {/* Appearance */}
          <SettingsSection title={t("appearance")} icon="palette-outline">
            <View style={{ padding: spacing.md }}>
              <Text
                style={[styles.sectionDesc, { color: colors.textSecondary }]}
              >
                {t("chooseTheme")}
              </Text>
              <View style={{ marginTop: spacing.md }}>
                <ThemeSelector />
              </View>
            </View>
          </SettingsSection>

          {/* Language */}
          <SettingsSection title={t("language")} icon="translate">
            <View style={{ padding: spacing.md }}>
              <Text
                style={[styles.sectionDesc, { color: colors.textSecondary }]}
              >
                {t("chooseLanguage")}
              </Text>
              <View style={{ marginTop: spacing.md }}>
                <LanguageSelector />
              </View>
            </View>
          </SettingsSection>

          {/* Notifications */}
          <SettingsSection title={t("notifications")} icon="bell-outline">
            <NotificationToggle
              icon="weather-partly-cloudy"
              label={t("weatherAlerts")}
              description={t("weatherAlerts")}
              value={preferences?.weatherAlerts ?? true}
              onToggle={() => handleTogglePreference("weatherAlerts")}
              color={colors.weather}
            />
            <NotificationToggle
              icon="currency-usd"
              label={t("marketPriceAlerts")}
              description={t("marketPriceAlerts")}
              value={preferences?.marketPriceAlerts ?? true}
              onToggle={() => handleTogglePreference("marketPriceAlerts")}
              color={colors.market}
            />
            <NotificationToggle
              icon="lightbulb-on"
              label={t("dailyTips")}
              description={t("dailyTips")}
              value={preferences?.dailyTips ?? true}
              onToggle={() => handleTogglePreference("dailyTips")}
              color={colors.tips}
            />
            <NotificationToggle
              icon="chart-line"
              label={t("predictionReminders")}
              description={t("predictionReminders")}
              value={preferences?.predictionReminders ?? true}
              onToggle={() => handleTogglePreference("predictionReminders")}
              color={colors.prediction}
            />
            <NotificationToggle
              icon="newspaper"
              label={t("newsUpdates")}
              description={t("newsUpdates")}
              value={preferences?.newsUpdates ?? true}
              onToggle={() => handleTogglePreference("newsUpdates")}
              color={colors.news}
            />
          </SettingsSection>

          {/* App Settings */}
          <SettingsSection title={t("appSettings")} icon="cog-outline">
            <SettingsRow
              icon="translate"
              label={t("language")}
              value={language === "si" ? t("sinhala") : t("english")}
            />
            <SettingsRow
              icon="scale-balance"
              label={t("units")}
              value={t("metric")}
            />
            <SettingsRow
              icon="map-marker-outline"
              label={t("location")}
              value={displayRegion}
            />
            <SettingsRow
              icon="shield-account-outline"
              label={t("dataPrivacy")}
              last
            />
          </SettingsSection>

          {/* Support */}
          <SettingsSection title={t("support")} icon="lifebuoy">
            <SettingsRow icon="help-circle-outline" label={t("helpCenter")} />
            <SettingsRow
              icon="email-fast-outline"
              label={t("contactSupport")}
            />
            <SettingsRow
              icon="information-outline"
              label={t("aboutApp")}
              value={t("version")}
              last
            />
          </SettingsSection>

          {/* Logout */}
          <View style={styles.logoutSection}>
            <TouchableOpacity
              style={[
                styles.logoutButton,
                {
                  backgroundColor: colors.dangerSoft,
                  borderRadius: radius.lg,
                },
              ]}
              onPress={handleLogout}
              activeOpacity={0.85}
              accessible
              accessibilityLabel="Log out"
              accessibilityRole="button"
            >
              <MaterialCommunityIcons
                name="logout"
                size={20}
                color={colors.danger}
              />
              <Text style={[styles.logoutText, { color: colors.danger }]}>
                {t("logout")}
              </Text>
            </TouchableOpacity>
            <Text style={[styles.logoutHint, { color: colors.textMuted }]}>
              {t("logoutHint")}
            </Text>
          </View>
        </Animated.View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 40,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 16,
  },
  backButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderWidth: 1,
  },
  backButtonText: {
    fontWeight: "700",
    fontSize: 14,
  },
  titleWrap: {
    marginBottom: 20,
  },
  title: {
    fontSize: 28,
    fontWeight: "900",
  },
  subtitle: {
    fontSize: 14,
    marginTop: 4,
  },
  sectionDesc: {
    fontSize: 13,
    lineHeight: 18,
  },
  toggleRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    borderBottomWidth: 1,
  },
  toggleIconWrap: {
    width: 40,
    height: 40,
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
  },
  toggleTextWrap: {
    flex: 1,
    gap: 2,
  },
  toggleLabel: {
    fontSize: 14,
    fontWeight: "700",
  },
  toggleDescription: {
    fontSize: 12,
    lineHeight: 16,
  },
  logoutSection: {
    marginTop: 8,
    marginBottom: 24,
  },
  logoutButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    paddingVertical: 16,
  },
  logoutText: {
    fontSize: 16,
    fontWeight: "800",
  },
  logoutHint: {
    textAlign: "center",
    fontSize: 12,
    marginTop: 8,
  },
});
