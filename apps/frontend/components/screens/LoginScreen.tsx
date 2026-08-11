import { MaterialCommunityIcons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import React, { useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  Animated,
  Easing,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  TouchableWithoutFeedback,
  View,
} from "react-native";

import { signInWithEmailAndPassword } from "firebase/auth";

import { useTheme } from "../../context/ThemeContext";
import { useI18n } from "../../i18n";
import { getFirebaseAuth } from "../../lib/firebase";

type LoginScreenProps = {
  onForgotPassword: () => void;
  onSignUp: () => void;
  onLogin: (email: string) => Promise<void>;
};

export function LoginScreen({
  onForgotPassword,
  onSignUp,
  onLogin,
}: LoginScreenProps) {
  const { theme } = useTheme();
  const { colors, spacing, radius } = theme;
  const { t, language, setLanguage } = useI18n();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [emailFocused, setEmailFocused] = useState(false);
  const [passwordFocused, setPasswordFocused] = useState(false);
  const cardOpacity = useRef(new Animated.Value(0)).current;
  const cardOffset = useRef(new Animated.Value(12)).current;
  const buttonScale = useRef(new Animated.Value(1)).current;

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

  const handlePressIn = () => {
    Animated.spring(buttonScale, {
      toValue: 0.97,
      useNativeDriver: true,
      speed: 40,
      bounciness: 0,
    }).start();
  };

  const handlePressOut = () => {
    Animated.spring(buttonScale, {
      toValue: 1,
      useNativeDriver: true,
      speed: 40,
      bounciness: 8,
    }).start();
  };

  const handleLoginPress = async () => {
    const trimmedEmail = email.trim();

    if (!trimmedEmail || !password.trim()) {
      setErrorMessage(t("enterEmail"));
      return;
    }

    try {
      setLoading(true);
      setErrorMessage("");
      await signInWithEmailAndPassword(
        getFirebaseAuth(),
        trimmedEmail,
        password,
      );
      await onLogin(trimmedEmail);
    } catch (error) {
      const code =
        typeof error === "object" && error && "code" in error
          ? String((error as { code?: string }).code)
          : "";

      if (code === "auth/invalid-email") {
        setErrorMessage(t("validEmail"));
      } else if (
        code === "auth/user-not-found" ||
        code === "auth/wrong-password" ||
        code === "auth/invalid-credential"
      ) {
        setErrorMessage(t("wrongCredentials"));
      } else if (code === "auth/too-many-requests") {
        setErrorMessage(t("tooManyAttempts"));
      } else {
        setErrorMessage(
          error instanceof Error ? error.message : t("loginFailed"),
        );
      }
    } finally {
      setLoading(false);
    }
  };

  const emailValid = email.trim().length > 0;
  const passwordValid = password.trim().length > 0;
  const canSubmit = emailValid && passwordValid && !loading;

  return (
    <SafeAreaView
      style={[styles.container, { backgroundColor: colors.background }]}
    >
      <LinearGradient
        colors={
          theme.isDark
            ? [colors.background, colors.backgroundAlt, colors.background]
            : ["#F8FAFC", "#F0FDF4", "#F8FAFC"]
        }
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={StyleSheet.absoluteFill}
        pointerEvents="none"
      />
      <View
        style={[
          styles.backgroundGlowOne,
          {
            backgroundColor: theme.isDark ? "rgba(34,197,94,0.08)" : "#DCFCE7",
          },
        ]}
        pointerEvents="none"
      />
      <View
        style={[
          styles.backgroundGlowTwo,
          {
            backgroundColor: theme.isDark ? "rgba(251,191,36,0.06)" : "#FEF3C7",
          },
        ]}
        pointerEvents="none"
      />
      <View
        style={[
          styles.backgroundGlowThree,
          {
            backgroundColor: theme.isDark ? "rgba(56,189,248,0.05)" : "#CFFAFE",
          },
        ]}
        pointerEvents="none"
      />

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {/* Language Toggle */}
        <View style={styles.languageToggleRow}>
          <TouchableOpacity
            style={[
              styles.languageToggle,
              {
                backgroundColor:
                  language === "en" ? colors.primary : colors.surface,
                borderColor: language === "en" ? colors.primary : colors.border,
              },
            ]}
            onPress={() => setLanguage("en")}
            activeOpacity={0.8}
            accessible
            accessibilityLabel="English"
            accessibilityRole="button"
          >
            <Text
              style={[
                styles.languageToggleText,
                {
                  color:
                    language === "en" ? colors.primaryContrast : colors.text,
                },
              ]}
            >
              🇬🇧 English
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[
              styles.languageToggle,
              {
                backgroundColor:
                  language === "si" ? colors.primary : colors.surface,
                borderColor: language === "si" ? colors.primary : colors.border,
              },
            ]}
            onPress={() => setLanguage("si")}
            activeOpacity={0.8}
            accessible
            accessibilityLabel="Sinhala"
            accessibilityRole="button"
          >
            <Text
              style={[
                styles.languageToggleText,
                {
                  color:
                    language === "si" ? colors.primaryContrast : colors.text,
                },
              ]}
            >
              🇱🇰 සිංහල
            </Text>
          </TouchableOpacity>
        </View>

        {/* Hero Area */}
        <Animated.View
          style={[
            styles.heroArea,
            {
              opacity: cardOpacity,
              transform: [{ translateY: cardOffset }],
            },
          ]}
        >
          <View
            style={[
              styles.logoWrap,
              {
                backgroundColor: theme.isDark
                  ? colors.surface
                  : "rgba(255,255,255,0.95)",
                shadowColor: colors.primary,
              },
            ]}
          >
            <LinearGradient
              colors={[colors.primary, colors.primaryLight]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.logoGradient}
            >
              <MaterialCommunityIcons name="sprout" size={34} color="#FFFFFF" />
            </LinearGradient>
          </View>
          <Text style={[styles.title, { color: colors.text }]}>
            {t("appName")}
          </Text>
          <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
            {t("predictCrops")}
          </Text>
        </Animated.View>

        {/* Form Card */}
        <Animated.View
          style={[
            styles.formCard,
            {
              backgroundColor: colors.surface,
              borderColor: colors.border,
              shadowColor: colors.shadow,
              opacity: cardOpacity,
              transform: [{ translateY: cardOffset }],
            },
          ]}
        >
          <Text style={[styles.sectionTitle, { color: colors.text }]}>
            {t("welcomeBack")}
          </Text>
          <Text
            style={[styles.sectionSubtitle, { color: colors.textSecondary }]}
          >
            {t("signInSubtitle")}
          </Text>

          {errorMessage ? (
            <View
              style={[
                styles.errorBanner,
                {
                  backgroundColor: colors.dangerSoft,
                  borderColor: colors.danger,
                },
              ]}
            >
              <MaterialCommunityIcons
                name="alert-circle-outline"
                size={18}
                color={colors.danger}
              />
              <Text style={[styles.errorText, { color: colors.danger }]}>
                {errorMessage}
              </Text>
            </View>
          ) : null}

          {/* Email input */}
          <View style={styles.fieldGroup}>
            <Text style={[styles.fieldLabel, { color: colors.textSecondary }]}>
              {t("email")}
            </Text>
            <View
              style={[
                styles.inputGroup,
                {
                  borderColor: emailFocused ? colors.primary : colors.border,
                  backgroundColor: emailFocused
                    ? colors.surface
                    : colors.background,
                },
                errorMessage && !emailValid && { borderColor: colors.danger },
              ]}
            >
              <MaterialCommunityIcons
                name="email-outline"
                size={20}
                color={emailFocused ? colors.primary : colors.textMuted}
              />
              <TextInput
                placeholder="you@example.com"
                placeholderTextColor={colors.textMuted}
                value={email}
                onChangeText={setEmail}
                keyboardType="email-address"
                autoCapitalize="none"
                autoCorrect={false}
                onFocus={() => setEmailFocused(true)}
                onBlur={() => setEmailFocused(false)}
                style={[styles.input, { color: colors.text }]}
                accessibilityLabel="Email address"
              />
            </View>
          </View>

          {/* Password input */}
          <View style={styles.fieldGroup}>
            <Text style={[styles.fieldLabel, { color: colors.textSecondary }]}>
              {t("password")}
            </Text>
            <View
              style={[
                styles.inputGroup,
                {
                  borderColor: passwordFocused ? colors.primary : colors.border,
                  backgroundColor: passwordFocused
                    ? colors.surface
                    : colors.background,
                },
                errorMessage &&
                  !passwordValid && { borderColor: colors.danger },
              ]}
            >
              <MaterialCommunityIcons
                name="lock-outline"
                size={20}
                color={passwordFocused ? colors.primary : colors.textMuted}
              />
              <TextInput
                placeholder="Enter your password"
                placeholderTextColor={colors.textMuted}
                value={password}
                onChangeText={setPassword}
                secureTextEntry={!showPassword}
                onFocus={() => setPasswordFocused(true)}
                onBlur={() => setPasswordFocused(false)}
                style={[
                  styles.input,
                  styles.passwordInput,
                  { color: colors.text },
                ]}
                accessibilityLabel="Password"
              />
              <TouchableOpacity
                onPress={() => setShowPassword((value) => !value)}
                style={styles.iconButton}
                accessibilityLabel={
                  showPassword ? "Hide password" : "Show password"
                }
              >
                <MaterialCommunityIcons
                  name={showPassword ? "eye-off-outline" : "eye-outline"}
                  size={20}
                  color={colors.textMuted}
                />
              </TouchableOpacity>
            </View>
          </View>

          <TouchableOpacity
            onPress={onForgotPassword}
            style={styles.forgotLink}
            accessibilityLabel="Forgot password"
          >
            <Text style={[styles.forgotText, { color: colors.primary }]}>
              {t("forgotPassword")}
            </Text>
          </TouchableOpacity>

          {/* Primary button */}
          <Animated.View style={{ transform: [{ scale: buttonScale }] }}>
            <TouchableWithoutFeedback
              onPressIn={handlePressIn}
              onPressOut={handlePressOut}
              onPress={handleLoginPress}
              disabled={!canSubmit}
            >
              <LinearGradient
                colors={
                  canSubmit
                    ? [colors.primary, colors.primaryLight]
                    : [colors.textMuted, colors.textMuted]
                }
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={[
                  styles.primaryButton,
                  !canSubmit && styles.primaryButtonDisabled,
                ]}
              >
                {loading ? (
                  <ActivityIndicator color="#FFFFFF" />
                ) : (
                  <>
                    <MaterialCommunityIcons
                      name="login"
                      size={20}
                      color="#FFFFFF"
                    />
                    <Text style={styles.primaryButtonText}>{t("login")}</Text>
                  </>
                )}
              </LinearGradient>
            </TouchableWithoutFeedback>
          </Animated.View>

          {/* Divider */}
          <View style={styles.dividerRow}>
            <View
              style={[styles.divider, { backgroundColor: colors.border }]}
            />
            <Text style={[styles.dividerText, { color: colors.textMuted }]}>
              {t("orContinueWith")}
            </Text>
            <View
              style={[styles.divider, { backgroundColor: colors.border }]}
            />
          </View>

          {/* Social buttons */}
          <View style={styles.socialRow}>
            <TouchableOpacity
              style={[
                styles.socialButton,
                {
                  backgroundColor: colors.surface,
                  borderColor: colors.border,
                },
              ]}
              activeOpacity={0.8}
              accessibilityLabel="Continue with Google"
            >
              <MaterialCommunityIcons name="google" size={22} color="#EA4335" />
            </TouchableOpacity>
            <TouchableOpacity
              style={[
                styles.socialButtonDark,
                {
                  backgroundColor: theme.isDark
                    ? colors.surfaceSecondary
                    : "#111827",
                },
              ]}
              activeOpacity={0.8}
              accessibilityLabel="Continue with Apple"
            >
              <MaterialCommunityIcons name="apple" size={22} color="#FFFFFF" />
            </TouchableOpacity>
          </View>

          <Text style={[styles.footerText, { color: colors.textSecondary }]}>
            {t("dontHaveAccount")}{" "}
            <Text
              onPress={onSignUp}
              style={[styles.footerLink, { color: colors.primary }]}
            >
              {t("signup")}
            </Text>
          </Text>
        </Animated.View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  languageToggleRow: {
    flexDirection: "row",
    justifyContent: "center",
    gap: 8,
    marginBottom: 16,
  },
  languageToggle: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 999,
    borderWidth: 1,
    minHeight: 44,
    justifyContent: "center",
  },
  languageToggleText: {
    fontSize: 13,
    fontWeight: "700",
  },
  backgroundGlowOne: {
    position: "absolute",
    width: 260,
    height: 260,
    borderRadius: 260,
    opacity: 0.7,
    top: -80,
    right: -100,
  },
  backgroundGlowTwo: {
    position: "absolute",
    width: 220,
    height: 220,
    borderRadius: 220,
    opacity: 0.6,
    bottom: -90,
    left: -90,
  },
  backgroundGlowThree: {
    position: "absolute",
    width: 160,
    height: 160,
    borderRadius: 160,
    opacity: 0.5,
    top: "40%",
    left: -60,
  },
  scrollContent: {
    flexGrow: 1,
    padding: 20,
    paddingTop: 48,
  },
  heroArea: {
    alignItems: "center",
    marginBottom: 24,
  },
  logoWrap: {
    width: 76,
    height: 76,
    borderRadius: 38,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 16,
    shadowOpacity: 0.2,
    shadowRadius: 18,
    shadowOffset: { width: 0, height: 8 },
    elevation: 5,
  },
  logoGradient: {
    width: 60,
    height: 60,
    borderRadius: 30,
    alignItems: "center",
    justifyContent: "center",
  },
  title: {
    fontSize: 28,
    fontWeight: "900",
    textAlign: "center",
    letterSpacing: 0.2,
  },
  subtitle: {
    marginTop: 8,
    textAlign: "center",
    fontSize: 14,
    lineHeight: 20,
  },
  formCard: {
    borderRadius: 28,
    padding: 24,
    shadowOpacity: 0.08,
    shadowRadius: 24,
    shadowOffset: { width: 0, height: 12 },
    elevation: 6,
    borderWidth: 1,
  },
  sectionTitle: {
    fontSize: 22,
    fontWeight: "800",
  },
  sectionSubtitle: {
    marginTop: 6,
    marginBottom: 20,
    lineHeight: 20,
  },
  errorBanner: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    borderRadius: 14,
    padding: 12,
    marginBottom: 14,
    borderWidth: 1,
  },
  errorText: {
    fontWeight: "600",
    flex: 1,
    fontSize: 13,
  },
  fieldGroup: {
    marginBottom: 14,
  },
  fieldLabel: {
    fontSize: 12,
    fontWeight: "700",
    marginBottom: 6,
  },
  inputGroup: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderRadius: 18,
    paddingHorizontal: 14,
    minHeight: 56,
    gap: 10,
  },
  input: {
    flex: 1,
    fontSize: 15,
  },
  passwordInput: {
    paddingRight: 4,
  },
  iconButton: {
    padding: 4,
  },
  forgotLink: {
    alignSelf: "flex-end",
    marginBottom: 18,
  },
  forgotText: {
    fontWeight: "700",
    fontSize: 13,
  },
  primaryButton: {
    height: 56,
    borderRadius: 18,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    shadowColor: "#16A34A",
    shadowOpacity: 0.25,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 10 },
    elevation: 5,
  },
  primaryButtonDisabled: {
    shadowOpacity: 0.1,
  },
  primaryButtonText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "800",
  },
  dividerRow: {
    flexDirection: "row",
    alignItems: "center",
    marginVertical: 20,
  },
  divider: {
    flex: 1,
    height: 1,
  },
  dividerText: {
    marginHorizontal: 10,
    fontSize: 12,
  },
  socialRow: {
    flexDirection: "row",
    gap: 12,
    justifyContent: "center",
  },
  socialButton: {
    width: 58,
    height: 58,
    borderRadius: 18,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  socialButtonDark: {
    width: 58,
    height: 58,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
  },
  footerText: {
    textAlign: "center",
    marginTop: 18,
    fontSize: 13,
  },
  footerLink: {
    fontWeight: "800",
  },
});
