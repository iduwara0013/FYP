import { MaterialCommunityIcons } from "@expo/vector-icons";
import React, { useEffect, useRef } from "react";
import {
    Animated,
    Easing,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { ProfileData } from "./profile-types";

type ProfileViewScreenProps = {
  profile: ProfileData;
  onBackToHome: () => void;
};

type InfoRowProps = {
  label: string;
  value: string;
  icon: keyof typeof MaterialCommunityIcons.glyphMap;
};

function InfoRow({ label, value, icon }: InfoRowProps) {
  return (
    <View style={styles.infoRow}>
      <View style={styles.infoIconWrap}>
        <MaterialCommunityIcons name={icon} size={18} color="#0F7A3A" />
      </View>
      <View style={styles.infoTextWrap}>
        <Text style={styles.infoLabel}>{label}</Text>
        <Text style={styles.infoValue}>{value}</Text>
      </View>
    </View>
  );
}

export function ProfileViewScreen({
  profile,
  onBackToHome,
}: ProfileViewScreenProps) {
  const isFarmer = profile.role === "farmer";
  const accentColor = isFarmer ? "#16A34A" : "#F59E0B";
  const accentSoft = isFarmer ? "#DCFCE7" : "#FEF3C7";
  const roleLabel = isFarmer ? "Farmer Profile" : "Buyer Profile";
  const codeLabel = isFarmer ? profile.farmerCode : profile.buyerCode;
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

  return (
    <SafeAreaView style={styles.container}>
      <View
        style={[styles.headerBackground, { backgroundColor: accentColor }]}
      />
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <Animated.View
          style={[
            styles.headerRow,
            {
              opacity: cardOpacity,
              transform: [{ translateY: cardOffset }],
            },
          ]}
        >
          <TouchableOpacity
            style={styles.backButton}
            onPress={onBackToHome}
            activeOpacity={0.85}
          >
            <MaterialCommunityIcons
              name="arrow-left"
              size={20}
              color="#FFFFFF"
            />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Profile</Text>
          <View style={styles.headerSpacer} />
        </Animated.View>

        <Animated.View
          style={[
            styles.heroCard,
            {
              opacity: cardOpacity,
              transform: [{ translateY: cardOffset }],
            },
          ]}
        >
          <View style={[styles.avatar, { backgroundColor: accentColor }]}>
            <MaterialCommunityIcons
              name={isFarmer ? "sprout" : "storefront-outline"}
              size={30}
              color="#FFFFFF"
            />
          </View>
          <View style={styles.heroTextWrap}>
            <Text style={styles.title}>{profile.fullName}</Text>
            <Text style={styles.subtitle}>{roleLabel}</Text>
            <Text style={styles.heroNote}>
              This view shows the details you entered during signup and profile
              completion.
            </Text>
            <View style={[styles.codeChip, { backgroundColor: accentSoft }]}>
              <Text style={[styles.codeChipText, { color: accentColor }]}>
                {codeLabel ?? "Saved in Firebase"}
              </Text>
            </View>
          </View>
        </Animated.View>

        <Animated.View
          style={[
            styles.sectionCard,
            {
              opacity: cardOpacity,
              transform: [{ translateY: cardOffset }],
            },
          ]}
        >
          <View style={styles.sectionHeader}>
            <MaterialCommunityIcons
              name="account-details"
              size={22}
              color="#0F7A3A"
            />
            <Text style={styles.sectionTitle}>Profile Details</Text>
          </View>

          <InfoRow
            label="Full Name"
            value={profile.fullName}
            icon="account-outline"
          />
          <InfoRow label="Email" value={profile.email} icon="email-outline" />
          <InfoRow
            label="Phone Number"
            value={profile.phoneNumber || "Not provided"}
            icon="phone-outline"
          />
          <InfoRow
            label="Address"
            value={profile.address || "Not provided"}
            icon="home-outline"
          />
          <InfoRow
            label="Region"
            value={profile.region}
            icon="map-marker-outline"
          />
        </Animated.View>

        <Animated.View
          style={[
            styles.sectionCard,
            {
              opacity: cardOpacity,
              transform: [{ translateY: cardOffset }],
            },
          ]}
        >
          <View style={styles.sectionHeader}>
            <MaterialCommunityIcons
              name={isFarmer ? "sprout" : "office-building-outline"}
              size={22}
              color="#0F7A3A"
            />
            <Text style={styles.sectionTitle}>
              {isFarmer ? "Farmer Information" : "Buyer Information"}
            </Text>
          </View>

          {isFarmer ? (
            <>
              <InfoRow
                label="National ID"
                value={profile.nationalId || "Not provided"}
                icon="card-account-details-outline"
              />
              <InfoRow
                label="Farmer Type"
                value={profile.farmerType}
                icon="account-tie-outline"
              />
              <InfoRow
                label="Land Size"
                value={
                  profile.totalLandArea != null
                    ? `${profile.totalLandArea} ha`
                    : "Not provided"
                }
                icon="ruler-square"
              />
              <InfoRow
                label="Experience"
                value={
                  profile.experienceYears != null
                    ? `${profile.experienceYears} years`
                    : "Not provided"
                }
                icon="calendar-account-outline"
              />
              <InfoRow
                label="Irrigation"
                value={profile.hasIrrigation ? "Available" : "Not available"}
                icon="water-outline"
              />
            </>
          ) : (
            <>
              <InfoRow
                label="Organization Name"
                value={profile.organizationName || "Not provided"}
                icon="office-building-outline"
              />
              <InfoRow
                label="Buyer Type"
                value={profile.buyerType}
                icon="briefcase-outline"
              />
              <InfoRow
                label="Preferred Crop"
                value={profile.preferredCrop || "Not provided"}
                icon="leaf"
              />
              <InfoRow
                label="Required Quantity"
                value={
                  profile.requiredQuantity != null
                    ? String(profile.requiredQuantity)
                    : "Not provided"
                }
                icon="scale-balance"
              />
              <InfoRow
                label="Storage"
                value={profile.hasStorage ? "Available" : "Not available"}
                icon="warehouse"
              />
              <InfoRow
                label="Transport"
                value={profile.hasTransport ? "Available" : "Not available"}
                icon="truck-outline"
              />
              <InfoRow
                label="Notes"
                value={profile.notes || "Not provided"}
                icon="note-text-outline"
              />
            </>
          )}
        </Animated.View>

        <Animated.View
          style={{
            opacity: cardOpacity,
            transform: [{ translateY: cardOffset }],
          }}
        >
          <TouchableOpacity
            style={styles.button}
            onPress={onBackToHome}
            activeOpacity={0.85}
          >
            <MaterialCommunityIcons
              name="home-outline"
              size={20}
              color="#FFFFFF"
            />
            <Text style={styles.buttonText}>Back to Home</Text>
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
  headerBackground: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    height: 220,
    borderBottomLeftRadius: 36,
    borderBottomRightRadius: 36,
  },
  scrollContent: {
    paddingHorizontal: 18,
    paddingTop: 12,
    paddingBottom: 28,
  },
  headerRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 18,
  },
  backButton: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: "rgba(255,255,255,0.18)",
    alignItems: "center",
    justifyContent: "center",
  },
  headerTitle: {
    color: "#FFFFFF",
    fontWeight: "800",
    fontSize: 18,
  },
  headerSpacer: {
    width: 42,
    height: 42,
  },
  heroCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 28,
    padding: 20,
    flexDirection: "row",
    alignItems: "center",
    gap: 16,
    shadowColor: "#0F172A",
    shadowOpacity: 0.08,
    shadowRadius: 18,
    shadowOffset: { width: 0, height: 10 },
    elevation: 5,
    marginBottom: 18,
  },
  avatar: {
    width: 70,
    height: 70,
    borderRadius: 22,
    alignItems: "center",
    justifyContent: "center",
  },
  heroTextWrap: {
    flex: 1,
    gap: 6,
  },
  title: {
    fontSize: 22,
    fontWeight: "800",
    color: "#0F172A",
  },
  subtitle: {
    color: "#64748B",
  },
  codeChip: {
    alignSelf: "flex-start",
    borderRadius: 999,
    heroNote: {
      color: "#475569",
      lineHeight: 18,
      marginTop: 8,
    },
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  codeChipText: {
    fontSize: 12,
    fontWeight: "700",
  },
  sectionCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 24,
    padding: 18,
    marginBottom: 16,
    shadowColor: "#0F172A",
    shadowOpacity: 0.05,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 8 },
    elevation: 3,
  },
  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    marginBottom: 14,
  },
  sectionTitle: {
    fontSize: 17,
    fontWeight: "800",
    color: "#0F172A",
  },
  infoRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 12,
    paddingVertical: 10,
    borderTopWidth: 1,
    borderTopColor: "#E2E8F0",
  },
  infoIconWrap: {
    width: 34,
    height: 34,
    borderRadius: 12,
    backgroundColor: "#ECFDF5",
    alignItems: "center",
    justifyContent: "center",
    marginTop: 2,
  },
  infoTextWrap: {
    flex: 1,
  },
  infoLabel: {
    fontSize: 12,
    color: "#64748B",
    textTransform: "uppercase",
    letterSpacing: 0.4,
  },
  infoValue: {
    color: "#0F172A",
    fontSize: 15,
    fontWeight: "600",
    marginTop: 3,
  },
  button: {
    marginTop: 4,
    backgroundColor: "#0F7A3A",
    borderRadius: 18,
    minHeight: 54,
    paddingHorizontal: 18,
    alignItems: "center",
    justifyContent: "center",
    flexDirection: "row",
    gap: 10,
  },
  buttonText: {
    color: "#FFFFFF",
    fontSize: 15,
    fontWeight: "700",
  },
});
