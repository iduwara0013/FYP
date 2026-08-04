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
  const [nameFocused, setNameFocused] = useState(false);
  const [emailFocused, setEmailFocused] = useState(false);
  const [regionFocused, setRegionFocused] = useState(false);
  const [passwordFocused, setPasswordFocused] = useState(false);
  const [confirmFocused, setConfirmFocused] = useState(false);
  const stepOpacity = useRef(new Animated.Value(0)).current;
  const stepOffset = useRef(new Animated.Value(12)).current;
  const buttonScale = useRef(new Animated.Value(1)).current;

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

  const fullNameValid = fullName.trim().length > 0;
  const emailValid = email.trim().length > 0;
  const passwordValid = password.trim().length > 0;
  const canContinue = selectedRole !== null;
  const canCreate =
    fullNameValid && emailValid && passwordValid && agreedToTerms && !loading;

  return (
    <SafeAreaView style={styles.container}>
      <LinearGradient
        colors={["#F8FAFC", "#F0FDF4", "#F8FAFC"]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={StyleSheet.absoluteFill}
      />
      <View style={styles.backgroundLeafOne} />
      <View style={styles.backgroundLeafTwo} />
      <View style={styles.backgroundLeafThree} />

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {/* Step indicator */}
        <View style={styles.stepRow}>
          <View style={[styles.stepItem, step === 1 && styles.stepItemActive]}>
            <View style={[styles.stepDot, step >= 1 && styles.stepDotActive]}>
              <Text style={styles.stepDotText}>1</Text>
            </View>
            <Text
              style={[styles.stepLabel, step === 1 && styles.stepLabelActive]}
            >
              Role
            </Text>
          </View>
          <View
            style={[styles.stepLine, step === 2 && styles.stepLineActive]}
          />
          <View style={[styles.stepItem, step === 2 && styles.stepItemActive]}>
            <View style={[styles.stepDot, step === 2 && styles.stepDotActive]}>
              {step === 2 ? (
                <MaterialCommunityIcons
                  name="check"
                  size={12}
                  color="#FFFFFF"
                />
              ) : (
                <Text style={styles.stepDotText}>2</Text>
              )}
            </View>
            <Text
              style={[styles.stepLabel, step === 2 && styles.stepLabelActive]}
            >
              Account
            </Text>
          </View>
        </View>

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
                  color="#16A34A"
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
                accessibilityLabel="Select Farmer role"
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
                  <View style={styles.checkCircle}>
                    <MaterialCommunityIcons
                      name="check"
                      size={14}
                      color="#FFFFFF"
                    />
                  </View>
                ) : null}
              </TouchableOpacity>

              <TouchableOpacity
                onPress={() => setSelectedRole("buyer")}
                style={[
                  styles.roleCard,
                  selectedRole === "buyer" && styles.roleCardActiveAmber,
                ]}
                accessibilityLabel="Select Buyer role"
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
                  <View style={[styles.checkCircle, styles.checkCircleAmber]}>
                    <MaterialCommunityIcons
                      name="check"
                      size={14}
                      color="#FFFFFF"
                    />
                  </View>
                ) : null}
              </TouchableOpacity>

              <Animated.View style={{ transform: [{ scale: buttonScale }] }}>
                <TouchableWithoutFeedback
                  onPressIn={handlePressIn}
                  onPressOut={handlePressOut}
                  onPress={handleContinue}
                  disabled={!canContinue}
                >
                  <LinearGradient
                    colors={
                      canContinue
                        ? ["#16A34A", "#22C55E"]
                        : ["#9CA3AF", "#9CA3AF"]
                    }
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 0 }}
                    style={[
                      styles.primaryButton,
                      !canContinue && styles.primaryButtonDisabled,
                    ]}
                  >
                    <Text style={styles.primaryButtonText}>Continue</Text>
                    <MaterialCommunityIcons
                      name="arrow-right"
                      size={20}
                      color="#FFFFFF"
                    />
                  </LinearGradient>
                </TouchableWithoutFeedback>
              </Animated.View>

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
                  color="#16A34A"
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
                <View style={styles.errorBanner}>
                  <MaterialCommunityIcons
                    name="alert-circle-outline"
                    size={18}
                    color="#DC2626"
                  />
                  <Text style={styles.errorText}>{errorMessage}</Text>
                </View>
              ) : null}

              <View style={styles.fieldGroup}>
                <Text style={styles.fieldLabel}>Full Name</Text>
                <View
                  style={[
                    styles.inputGroup,
                    nameFocused && styles.inputGroupFocused,
                  ]}
                >
                  <MaterialCommunityIcons
                    name="account-outline"
                    size={20}
                    color={nameFocused ? "#16A34A" : "#6B7280"}
                  />
                  <TextInput
                    placeholder="John Farmer"
                    placeholderTextColor="#9CA3AF"
                    value={fullName}
                    onChangeText={setFullName}
                    onFocus={() => setNameFocused(true)}
                    onBlur={() => setNameFocused(false)}
                    style={styles.input}
                    accessibilityLabel="Full name"
                  />
                </View>
              </View>

              <View style={styles.fieldGroup}>
                <Text style={styles.fieldLabel}>Email</Text>
                <View
                  style={[
                    styles.inputGroup,
                    emailFocused && styles.inputGroupFocused,
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
                    onFocus={() => setEmailFocused(true)}
                    onBlur={() => setEmailFocused(false)}
                    style={styles.input}
                    keyboardType="email-address"
                    autoCapitalize="none"
                    autoCorrect={false}
                    accessibilityLabel="Email address"
                  />
                </View>
              </View>

              <View style={styles.fieldGroup}>
                <Text style={styles.fieldLabel}>Password</Text>
                <View
                  style={[
                    styles.inputGroup,
                    passwordFocused && styles.inputGroupFocused,
                  ]}
                >
                  <MaterialCommunityIcons
                    name="lock-outline"
                    size={20}
                    color={passwordFocused ? "#16A34A" : "#6B7280"}
                  />
                  <TextInput
                    placeholder="Create a password"
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

              <View style={styles.fieldGroup}>
                <Text style={styles.fieldLabel}>Confirm Password</Text>
                <View
                  style={[
                    styles.inputGroup,
                    confirmFocused && styles.inputGroupFocused,
                  ]}
                >
                  <MaterialCommunityIcons
                    name="lock-check-outline"
                    size={20}
                    color={confirmFocused ? "#16A34A" : "#6B7280"}
                  />
                  <TextInput
                    placeholder="Re-enter password"
                    placeholderTextColor="#9CA3AF"
                    value={confirmPassword}
                    onChangeText={setConfirmPassword}
                    secureTextEntry={!showConfirmPassword}
                    onFocus={() => setConfirmFocused(true)}
                    onBlur={() => setConfirmFocused(false)}
                    style={[styles.input, styles.passwordInput]}
                    accessibilityLabel="Confirm password"
                  />
                  <TouchableOpacity
                    onPress={() => setShowConfirmPassword((value) => !value)}
                    style={styles.iconButton}
                    accessibilityLabel={
                      showConfirmPassword ? "Hide password" : "Show password"
                    }
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
              </View>

              <View style={styles.fieldGroup}>
                <Text style={styles.fieldLabel}>Region or District</Text>
                <View
                  style={[
                    styles.inputGroup,
                    regionFocused && styles.inputGroupFocused,
                  ]}
                >
                  <MaterialCommunityIcons
                    name="map-marker-outline"
                    size={20}
                    color={regionFocused ? "#16A34A" : "#6B7280"}
                  />
                  <TextInput
                    placeholder="e.g. Kandy"
                    placeholderTextColor="#9CA3AF"
                    value={region}
                    onChangeText={setRegion}
                    onFocus={() => setRegionFocused(true)}
                    onBlur={() => setRegionFocused(false)}
                    style={styles.input}
                    accessibilityLabel="Region or district"
                  />
                </View>
              </View>

              <View style={styles.termsRow}>
                <TouchableOpacity
                  onPress={() => setAgreedToTerms((value) => !value)}
                  style={[
                    styles.checkbox,
                    agreedToTerms && styles.checkboxActive,
                  ]}
                  accessibilityLabel={
                    agreedToTerms ? "Deselect terms" : "Accept terms"
                  }
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

              <Animated.View style={{ transform: [{ scale: buttonScale }] }}>
                <TouchableWithoutFeedback
                  onPressIn={handlePressIn}
                  onPressOut={handlePressOut}
                  onPress={handleCreateAccount}
                  disabled={!canCreate}
                >
                  <LinearGradient
                    colors={
                      canCreate
                        ? ["#16A34A", "#22C55E"]
                        : ["#9CA3AF", "#9CA3AF"]
                    }
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 0 }}
                    style={[
                      styles.primaryButton,
                      !canCreate && styles.primaryButtonDisabled,
                    ]}
                  >
                    {loading ? (
                      <ActivityIndicator color="#FFFFFF" />
                    ) : (
                      <>
                        <Text style={styles.primaryButtonText}>
                          {loading ? "Creating..." : "Sign Up"}
                        </Text>
                        <MaterialCommunityIcons
                          name="check-circle-outline"
                          size={20}
                          color="#FFFFFF"
                        />
                      </>
                    )}
                  </LinearGradient>
                </TouchableWithoutFeedback>
              </Animated.View>

              <TouchableOpacity
                onPress={() => setStep(1)}
                style={styles.backLink}
                accessibilityLabel="Back to role selection"
              >
                <MaterialCommunityIcons
                  name="chevron-left"
                  size={16}
                  color="#64748B"
                />
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
    width: 200,
    height: 200,
    borderRadius: 200,
    backgroundColor: "#DCFCE7",
    opacity: 0.5,
    top: -60,
    right: -80,
  },
  backgroundLeafTwo: {
    position: "absolute",
    width: 180,
    height: 180,
    borderRadius: 180,
    backgroundColor: "#FEF3C7",
    opacity: 0.4,
    bottom: -60,
    left: -70,
  },
  backgroundLeafThree: {
    position: "absolute",
    width: 140,
    height: 140,
    borderRadius: 140,
    backgroundColor: "#CFFAFE",
    opacity: 0.4,
    top: "45%",
    left: -50,
  },
  scrollContent: {
    flexGrow: 1,
    padding: 20,
    justifyContent: "center",
  },
  stepRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 18,
    paddingHorizontal: 40,
  },
  stepItem: {
    alignItems: "center",
  },
  stepItemActive: {
    opacity: 1,
  },
  stepDot: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: "#E2E8F0",
    alignItems: "center",
    justifyContent: "center",
  },
  stepDotActive: {
    backgroundColor: "#16A34A",
  },
  stepDotText: {
    color: "#FFFFFF",
    fontSize: 13,
    fontWeight: "800",
  },
  stepLabel: {
    marginTop: 4,
    fontSize: 10,
    fontWeight: "700",
    color: "#94A3B8",
  },
  stepLabelActive: {
    color: "#16A34A",
  },
  stepLine: {
    flex: 1,
    height: 2,
    backgroundColor: "#E2E8F0",
    marginHorizontal: 8,
  },
  stepLineActive: {
    backgroundColor: "#16A34A",
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
    fontWeight: "900",
    color: "#0F172A",
    textAlign: "center",
    letterSpacing: 0.2,
  },
  subtitle: {
    marginTop: 8,
    textAlign: "center",
    color: "#64748B",
    lineHeight: 22,
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
  checkCircle: {
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: "#16A34A",
    alignItems: "center",
    justifyContent: "center",
  },
  checkCircleAmber: {
    backgroundColor: "#F59E0B",
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
    shadowColor: "#16A34A",
    shadowOpacity: 0.1,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
    elevation: 2,
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
    backgroundColor: "#16A34A",
    borderColor: "#16A34A",
  },
  termsText: {
    flex: 1,
    color: "#64748B",
    lineHeight: 20,
    fontSize: 12,
  },
  termsLink: {
    color: "#16A34A",
    fontWeight: "700",
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
  footerText: {
    marginTop: 16,
    textAlign: "center",
    color: "#64748B",
    fontSize: 13,
  },
  footerLink: {
    color: "#16A34A",
    fontWeight: "800",
  },
  roleInline: {
    fontWeight: "800",
    color: "#0F172A",
    textTransform: "capitalize",
  },
  backLink: {
    marginTop: 14,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 4,
  },
  backLinkText: {
    textAlign: "center",
    color: "#64748B",
    fontWeight: "700",
  },
});
