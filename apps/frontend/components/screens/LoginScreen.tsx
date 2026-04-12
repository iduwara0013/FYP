import { MaterialCommunityIcons } from "@expo/vector-icons";
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
  const cardOpacity = useRef(new Animated.Value(0)).current;
  const cardOffset = useRef(new Animated.Value(12)).current;

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

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.backgroundGlowOne} />
      <View style={styles.backgroundGlowTwo} />
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.logoWrap}>
          <MaterialCommunityIcons name="sprout" size={42} color="#16A34A" />
        </View>

        <Animated.View
          style={[
            styles.heroCard,
            {
              opacity: cardOpacity,
              transform: [{ translateY: cardOffset }],
            },
          ]}
        >
          <View style={styles.badge}>
            <MaterialCommunityIcons name="sprout" size={30} color="#0F7A3A" />
          </View>
          <Text style={styles.title}>Smart Crop Forecasting</Text>
          <Text style={styles.subtitle}>Predict crops with confidence</Text>
        </Animated.View>

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
            <Text style={styles.errorText}>{errorMessage}</Text>
          ) : null}

          <View style={styles.inputGroup}>
            <MaterialCommunityIcons
              name="email-outline"
              size={20}
              color="#6B7280"
            />
            <TextInput
              placeholder="Email"
              placeholderTextColor="#9CA3AF"
              value={email}
              onChangeText={setEmail}
              keyboardType="email-address"
              autoCapitalize="none"
              autoCorrect={false}
              style={styles.input}
            />
          </View>

          <View style={styles.inputGroup}>
            <MaterialCommunityIcons
              name="lock-outline"
              size={20}
              color="#6B7280"
            />
            <TextInput
              placeholder="Password"
              placeholderTextColor="#9CA3AF"
              value={password}
              onChangeText={setPassword}
              secureTextEntry={!showPassword}
              style={[styles.input, styles.passwordInput]}
            />
            <TouchableOpacity
              onPress={() => setShowPassword((value) => !value)}
              style={styles.iconButton}
            >
              <MaterialCommunityIcons
                name={showPassword ? "eye-off-outline" : "eye-outline"}
                size={20}
                color="#6B7280"
              />
            </TouchableOpacity>
          </View>

          <TouchableOpacity
            onPress={onForgotPassword}
            style={styles.forgotLink}
          >
            <Text style={styles.forgotText}>Forgot Password?</Text>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={handleLoginPress}
            activeOpacity={0.9}
            style={styles.primaryButton}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color="#FFFFFF" />
            ) : (
              <Text style={styles.primaryButtonText}>Login</Text>
            )}
          </TouchableOpacity>

          <View style={styles.dividerRow}>
            <View style={styles.divider} />
            <Text style={styles.dividerText}>or continue with</Text>
            <View style={styles.divider} />
          </View>

          <View style={styles.socialRow}>
            <TouchableOpacity style={styles.socialButton}>
              <MaterialCommunityIcons name="google" size={22} color="#EA4335" />
            </TouchableOpacity>
            <TouchableOpacity style={styles.socialButtonDark}>
              <MaterialCommunityIcons name="apple" size={22} color="#FFFFFF" />
            </TouchableOpacity>
          </View>

          <Text style={styles.footerText}>
            Don&apos;t have an account?{" "}
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
    width: 220,
    height: 220,
    borderRadius: 220,
    backgroundColor: "#DCFCE7",
    opacity: 0.75,
    top: -70,
    right: -90,
  },
  backgroundGlowTwo: {
    position: "absolute",
    width: 180,
    height: 180,
    borderRadius: 180,
    backgroundColor: "#FEF3C7",
    opacity: 0.85,
    bottom: -70,
    left: -80,
  },
  scrollContent: {
    flexGrow: 1,
    padding: 20,
    justifyContent: "center",
  },
  logoWrap: {
    alignSelf: "center",
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: "rgba(255,255,255,0.95)",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 16,
    shadowColor: "#0F172A",
    shadowOpacity: 0.08,
    shadowRadius: 18,
    shadowOffset: { width: 0, height: 8 },
    elevation: 4,
  },
  heroCard: {
    alignItems: "center",
    marginBottom: 18,
  },
  badge: {
    width: 84,
    height: 84,
    borderRadius: 42,
    backgroundColor: "#DCFCE7",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 16,
  },
  title: {
    fontSize: 28,
    fontWeight: "800",
    color: "#0F172A",
    textAlign: "center",
  },
  subtitle: {
    marginTop: 10,
    textAlign: "center",
    color: "#475569",
    lineHeight: 22,
  },
  formCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 28,
    padding: 20,
    shadowColor: "#0F172A",
    shadowOpacity: 0.08,
    shadowRadius: 24,
    shadowOffset: { width: 0, height: 12 },
    elevation: 6,
  },
  sectionTitle: {
    fontSize: 22,
    fontWeight: "800",
    color: "#0F172A",
  },
  sectionSubtitle: {
    color: "#64748B",
    marginTop: 6,
    marginBottom: 18,
    lineHeight: 20,
  },
  errorText: {
    color: "#B91C1C",
    marginBottom: 14,
    fontWeight: "600",
  },
  inputGroup: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#E2E8F0",
    borderRadius: 18,
    backgroundColor: "#F8FAFC",
    paddingHorizontal: 14,
    marginBottom: 14,
    minHeight: 56,
  },
  input: {
    flex: 1,
    fontSize: 15,
    color: "#0F172A",
    marginLeft: 10,
  },
  passwordInput: {
    paddingRight: 36,
  },
  iconButton: {
    padding: 4,
  },
  forgotLink: {
    alignSelf: "flex-end",
    marginBottom: 18,
  },
  forgotText: {
    color: "#0F7A3A",
    fontWeight: "700",
  },
  primaryButton: {
    backgroundColor: "#0F7A3A",
    borderRadius: 18,
    height: 54,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#0F7A3A",
    shadowOpacity: 0.22,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 10 },
    elevation: 4,
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
  },
  footerLink: {
    color: "#0F7A3A",
    fontWeight: "800",
  },
});
