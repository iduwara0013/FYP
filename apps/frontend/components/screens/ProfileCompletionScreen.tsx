import { MaterialCommunityIcons } from "@expo/vector-icons";
import React, { useEffect, useMemo, useRef, useState } from "react";
import {
  ActivityIndicator,
  Animated,
  Easing,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { createProfile } from "../../lib/spring-api";
import { ProfileData, Role } from "./profile-types";

type ProfileCompletionScreenProps = {
  role: Role;
  initialValues?: {
    fullName?: string;
    email?: string;
    region?: string;
    phoneNumber?: string;
    address?: string;
  } | null;
  onComplete: (profile: ProfileData) => void;
};

export function ProfileCompletionScreen({
  role,
  initialValues,
  onComplete,
}: ProfileCompletionScreenProps) {
  const isFarmer = role === "farmer";
  const themeColor = isFarmer ? "#16A34A" : "#F59E0B";
  const lightThemeColor = isFarmer ? "#DCFCE7" : "#FEF3C7";
  const iconName = isFarmer ? "sprout" : "storefront-outline";

  const [saving, setSaving] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  const [fullName, setFullName] = useState(initialValues?.fullName ?? "");
  const [email, setEmail] = useState(initialValues?.email ?? "");
  const [phoneNumber, setPhoneNumber] = useState(
    initialValues?.phoneNumber ?? "",
  );
  const [address, setAddress] = useState(initialValues?.address ?? "");
  const [region, setRegion] = useState(initialValues?.region ?? "");

  const [farmerType, setFarmerType] = useState("");
  const [nationalId, setNationalId] = useState("");
  const [landSize, setLandSize] = useState("");
  const [experienceYears, setExperienceYears] = useState("");
  const [hasIrrigation, setHasIrrigation] = useState(false);

  const [buyerType, setBuyerType] = useState("");
  const [organizationName, setOrganizationName] = useState("");
  const [preferredCrop, setPreferredCrop] = useState("");
  const [requiredQuantity, setRequiredQuantity] = useState("");
  const [notes, setNotes] = useState("");
  const [hasStorage, setHasStorage] = useState(false);
  const [hasTransport, setHasTransport] = useState(false);
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

  const toOptionalNumber = (value: string) => {
    if (!value.trim()) {
      return undefined;
    }

    const parsed = Number(value);
    return Number.isNaN(parsed) ? undefined : parsed;
  };

  const submitLabel = useMemo(
    () => (saving ? "Saving..." : "Complete Profile"),
    [saving],
  );

  const handleSubmit = async () => {
    try {
      setSaving(true);
      setErrorMessage("");

      if (isFarmer) {
        const result = await createProfile("farmer", {
          fullName,
          phoneNumber,
          email,
          address,
          region,
          nationalId: nationalId || undefined,
          farmerType: farmerType || (hasIrrigation ? "irrigated" : "general"),
          totalLandArea: toOptionalNumber(landSize),
          experienceYears: toOptionalNumber(experienceYears),
        });

        onComplete({
          role: "farmer",
          id: result.id,
          farmerCode: result.farmerCode,
          fullName,
          phoneNumber,
          email,
          address,
          region,
          nationalId: nationalId || undefined,
          farmerType: farmerType || (hasIrrigation ? "irrigated" : "general"),
          totalLandArea: toOptionalNumber(landSize),
          experienceYears: toOptionalNumber(experienceYears),
          hasIrrigation,
        });
      } else {
        const buyerNotes = [
          notes,
          hasStorage ? "Storage available" : "",
          hasTransport ? "Transport available" : "",
        ]
          .filter(Boolean)
          .join(", ")
          .trim();

        const result = await createProfile("buyer", {
          fullName,
          phoneNumber,
          email,
          address,
          region,
          buyerType: buyerType || "general",
          organizationName: organizationName || undefined,
          preferredCrop: preferredCrop || undefined,
          requiredQuantity: toOptionalNumber(requiredQuantity),
          notes: buyerNotes || undefined,
        });

        onComplete({
          role: "buyer",
          id: result.id,
          buyerCode: result.buyerCode,
          fullName,
          phoneNumber,
          email,
          address,
          region,
          buyerType: buyerType || "general",
          organizationName: organizationName || undefined,
          preferredCrop: preferredCrop || undefined,
          requiredQuantity: toOptionalNumber(requiredQuantity),
          notes: buyerNotes || undefined,
          hasStorage,
          hasTransport,
        });
      }
    } catch (error) {
      setErrorMessage(
        error instanceof Error ? error.message : "Failed to save profile",
      );
    } finally {
      setSaving(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={[styles.header, { backgroundColor: themeColor }]} />
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <Animated.View
          style={[
            styles.heroCard,
            {
              opacity: cardOpacity,
              transform: [{ translateY: cardOffset }],
            },
          ]}
        >
          <View style={[styles.badge, { backgroundColor: lightThemeColor }]}>
            <MaterialCommunityIcons
              name={iconName as never}
              size={30}
              color={themeColor}
            />
          </View>
          <View style={styles.roleChip}>
            <Text style={[styles.roleChipText, { color: themeColor }]}>
              {isFarmer ? "Farmer Profile" : "Buyer Profile"}
            </Text>
          </View>
          <Text style={styles.title}>Complete Your Profile</Text>
          <Text style={styles.subtitle}>
            Tell us more about your {isFarmer ? "farm" : "business"} so we can
            save it in Firebase through Spring.
          </Text>
          {initialValues ? (
            <Text style={styles.prefillText}>
              Signup details are already carried forward.
            </Text>
          ) : null}
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
          <View style={styles.sectionHeader}>
            <View
              style={[styles.sectionIcon, { backgroundColor: lightThemeColor }]}
            >
              <MaterialCommunityIcons
                name={isFarmer ? "account" : "office-building-outline"}
                size={22}
                color={themeColor}
              />
            </View>
            <View>
              <Text style={styles.sectionTitle}>{role} Profile</Text>
              <Text style={styles.sectionSubtitleSmall}>
                Required information
              </Text>
            </View>
          </View>

          <View style={styles.fieldsWrap}>
            <View style={styles.inputGroup}>
              <MaterialCommunityIcons
                name="account-outline"
                size={20}
                color="#64748B"
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
                color="#64748B"
              />
              <TextInput
                placeholder="Email"
                placeholderTextColor="#9CA3AF"
                value={email}
                onChangeText={setEmail}
                style={styles.input}
                keyboardType="email-address"
              />
            </View>

            <View style={styles.inputGroup}>
              <MaterialCommunityIcons
                name="phone-outline"
                size={20}
                color="#64748B"
              />
              <TextInput
                placeholder="Phone Number"
                placeholderTextColor="#9CA3AF"
                value={phoneNumber}
                onChangeText={setPhoneNumber}
                style={styles.input}
                keyboardType="phone-pad"
              />
            </View>

            <View style={styles.inputGroup}>
              <MaterialCommunityIcons
                name="home-outline"
                size={20}
                color="#64748B"
              />
              <TextInput
                placeholder="Address"
                placeholderTextColor="#9CA3AF"
                value={address}
                onChangeText={setAddress}
                style={styles.input}
              />
            </View>

            <View style={styles.inputGroup}>
              <MaterialCommunityIcons
                name="map-marker-outline"
                size={20}
                color="#64748B"
              />
              <TextInput
                placeholder="Region or District"
                placeholderTextColor="#9CA3AF"
                value={region}
                onChangeText={setRegion}
                style={styles.input}
              />
            </View>

            {isFarmer ? (
              <>
                <View style={styles.inputGroup}>
                  <MaterialCommunityIcons
                    name="card-account-details-outline"
                    size={20}
                    color="#64748B"
                  />
                  <TextInput
                    placeholder="National ID or Farmer ID"
                    placeholderTextColor="#9CA3AF"
                    value={nationalId}
                    onChangeText={setNationalId}
                    style={styles.input}
                  />
                </View>

                <View style={styles.inputGroup}>
                  <MaterialCommunityIcons
                    name="account-tie-outline"
                    size={20}
                    color="#64748B"
                  />
                  <TextInput
                    placeholder="Farmer Type"
                    placeholderTextColor="#9CA3AF"
                    value={farmerType}
                    onChangeText={setFarmerType}
                    style={styles.input}
                  />
                </View>

                <View style={styles.row}>
                  <View style={[styles.inputGroup, styles.halfInputGroup]}>
                    <MaterialCommunityIcons
                      name="ruler-square"
                      size={20}
                      color="#64748B"
                    />
                    <TextInput
                      placeholder="Land Size (ha)"
                      placeholderTextColor="#9CA3AF"
                      value={landSize}
                      onChangeText={setLandSize}
                      style={styles.input}
                      keyboardType="numeric"
                    />
                  </View>
                  <View style={[styles.inputGroup, styles.halfInputGroup]}>
                    <MaterialCommunityIcons
                      name="calendar-account-outline"
                      size={20}
                      color="#64748B"
                    />
                    <TextInput
                      placeholder="Experience (years)"
                      placeholderTextColor="#9CA3AF"
                      value={experienceYears}
                      onChangeText={setExperienceYears}
                      style={styles.input}
                      keyboardType="numeric"
                    />
                  </View>
                </View>

                <View style={styles.rowCenter}>
                  <View style={styles.inlineInfo}>
                    <MaterialCommunityIcons
                      name="water-outline"
                      size={20}
                      color="#2563EB"
                    />
                    <Text style={styles.inlineLabel}>Irrigation Available</Text>
                  </View>
                  <Switch
                    value={hasIrrigation}
                    onValueChange={setHasIrrigation}
                  />
                </View>
              </>
            ) : (
              <>
                <View style={styles.inputGroup}>
                  <MaterialCommunityIcons
                    name="office-building-outline"
                    size={20}
                    color="#64748B"
                  />
                  <TextInput
                    placeholder="Organization Name"
                    placeholderTextColor="#9CA3AF"
                    value={organizationName}
                    onChangeText={setOrganizationName}
                    style={styles.input}
                  />
                </View>

                <View style={styles.inputGroup}>
                  <MaterialCommunityIcons
                    name="briefcase-outline"
                    size={20}
                    color="#64748B"
                  />
                  <TextInput
                    placeholder="Buyer Type"
                    placeholderTextColor="#9CA3AF"
                    value={buyerType}
                    onChangeText={setBuyerType}
                    style={styles.input}
                  />
                </View>

                <View style={styles.inputGroup}>
                  <MaterialCommunityIcons
                    name="leaf"
                    size={20}
                    color="#64748B"
                  />
                  <TextInput
                    placeholder="Preferred Crop"
                    placeholderTextColor="#9CA3AF"
                    value={preferredCrop}
                    onChangeText={setPreferredCrop}
                    style={styles.input}
                  />
                </View>

                <View style={styles.inputGroup}>
                  <MaterialCommunityIcons
                    name="scale-balance"
                    size={20}
                    color="#64748B"
                  />
                  <TextInput
                    placeholder="Required Quantity"
                    placeholderTextColor="#9CA3AF"
                    value={requiredQuantity}
                    onChangeText={setRequiredQuantity}
                    style={styles.input}
                    keyboardType="numeric"
                  />
                </View>

                <View style={styles.row}>
                  <TouchableOpacity
                    style={[
                      styles.toggleCard,
                      hasStorage && styles.toggleCardActive,
                    ]}
                    onPress={() => setHasStorage((value) => !value)}
                  >
                    <MaterialCommunityIcons
                      name="warehouse"
                      size={22}
                      color={hasStorage ? themeColor : "#94A3B8"}
                    />
                    <Text
                      style={[
                        styles.toggleText,
                        hasStorage && styles.toggleTextActive,
                      ]}
                    >
                      Storage Available
                    </Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[
                      styles.toggleCard,
                      hasTransport && styles.toggleCardActive,
                    ]}
                    onPress={() => setHasTransport((value) => !value)}
                  >
                    <MaterialCommunityIcons
                      name="truck-outline"
                      size={22}
                      color={hasTransport ? themeColor : "#94A3B8"}
                    />
                    <Text
                      style={[
                        styles.toggleText,
                        hasTransport && styles.toggleTextActive,
                      ]}
                    >
                      Transport Available
                    </Text>
                  </TouchableOpacity>
                </View>

                <View style={styles.inputGroup}>
                  <MaterialCommunityIcons
                    name="note-text-outline"
                    size={20}
                    color="#64748B"
                  />
                  <TextInput
                    placeholder="Notes"
                    placeholderTextColor="#9CA3AF"
                    value={notes}
                    onChangeText={setNotes}
                    style={styles.input}
                  />
                </View>
              </>
            )}
          </View>

          {errorMessage ? (
            <Text style={styles.errorText}>{errorMessage}</Text>
          ) : null}

          <TouchableOpacity
            onPress={handleSubmit}
            activeOpacity={0.9}
            style={[styles.primaryButton, { backgroundColor: themeColor }]}
            disabled={saving}
          >
            {saving ? (
              <ActivityIndicator color="#FFFFFF" />
            ) : (
              <Text style={styles.primaryButtonText}>{submitLabel}</Text>
            )}
          </TouchableOpacity>
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
  header: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    height: 220,
    borderBottomLeftRadius: 40,
    borderBottomRightRadius: 40,
    opacity: 0.96,
  },
  scrollContent: {
    flexGrow: 1,
    padding: 20,
    paddingTop: 60,
    paddingBottom: 30,
  },
  heroCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 28,
    padding: 20,
    alignItems: "center",
    marginBottom: 18,
    shadowColor: "#0F172A",
    shadowOpacity: 0.08,
    shadowRadius: 24,
    shadowOffset: { width: 0, height: 12 },
    elevation: 6,
    marginTop: 4,
  },
  badge: {
    width: 84,
    height: 84,
    borderRadius: 42,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 16,
  },
  roleChip: {
    alignSelf: "center",
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 6,
    backgroundColor: "#F8FAFC",
    borderWidth: 1,
    borderColor: "#E2E8F0",
    marginBottom: 10,
  },
  roleChipText: {
    fontSize: 12,
    fontWeight: "700",
  },
  title: {
    fontSize: 26,
    fontWeight: "800",
    color: "#0F172A",
    textAlign: "center",
  },
  subtitle: {
    marginTop: 10,
    textAlign: "center",
    color: "#64748B",
    lineHeight: 22,
  },
  prefillText: {
    marginTop: 12,
    textAlign: "center",
    color: "#0F7A3A",
    fontWeight: "700",
  },
  formCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 28,
    padding: 18,
    shadowColor: "#0F172A",
    shadowOpacity: 0.08,
    shadowRadius: 24,
    shadowOffset: { width: 0, height: 12 },
    elevation: 6,
    marginTop: 4,
  },
  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    marginBottom: 16,
    paddingBottom: 14,
    borderBottomWidth: 1,
    borderBottomColor: "#E2E8F0",
  },
  sectionIcon: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: "center",
    justifyContent: "center",
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "800",
    color: "#0F172A",
  },
  sectionSubtitleSmall: {
    color: "#64748B",
    marginTop: 2,
    fontSize: 12,
  },
  fieldsWrap: {
    gap: 12,
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
  },
  input: {
    flex: 1,
    fontSize: 15,
    color: "#0F172A",
    marginLeft: 10,
  },
  row: {
    flexDirection: "row",
    gap: 10,
  },
  halfInputGroup: {
    flex: 1,
  },
  rowCenter: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 4,
  },
  inlineInfo: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  inlineLabel: {
    fontWeight: "700",
    color: "#334155",
  },
  toggleCard: {
    flex: 1,
    borderWidth: 1,
    borderColor: "#E2E8F0",
    backgroundColor: "#F8FAFC",
    borderRadius: 18,
    padding: 14,
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
  },
  toggleCardActive: {
    backgroundColor: "#F0FDF4",
    borderColor: "#16A34A",
  },
  toggleText: {
    color: "#64748B",
    fontWeight: "700",
    fontSize: 12,
    textAlign: "center",
  },
  toggleTextActive: {
    color: "#0F172A",
  },
  primaryButton: {
    marginTop: 18,
    borderRadius: 18,
    height: 54,
    alignItems: "center",
    justifyContent: "center",
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
  errorText: {
    color: "#B91C1C",
    fontSize: 12,
    marginTop: 12,
    marginBottom: 6,
    textAlign: "center",
    fontWeight: "600",
  },
});
