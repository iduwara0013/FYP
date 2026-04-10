import { MaterialCommunityIcons } from "@expo/vector-icons";
import React, { useState } from "react";
import {
    SafeAreaView,
    ScrollView,
    StyleSheet,
    Switch,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from "react-native";

type Role = "farmer" | "buyer";

type ProfileCompletionScreenProps = {
  role: Role;
  onComplete: () => void;
};

export function ProfileCompletionScreen({
  role,
  onComplete,
}: ProfileCompletionScreenProps) {
  const [phone, setPhone] = useState("");
  const [region, setRegion] = useState("");

  const [fullName, setFullName] = useState("");
  const [nationalId, setNationalId] = useState("");
  const [landSize, setLandSize] = useState("");
  const [soilType, setSoilType] = useState("");
  const [mainCrops, setMainCrops] = useState("");
  const [hasIrrigation, setHasIrrigation] = useState(false);
  const [language, setLanguage] = useState("");

  const [businessName, setBusinessName] = useState("");
  const [contactPerson, setContactPerson] = useState("");
  const [businessType, setBusinessType] = useState("");
  const [cropsBought, setCropsBought] = useState("");
  const [buyingVolume, setBuyingVolume] = useState("");
  const [hasStorage, setHasStorage] = useState(false);
  const [hasTransport, setHasTransport] = useState(false);

  const isFarmer = role === "farmer";
  const themeColor = isFarmer ? "#16A34A" : "#F59E0B";
  const lightThemeColor = isFarmer ? "#DCFCE7" : "#FEF3C7";
  const iconName = isFarmer ? "sprout" : "storefront-outline";

  return (
    <SafeAreaView style={styles.container}>
      <View style={[styles.header, { backgroundColor: themeColor }]} />
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.heroCard}>
          <View style={[styles.badge, { backgroundColor: lightThemeColor }]}>
            <MaterialCommunityIcons
              name={iconName as never}
              size={30}
              color={themeColor}
            />
          </View>
          <Text style={styles.title}>Complete Your Profile</Text>
          <Text style={styles.subtitle}>
            Tell us more about your {isFarmer ? "farm" : "business"} to get the
            best experience.
          </Text>
        </View>

        <View style={styles.formCard}>
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

          {isFarmer ? (
            <View style={styles.fieldsWrap}>
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
                  name="phone-outline"
                  size={20}
                  color="#6B7280"
                />
                <TextInput
                  placeholder="Phone Number"
                  placeholderTextColor="#9CA3AF"
                  value={phone}
                  onChangeText={setPhone}
                  style={styles.input}
                  keyboardType="phone-pad"
                />
              </View>
              <View style={styles.inputGroup}>
                <MaterialCommunityIcons
                  name="card-account-details-outline"
                  size={20}
                  color="#6B7280"
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
              <View style={styles.row}>
                <View style={[styles.inputGroup, styles.halfInputGroup]}>
                  <MaterialCommunityIcons
                    name="ruler-square"
                    size={20}
                    color="#6B7280"
                  />
                  <TextInput
                    placeholder="Land Size"
                    placeholderTextColor="#9CA3AF"
                    value={landSize}
                    onChangeText={setLandSize}
                    style={styles.input}
                  />
                </View>
                <View style={[styles.inputGroup, styles.halfInputGroup]}>
                  <MaterialCommunityIcons
                    name="leaf"
                    size={20}
                    color="#6B7280"
                  />
                  <TextInput
                    placeholder="Soil Type"
                    placeholderTextColor="#9CA3AF"
                    value={soilType}
                    onChangeText={setSoilType}
                    style={styles.input}
                  />
                </View>
              </View>
              <View style={styles.inputGroup}>
                <MaterialCommunityIcons
                  name="sprout"
                  size={20}
                  color="#6B7280"
                />
                <TextInput
                  placeholder="Main Crops"
                  placeholderTextColor="#9CA3AF"
                  value={mainCrops}
                  onChangeText={setMainCrops}
                  style={styles.input}
                />
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
              <View style={styles.inputGroup}>
                <MaterialCommunityIcons
                  name="translate"
                  size={20}
                  color="#6B7280"
                />
                <TextInput
                  placeholder="Preferred Language"
                  placeholderTextColor="#9CA3AF"
                  value={language}
                  onChangeText={setLanguage}
                  style={styles.input}
                />
              </View>
            </View>
          ) : (
            <View style={styles.fieldsWrap}>
              <View style={styles.inputGroup}>
                <MaterialCommunityIcons
                  name="office-building-outline"
                  size={20}
                  color="#6B7280"
                />
                <TextInput
                  placeholder="Business Name"
                  placeholderTextColor="#9CA3AF"
                  value={businessName}
                  onChangeText={setBusinessName}
                  style={styles.input}
                />
              </View>
              <View style={styles.inputGroup}>
                <MaterialCommunityIcons
                  name="account-outline"
                  size={20}
                  color="#6B7280"
                />
                <TextInput
                  placeholder="Contact Person Name"
                  placeholderTextColor="#9CA3AF"
                  value={contactPerson}
                  onChangeText={setContactPerson}
                  style={styles.input}
                />
              </View>
              <View style={styles.inputGroup}>
                <MaterialCommunityIcons
                  name="phone-outline"
                  size={20}
                  color="#6B7280"
                />
                <TextInput
                  placeholder="Phone Number"
                  placeholderTextColor="#9CA3AF"
                  value={phone}
                  onChangeText={setPhone}
                  style={styles.input}
                  keyboardType="phone-pad"
                />
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
              <View style={styles.inputGroup}>
                <MaterialCommunityIcons
                  name="briefcase-outline"
                  size={20}
                  color="#6B7280"
                />
                <TextInput
                  placeholder="Business Type"
                  placeholderTextColor="#9CA3AF"
                  value={businessType}
                  onChangeText={setBusinessType}
                  style={styles.input}
                />
              </View>
              <View style={styles.row}>
                <View style={[styles.inputGroup, styles.halfInputGroup]}>
                  <MaterialCommunityIcons
                    name="leaf"
                    size={20}
                    color="#6B7280"
                  />
                  <TextInput
                    placeholder="Crops Bought"
                    placeholderTextColor="#9CA3AF"
                    value={cropsBought}
                    onChangeText={setCropsBought}
                    style={styles.input}
                  />
                </View>
                <View style={[styles.inputGroup, styles.halfInputGroup]}>
                  <MaterialCommunityIcons
                    name="scale-balance"
                    size={20}
                    color="#6B7280"
                  />
                  <TextInput
                    placeholder="Buying Volume"
                    placeholderTextColor="#9CA3AF"
                    value={buyingVolume}
                    onChangeText={setBuyingVolume}
                    style={styles.input}
                  />
                </View>
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
            </View>
          )}

          <TouchableOpacity
            onPress={onComplete}
            activeOpacity={0.9}
            style={[styles.primaryButton, { backgroundColor: themeColor }]}
          >
            <Text style={styles.primaryButtonText}>Complete Profile</Text>
          </TouchableOpacity>
        </View>
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
    alignItems: "center",
    marginBottom: 18,
  },
  badge: {
    width: 84,
    height: 84,
    borderRadius: 42,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 16,
  },
  title: {
    fontSize: 28,
    fontWeight: "800",
    color: "#FFFFFF",
    textAlign: "center",
  },
  subtitle: {
    marginTop: 10,
    textAlign: "center",
    color: "rgba(255,255,255,0.85)",
    lineHeight: 22,
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
    shadowOpacity: 0.2,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 10 },
    elevation: 4,
  },
  primaryButtonText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "800",
  },
});
