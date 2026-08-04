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
      setErrorMessage("Enter your email and password.");
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
        setErrorMessage("Enter a valid email address.");
      } else if (
        code === "auth/user-not-found" ||
        code === "auth/wrong-password" ||
        code === "auth/invalid-credential"
      ) {
        setErrorMessage("Wrong email or password.");
      } else if (code === "auth/too-many-requests") {
        setErrorMessage("Too many attempts. Try again later.");
      } else {
        setErrorMessage(
          error instanceof Error ? error.message : "Login failed.",
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
    <SafeAreaView style={styles.container}>
      <LinearGradient
        colors={["#F8FAFC", "#F0FDF4", "#F8FAFC"]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={StyleSheet.absoluteFill}
        pointerEvents="none"
      />
      <View style={styles.backgroundGlowOne} pointerEvents="none" />
      <View style={styles.backgroundGlowTwo} pointerEvents="none" />
      <View style={styles.backgroundGlowThree} pointerEvents="none" />

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
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
          <View style={styles.logoWrap}>
            <LinearGradient
              colors={["#16A34A", "#22C55E"]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.logoGradient}
            >
              <MaterialCommunityIcons name="sprout" size={34} color="#FFFFFF" />
            </LinearGradient>
          </View>
          <Text style={styles.title}>Smart Crop Forecasting</Text>
          <Text style={styles.subtitle}>Predict crops with confidence</Text>
        </Animated.View>

        {/* Form Card */}
        <Animated.View
          style={[
            styles.formCard,
            {
              opacity: cardOpacity,
              transform: [{ translateY: cardOffset }],
            },
          ]}
        >
          <Text style={styles.sectionTitle}>Welcome back</Text>
          <Text style={styles.sectionSubtitle}>
            Sign in with your email and password.
          </Text>

          {errorMessage ? (
            <View style={styles.errorBanner}>
              <MaterialCommunityIcons
                name="alert-circle-outline"
                size={18}
                color="#DC2626"
              />
              <Text style={styles.errorText}>{errorMessage}</Text>
            </View>
          ) : null}

          {/* Email input */}
          <View style={styles.fieldGroup}>
            <Text style={styles.fieldLabel}>Email</Text>
            <View
              style={[
                styles.inputGroup,
                emailFocused && styles.inputGroupFocused,
                errorMessage && !emailValid && styles.inputGroupError,
              ]}
            >
              <MaterialCommunityIcons
                name="email-outline"
                size={20}
                color={emailFocused ? "#16A34A" : "#6B7280"}
              />
              <TextInput
                placeholder="you@example.com"
                placeholderTextColor="#9CA3AF"
                value={email}
                onChangeText={setEmail}
                keyboardType="email-address"
                autoCapitalize="none"
                autoCorrect={false}
                onFocus={() => setEmailFocused(true)}
                onBlur={() => setEmailFocused(false)}
                style={styles.input}
                accessibilityLabel="Email address"
              />
            </View>
          </View>

          {/* Password input */}
          <View style={styles.fieldGroup}>
            <Text style={styles.fieldLabel}>Password</Text>
            <View
              style={[
                styles.inputGroup,
                passwordFocused && styles.inputGroupFocused,
                errorMessage && !passwordValid && styles.inputGroupError,
              ]}
            >
              <MaterialCommunityIcons
                name="lock-outline"
                size={20}
                color={passwordFocused ? "#16A34A" : "#6B7280"}
              />
              <TextInput
                placeholder="Enter your password"
                placeholderTextColor="#9CA3AF"
                value={password}
                onChangeText={setPassword}
                secureTextEntry={!showPassword}
                onFocus={() => setPasswordFocused(true)}
                onBlur={() => setPasswordFocused(false)}
                style={[styles.input, styles.passwordInput]}
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
                  color="#6B7280"
                />
              </TouchableOpacity>
            </View>
          </View>

          <TouchableOpacity
            onPress={onForgotPassword}
            style={styles.forgotLink}
            accessibilityLabel="Forgot password"
          >
            <Text style={styles.forgotText}>Forgot Password?</Text>
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
                  canSubmit ? ["#16A34A", "#22C55E"] : ["#9CA3AF", "#9CA3AF"]
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
                    <Text style={styles.primaryButtonText}>Login</Text>
                  </>
                )}
              </LinearGradient>
            </TouchableWithoutFeedback>
          </Animated.View>

          {/* Divider */}
          <View style={styles.dividerRow}>
            <View style={styles.divider} />
            <Text style={styles.dividerText}>or continue with</Text>
            <View style={styles.divider} />
          </View>

          {/* Social buttons */}
          <View style={styles.socialRow}>
            <TouchableOpacity
              style={styles.socialButton}
              activeOpacity={0.8}
              accessibilityLabel="Continue with Google"
            >
              <MaterialCommunityIcons name="google" size={22} color="#EA4335" />
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.socialButtonDark}
              activeOpacity={0.8}
              accessibilityLabel="Continue with Apple"
            >
              <MaterialCommunityIcons name="apple" size={22} color="#FFFFFF" />
            </TouchableOpacity>
          </View>

          <Text style={styles.footerText}>
            Don’t have an account?{" "}
            <Text onPress={onSignUp} style={styles.footerLink}>
              Sign Up
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
    backgroundColor: "#F8FAFC",
  },
  backgroundGlowOne: {
    position: "absolute",
    width: 260,
    height: 260,
    borderRadius: 260,
    backgroundColor: "#DCFCE7",
    opacity: 0.7,
    top: -80,
    right: -100,
  },
  backgroundGlowTwo: {
    position: "absolute",
    width: 220,
    height: 220,
    borderRadius: 220,
    backgroundColor: "#FEF3C7",
    opacity: 0.6,
    bottom: -90,
    left: -90,
  },
  backgroundGlowThree: {
    position: "absolute",
    width: 160,
    height: 160,
    borderRadius: 160,
    backgroundColor: "#CFFAFE",
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
    backgroundColor: "rgba(255,255,255,0.95)",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 16,
    shadowColor: "#16A34A",
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
    color: "#0F172A",
    textAlign: "center",
    letterSpacing: 0.2,
  },
  subtitle: {
    marginTop: 8,
    textAlign: "center",
    color: "#64748B",
    fontSize: 14,
    lineHeight: 20,
  },
  formCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 28,
    padding: 24,
    shadowColor: "#0F172A",
    shadowOpacity: 0.08,
    shadowRadius: 24,
    shadowOffset: { width: 0, height: 12 },
    elevation: 6,
    borderWidth: 1,
    borderColor: "rgba(226,232,240,0.6)",
  },
  sectionTitle: {
    fontSize: 22,
    fontWeight: "800",
    color: "#0F172A",
  },
  sectionSubtitle: {
    color: "#64748B",
    marginTop: 6,
    marginBottom: 20,
    lineHeight: 20,
  },
  errorBanner: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    backgroundColor: "#FEF2F2",
    borderRadius: 14,
    padding: 12,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: "#FECACA",
  },
  errorText: {
    color: "#B91C1C",
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
    color: "#475569",
    marginBottom: 6,
  },
  inputGroup: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#E2E8F0",
    borderRadius: 18,
    backgroundColor: "#F8FAFC",
    paddingHorizontal: 14,
    minHeight: 56,
    gap: 10,
  },
  inputGroupFocused: {
    borderColor: "#16A34A",
    backgroundColor: "#FFFFFF",
  },
  inputGroupError: {
    borderColor: "#DC2626",
  },
  input: {
    flex: 1,
    fontSize: 15,
    color: "#0F172A",
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
    color: "#16A34A",
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
    backgroundColor: "#E2E8F0",
  },
  dividerText: {
    marginHorizontal: 10,
    color: "#94A3B8",
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
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#E2E8F0",
    alignItems: "center",
    justifyContent: "center",
  },
  socialButtonDark: {
    width: 58,
    height: 58,
    borderRadius: 18,
    backgroundColor: "#111827",
    alignItems: "center",
    justifyContent: "center",
  },
  footerText: {
    textAlign: "center",
    color: "#64748B",
    marginTop: 18,
    fontSize: 13,
  },
  footerLink: {
    color: "#16A34A",
    fontWeight: "800",
  },
});
