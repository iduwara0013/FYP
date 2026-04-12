import { MaterialCommunityIcons } from "@expo/vector-icons";
import React, { useEffect, useRef, useState } from "react";
import {
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

import { createUserWithEmailAndPassword, updateProfile } from "firebase/auth";

import { getFirebaseAuth } from "../../lib/firebase";

type Role = "farmer" | "buyer";

type SignupDetails = {
  fullName: string;
  email: string;
  region: string;
};

type SignUpScreenProps = {
  onLogin: () => void;
  onSignUp: (role: Role, details: SignupDetails) => void;
};

export function SignUpScreen({ onLogin, onSignUp }: SignUpScreenProps) {
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [region, setRegion] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [agreedToTerms, setAgreedToTerms] = useState(false);
  const [step, setStep] = useState<1 | 2>(1);
  const [selectedRole, setSelectedRole] = useState<Role | null>(null);
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const stepOpacity = useRef(new Animated.Value(0)).current;
  const stepOffset = useRef(new Animated.Value(12)).current;

  useEffect(() => {
    stepOpacity.setValue(0);
    stepOffset.setValue(12);

    Animated.parallel([
      Animated.timing(stepOpacity, {
        toValue: 1,
        duration: 500,
        easing: Easing.bezier(0.16, 1, 0.3, 1),
        useNativeDriver: true,
      }),
      Animated.timing(stepOffset, {
        toValue: 0,
        duration: 500,
        easing: Easing.bezier(0.16, 1, 0.3, 1),
        useNativeDriver: true,
      }),
    ]).start();
  }, [step, stepOpacity, stepOffset]);

  const handleContinue = () => {
    setStep(2);
  };

  const handleCreateAccount = async () => {
    const trimmedEmail = email.trim();

    if (!selectedRole) {
      setErrorMessage("Select Farmer or Buyer first.");
      return;
    }

    if (!fullName.trim() || !trimmedEmail || !password.trim()) {
      setErrorMessage("Enter your full name, email, and password.");
      return;
    }

    if (password !== confirmPassword) {
      setErrorMessage("Passwords do not match.");
      return;
    }

    if (!agreedToTerms) {
      setErrorMessage("Please accept the terms to continue.");
      return;
    }

    try {
      setLoading(true);
      setErrorMessage("");

      const credential = await createUserWithEmailAndPassword(
        getFirebaseAuth(),
        trimmedEmail,
        password,
      );

      await updateProfile(credential.user, {
        displayName: fullName.trim(),
      });

      onSignUp(selectedRole, {
        fullName: fullName.trim(),
        email: trimmedEmail,
        region: region.trim(),
      });
    } catch (error) {
      const code =
        typeof error === "object" && error && "code" in error
          ? String((error as { code?: string }).code)
          : "";

      if (code === "auth/email-already-in-use") {
        setErrorMessage("This email is already registered.");
      } else if (code === "auth/invalid-email") {
        setErrorMessage("Enter a valid email address.");
      } else if (code === "auth/weak-password") {
        setErrorMessage("Use a stronger password.");
      } else {
        setErrorMessage(
          error instanceof Error ? error.message : "Sign up failed.",
        );
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.backgroundLeafOne} />
      <View style={styles.backgroundLeafTwo} />
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {step === 1 ? (
          <>
            <Animated.View
              style={[
                styles.heroCard,
                {
                  opacity: stepOpacity,
                  transform: [{ translateY: stepOffset }],
                },
              ]}
            >
              <View style={styles.badge}>
                <MaterialCommunityIcons
                  name="account-plus-outline"
                  size={30}
                  color="#0F7A3A"
                />
              </View>
              <Text style={styles.title}>Choose Your Role</Text>
              <Text style={styles.subtitle}>
                Select Farmer or Buyer to create a personalized experience.
              </Text>
            </Animated.View>

            <Animated.View
              style={[
                styles.formCard,
                {
                  opacity: stepOpacity,
                  transform: [{ translateY: stepOffset }],
                },
              ]}
            >
              <TouchableOpacity
                onPress={() => setSelectedRole("farmer")}
                style={[
                  styles.roleCard,
                  selectedRole === "farmer" && styles.roleCardActiveGreen,
                ]}
              >
                <View style={[styles.roleIcon, styles.roleIconGreen]}>
                  <MaterialCommunityIcons
                    name="sprout"
                    size={24}
                    color="#FFFFFF"
                  />
                </View>
                <View style={styles.roleTextWrap}>
                  <Text style={styles.roleTitle}>Farmer</Text>
                  <Text style={styles.roleDescription}>
                    Predict yields, get crop recommendations, and manage your
                    farm.
                  </Text>
                </View>
                {selectedRole === "farmer" ? (
                  <MaterialCommunityIcons
                    name="check-circle"
                    size={24}
                    color="#16A34A"
                  />
                ) : null}
              </TouchableOpacity>

              <TouchableOpacity
                onPress={() => setSelectedRole("buyer")}
                style={[
                  styles.roleCard,
                  selectedRole === "buyer" && styles.roleCardActiveAmber,
                ]}
              >
                <View style={[styles.roleIcon, styles.roleIconAmber]}>
                  <MaterialCommunityIcons
                    name="storefront-outline"
                    size={24}
                    color="#FFFFFF"
                  />
                </View>
                <View style={styles.roleTextWrap}>
                  <Text style={styles.roleTitle}>Buyer</Text>
                  <Text style={styles.roleDescription}>
                    Source crops, check market prices, and connect with farmers.
                  </Text>
                </View>
                {selectedRole === "buyer" ? (
                  <MaterialCommunityIcons
                    name="check-circle"
                    size={24}
                    color="#F59E0B"
                  />
                ) : null}
              </TouchableOpacity>

              <TouchableOpacity
                onPress={handleContinue}
                activeOpacity={0.9}
                style={styles.primaryButton}
              >
                <Text style={styles.primaryButtonText}>Continue</Text>
              </TouchableOpacity>

              <Text style={styles.footerText}>
                Already have an account?{" "}
                <Text onPress={onLogin} style={styles.footerLink}>
                  Login
                </Text>
              </Text>
            </Animated.View>
          </>
        ) : (
          <>
            <Animated.View
              style={[
                styles.heroCard,
                {
                  opacity: stepOpacity,
                  transform: [{ translateY: stepOffset }],
                },
              ]}
            >
              <View style={styles.badge}>
                <MaterialCommunityIcons
                  name="account-plus-outline"
                  size={30}
                  color="#0F7A3A"
                />
              </View>
              <Text style={styles.title}>Create Account</Text>
              <Text style={styles.subtitle}>
                Join as a <Text style={styles.roleInline}>{selectedRole}</Text>{" "}
                and start managing smarter.
              </Text>
            </Animated.View>

            <Animated.View
              style={[
                styles.formCard,
                {
                  opacity: stepOpacity,
                  transform: [{ translateY: stepOffset }],
                },
              ]}
            >
              {errorMessage ? (
                <Text style={styles.errorText}>{errorMessage}</Text>
              ) : null}

              <View style={styles.inputGroup}>
                <MaterialCommunityIcons
                  name="account-outline"
                  size={20}
                  color="#6B7280"
                />
                <TextInput
                  placeholder="Full Name"
                  placeholderTextColor="#9CA3AF"
                  value={fullName}
                  onChangeText={setFullName}
                  style={styles.input}
                />
              </View>

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
                  style={styles.input}
                  keyboardType="email-address"
                  autoCapitalize="none"
                  autoCorrect={false}
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

              <View style={styles.inputGroup}>
                <MaterialCommunityIcons
                  name="lock-check-outline"
                  size={20}
                  color="#6B7280"
                />
                <TextInput
                  placeholder="Confirm Password"
                  placeholderTextColor="#9CA3AF"
                  value={confirmPassword}
                  onChangeText={setConfirmPassword}
                  secureTextEntry={!showConfirmPassword}
                  style={[styles.input, styles.passwordInput]}
                />
                <TouchableOpacity
                  onPress={() => setShowConfirmPassword((value) => !value)}
                  style={styles.iconButton}
                >
                  <MaterialCommunityIcons
                    name={
                      showConfirmPassword ? "eye-off-outline" : "eye-outline"
                    }
                    size={20}
                    color="#6B7280"
                  />
                </TouchableOpacity>
              </View>

              <View style={styles.inputGroup}>
                <MaterialCommunityIcons
                  name="map-marker-outline"
                  size={20}
                  color="#6B7280"
                />
                <TextInput
                  placeholder="Region or District"
                  placeholderTextColor="#9CA3AF"
                  value={region}
                  onChangeText={setRegion}
                  style={styles.input}
                />
              </View>

              <View style={styles.termsRow}>
                <TouchableOpacity
                  onPress={() => setAgreedToTerms((value) => !value)}
                  style={[
                    styles.checkbox,
                    agreedToTerms && styles.checkboxActive,
                  ]}
                >
                  {agreedToTerms ? (
                    <MaterialCommunityIcons
                      name="check"
                      size={14}
                      color="#FFFFFF"
                    />
                  ) : null}
                </TouchableOpacity>
                <Text style={styles.termsText}>
                  I agree to the{" "}
                  <Text style={styles.termsLink}>Terms of Service</Text> and{" "}
                  <Text style={styles.termsLink}>Privacy Policy</Text>
                </Text>
              </View>

              <TouchableOpacity
                onPress={handleCreateAccount}
                activeOpacity={0.9}
                style={styles.primaryButton}
                disabled={loading}
              >
                <Text style={styles.primaryButtonText}>
                  {loading ? "Creating..." : "Sign Up"}
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                onPress={() => setStep(1)}
                style={styles.backLink}
              >
                <Text style={styles.backLinkText}>Back to role selection</Text>
              </TouchableOpacity>
            </Animated.View>
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F8FAFC",
  },
  backgroundLeafOne: {
    position: "absolute",
    width: 180,
    height: 180,
    borderRadius: 180,
    backgroundColor: "#DCFCE7",
    opacity: 0.38,
    top: -40,
    right: -70,
  },
  backgroundLeafTwo: {
    position: "absolute",
    width: 160,
    height: 160,
    borderRadius: 160,
    backgroundColor: "#FEF3C7",
    opacity: 0.32,
    bottom: -50,
    left: -60,
  },
  scrollContent: {
    flexGrow: 1,
    padding: 20,
    justifyContent: "center",
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
  errorText: {
    color: "#B91C1C",
    marginBottom: 14,
    fontWeight: "600",
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
  roleCard: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1.5,
    borderColor: "#E2E8F0",
    borderRadius: 22,
    padding: 16,
    marginBottom: 14,
    backgroundColor: "#FFFFFF",
  },
  roleCardActiveGreen: {
    borderColor: "#16A34A",
    backgroundColor: "#F0FDF4",
  },
  roleCardActiveAmber: {
    borderColor: "#F59E0B",
    backgroundColor: "#FFFBEB",
  },
  roleIcon: {
    width: 52,
    height: 52,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 14,
  },
  roleIconGreen: {
    backgroundColor: "#16A34A",
  },
  roleIconAmber: {
    backgroundColor: "#F59E0B",
  },
  roleTextWrap: {
    flex: 1,
  },
  roleTitle: {
    fontSize: 16,
    fontWeight: "800",
    color: "#0F172A",
    marginBottom: 4,
  },
  roleDescription: {
    color: "#64748B",
    lineHeight: 19,
    fontSize: 12,
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
  termsRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 10,
    marginTop: 4,
    marginBottom: 18,
  },
  checkbox: {
    width: 22,
    height: 22,
    borderRadius: 6,
    borderWidth: 1.5,
    borderColor: "#CBD5E1",
    backgroundColor: "#FFFFFF",
    alignItems: "center",
    justifyContent: "center",
    marginTop: 1,
  },
  checkboxActive: {
    backgroundColor: "#0F7A3A",
    borderColor: "#0F7A3A",
  },
  termsText: {
    flex: 1,
    color: "#64748B",
    lineHeight: 20,
    fontSize: 12,
  },
  termsLink: {
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
  footerText: {
    marginTop: 16,
    textAlign: "center",
    color: "#64748B",
  },
  footerLink: {
    color: "#0F7A3A",
    fontWeight: "800",
  },
  roleInline: {
    fontWeight: "800",
    color: "#0F172A",
    textTransform: "capitalize",
  },
  backLink: {
    marginTop: 14,
  },
  backLinkText: {
    textAlign: "center",
    color: "#64748B",
    fontWeight: "700",
  },
});
