import { MaterialCommunityIcons } from "@expo/vector-icons";
import React from "react";
import {
    FlatList,
    SafeAreaView,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from "react-native";

const actionCards = [
  {
    icon: "leaf",
    title: "Crop Recommendation",
    description: "Get AI-powered crop suggestions",
    background: "#DCFCE7",
    iconColor: "#15803D",
  },
  {
    icon: "chart-line",
    title: "Yield Prediction",
    description: "Forecast your harvest yield",
    background: "#FEF3C7",
    iconColor: "#B45309",
  },
  {
    icon: "weather-partly-cloudy",
    title: "Weather Update",
    description: "Real-time weather forecast",
    background: "#DBEAFE",
    iconColor: "#2563EB",
  },
  {
    icon: "currency-usd",
    title: "Market Prices",
    description: "Latest crop market rates",
    background: "#FFEDD5",
    iconColor: "#EA580C",
  },
];

const recentPredictions = [
  { crop: "Rice", confidence: "94%", status: "Excellent", accent: "#16A34A" },
  { crop: "Wheat", confidence: "87%", status: "Good", accent: "#2563EB" },
  { crop: "Corn", confidence: "91%", status: "Excellent", accent: "#F59E0B" },
];

type HomeScreenProps = {
  onProfile?: () => void;
};

export function HomeScreen({ onProfile }: HomeScreenProps) {
  return (
    <SafeAreaView style={styles.container}>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.header}>
          <View>
            <Text style={styles.greeting}>Good Morning, Farmer</Text>
            <Text style={styles.headerSubtitle}>
              Let&apos;s plan today&apos;s crop decisions.
            </Text>
          </View>
          <TouchableOpacity
            style={styles.avatar}
            onPress={onProfile}
            activeOpacity={0.8}
          >
            <MaterialCommunityIcons
              name="bell-outline"
              size={20}
              color="#FFFFFF"
            />
          </TouchableOpacity>
        </View>

        <View style={styles.profileCard}>
          <View style={styles.profileIcon}>
            <MaterialCommunityIcons name="account" size={30} color="#FFFFFF" />
          </View>
          <View style={styles.profileInfo}>
            <Text style={styles.profileName}>John Farmer</Text>
            <Text style={styles.profileMeta}>Region: Kandy | Land: 1.8 ha</Text>
          </View>
          <View style={styles.dateBox}>
            <Text style={styles.dateLabel}>Today</Text>
            <Text style={styles.dateValue}>Apr 10, 2026</Text>
          </View>
        </View>

        <Text style={styles.sectionTitle}>Quick Actions</Text>
        <View style={styles.grid}>
          {actionCards.map((card) => (
            <View key={card.title} style={styles.actionCard}>
              <View
                style={[
                  styles.actionIconWrap,
                  { backgroundColor: card.background },
                ]}
              >
                <MaterialCommunityIcons
                  name={card.icon as never}
                  size={26}
                  color={card.iconColor}
                />
              </View>
              <Text style={styles.actionTitle}>{card.title}</Text>
              <Text style={styles.actionDescription}>{card.description}</Text>
            </View>
          ))}
        </View>

        <View style={styles.alertCard}>
          <MaterialCommunityIcons
            name="weather-partly-rainy"
            size={26}
            color="#FFFFFF"
          />
          <View style={styles.alertTextWrap}>
            <Text style={styles.alertTitle}>Weather Alert</Text>
            <Text style={styles.alertText}>
              Moderate rainfall expected in the next 48 hours. Good timing for
              land preparation.
            </Text>
          </View>
        </View>

        <Text style={styles.sectionTitle}>Recent Predictions</Text>
        <FlatList
          horizontal
          data={recentPredictions}
          keyExtractor={(item) => item.crop}
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.predictionRow}
          renderItem={({ item }) => (
            <View style={styles.predictionCard}>
              <View style={styles.predictionHeader}>
                <Text style={styles.predictionCrop}>{item.crop}</Text>
                <View
                  style={[styles.statusDot, { backgroundColor: item.accent }]}
                />
              </View>
              <Text style={styles.predictionValue}>{item.confidence}</Text>
              <Text style={styles.predictionStatus}>{item.status}</Text>
            </View>
          )}
        />
      </ScrollView>

      <View style={styles.bottomNav}>
        <View style={styles.bottomNavInner}>
          <TouchableOpacity style={styles.navItemActive}>
            <MaterialCommunityIcons
              name="home-variant"
              size={24}
              color="#0F7A3A"
            />
            <Text style={styles.navItemActiveText}>Home</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.navItem}>
            <MaterialCommunityIcons
              name="chart-line"
              size={24}
              color="#64748B"
            />
            <Text style={styles.navItemText}>Predict</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.navItem}>
            <MaterialCommunityIcons
              name="bell-outline"
              size={24}
              color="#64748B"
            />
            <Text style={styles.navItemText}>Alerts</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.navItem} onPress={onProfile}>
            <MaterialCommunityIcons
              name="account-outline"
              size={24}
              color="#64748B"
            />
            <Text style={styles.navItemText}>Profile</Text>
          </TouchableOpacity>
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F8FAFC",
  },
  scrollContent: {
    paddingHorizontal: 18,
    paddingTop: 12,
    paddingBottom: 110,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 18,
  },
  greeting: {
    fontSize: 25,
    fontWeight: "800",
    color: "#0F172A",
  },
  headerSubtitle: {
    color: "#64748B",
    marginTop: 6,
  },
  avatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: "#0F7A3A",
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#0F7A3A",
    shadowOpacity: 0.2,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 6 },
    elevation: 4,
  },
  profileCard: {
    backgroundColor: "#0F7A3A",
    borderRadius: 26,
    padding: 18,
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
    marginBottom: 22,
  },
  profileIcon: {
    width: 58,
    height: 58,
    borderRadius: 29,
    backgroundColor: "rgba(255,255,255,0.18)",
    alignItems: "center",
    justifyContent: "center",
  },
  profileInfo: {
    flex: 1,
  },
  profileName: {
    color: "#FFFFFF",
    fontWeight: "800",
    fontSize: 18,
  },
  profileMeta: {
    color: "rgba(255,255,255,0.82)",
    marginTop: 4,
  },
  dateBox: {
    alignItems: "flex-end",
  },
  dateLabel: {
    color: "rgba(255,255,255,0.7)",
    fontSize: 12,
  },
  dateValue: {
    color: "#FFFFFF",
    fontWeight: "700",
    marginTop: 4,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "800",
    color: "#0F172A",
    marginBottom: 12,
  },
  grid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
    gap: 12,
    marginBottom: 20,
  },
  actionCard: {
    width: "48%",
    backgroundColor: "#FFFFFF",
    borderRadius: 22,
    padding: 16,
    shadowColor: "#0F172A",
    shadowOpacity: 0.06,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 8 },
    elevation: 4,
    minHeight: 154,
  },
  actionIconWrap: {
    width: 48,
    height: 48,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 12,
  },
  actionTitle: {
    color: "#0F172A",
    fontWeight: "800",
    fontSize: 15,
    lineHeight: 20,
  },
  actionDescription: {
    color: "#64748B",
    marginTop: 6,
    lineHeight: 19,
    fontSize: 12,
  },
  alertCard: {
    backgroundColor: "#2563EB",
    borderRadius: 24,
    padding: 18,
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 12,
    marginBottom: 20,
  },
  alertTextWrap: {
    flex: 1,
  },
  alertTitle: {
    color: "#FFFFFF",
    fontWeight: "800",
    fontSize: 16,
  },
  alertText: {
    color: "rgba(255,255,255,0.92)",
    marginTop: 6,
    lineHeight: 20,
  },
  predictionRow: {
    gap: 12,
    paddingBottom: 6,
  },
  predictionCard: {
    width: 160,
    backgroundColor: "#FFFFFF",
    borderRadius: 20,
    padding: 16,
    shadowColor: "#0F172A",
    shadowOpacity: 0.06,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 8 },
    elevation: 4,
  },
  predictionHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  predictionCrop: {
    color: "#0F172A",
    fontWeight: "800",
  },
  statusDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  predictionValue: {
    color: "#0F172A",
    fontSize: 28,
    fontWeight: "900",
    marginTop: 18,
  },
  predictionStatus: {
    color: "#64748B",
    marginTop: 4,
  },
  bottomNav: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "#FFFFFF",
    borderTopWidth: 1,
    borderTopColor: "#E2E8F0",
    paddingVertical: 10,
    paddingHorizontal: 14,
  },
  bottomNavInner: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  navItem: {
    alignItems: "center",
    justifyContent: "center",
    flex: 1,
    gap: 4,
  },
  navItemActive: {
    alignItems: "center",
    justifyContent: "center",
    flex: 1,
    gap: 4,
  },
  navItemText: {
    color: "#64748B",
    fontSize: 11,
    fontWeight: "700",
  },
  navItemActiveText: {
    color: "#0F7A3A",
    fontSize: 11,
    fontWeight: "800",
  },
});
