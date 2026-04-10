import { MaterialCommunityIcons } from "@expo/vector-icons";
import React, { useState } from "react";
import {
    SafeAreaView,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from "react-native";

type Role = "farmer" | "buyer";

type SignUpScreenProps = {
  onLogin: () => void;
  onSignUp: (role: Role) => void;
};

export function SignUpScreen({ onLogin, onSignUp }: SignUpScreenProps) {
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [agreedToTerms, setAgreedToTerms] = useState(false);
  const [step, setStep] = useState<1 | 2>(1);
  const [selectedRole, setSelectedRole] = useState<Role | null>(null);

  const handleContinue = () => {
    if (selectedRole) {
      setStep(2);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {step === 1 ? (
          <>
            <View style={styles.heroCard}>
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
            </View>

            <View style={styles.formCard}>
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
                disabled={!selectedRole}
                style={[
                  styles.primaryButton,
                  !selectedRole && styles.primaryButtonDisabled,
                ]}
              >
                <Text style={styles.primaryButtonText}>Continue</Text>
              </TouchableOpacity>

              <Text style={styles.footerText}>
                Already have an account?{" "}
                <Text onPress={onLogin} style={styles.footerLink}>
                  Login
                </Text>
              </Text>
            </View>
          </>
        ) : (
          <>
            <View style={styles.heroCard}>
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
            </View>

            <View style={styles.formCard}>
              <View style={styles.inputGroup}>
                <MaterialCommunityIcons
                  name="account-outline"
                  size={20}
                  color="#6B7280"
                />
                <TextInput
                  placeholder="Full Name"
                  placeholderTextColor="#9CA3AF"
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
                  placeholder="Email or Phone"
                  placeholderTextColor="#9CA3AF"
                  style={styles.input}
                  keyboardType="email-address"
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
                onPress={() => onSignUp(selectedRole as Role)}
                activeOpacity={0.9}
                style={styles.primaryButton}
              >
                <Text style={styles.primaryButtonText}>Sign Up</Text>
              </TouchableOpacity>

              <TouchableOpacity
                onPress={() => setStep(1)}
                style={styles.backLink}
              >
                <Text style={styles.backLinkText}>Back to role selection</Text>
              </TouchableOpacity>
            </View>
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
  scrollContent: {
    flexGrow: 1,
    padding: 20,
    justifyContent: "center",
  },
  heroCard: {
    alignItems: "center",
    marginBottom: 22,
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
  primaryButtonDisabled: {
    backgroundColor: "#CBD5E1",
    shadowOpacity: 0,
    elevation: 0,
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
