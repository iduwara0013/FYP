import { MaterialCommunityIcons } from "@expo/vector-icons";
import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";

import {
  FarmPrediction,
  getPredictionOptions,
  predictFarm,
} from "../../lib/prediction-api";
import { fetchWeatherForRegion } from "../../lib/weather";
import { ProfileData } from "./profile-types";

type YieldPredictionScreenProps = {
  profile?: ProfileData | null;
  onBackToHome: () => void;
};

function formatNumber(value: number) {
  return value.toLocaleString("en-US", {
    maximumFractionDigits: 2,
  });
}

function regionFromProfile(profile?: ProfileData | null): string {
  const raw = profile?.region?.trim();
  if (!raw) {
    return "Up country";
  }
  const lower = raw.toLowerCase();
  if (
    lower.includes("kandy") ||
    lower.includes("nuwara") ||
    lower.includes("badulla")
  ) {
    return "Up country";
  }
  return "Low country";
}

function districtFromProfile(profile?: ProfileData | null): string {
  const raw = profile?.region?.trim();
  if (!raw) {
    return "Kandy";
  }
  const known = [
    "Nuwara Eliya",
    "Badulla",
    "Kandy",
    "Gampaha",
    "Kalutara",
    "Ratnapura",
    "Kurunegala",
  ];
  const match = known.find((d) => d.toLowerCase() === raw.toLowerCase());
  return match ?? "Kandy";
}

export function YieldPredictionScreen({
  profile,
  onBackToHome,
}: YieldPredictionScreenProps) {
  const [loadingOptions, setLoadingOptions] = useState(true);
  const [predicting, setPredicting] = useState(false);
  const [error, setError] = useState("");
  const [result, setResult] = useState<FarmPrediction | null>(null);

  const [crops, setCrops] = useState<string[]>([]);
  const [allDistricts, setAllDistricts] = useState<string[]>([]);

  const farmerRegion = useMemo(() => regionFromProfile(profile), [profile]);
  const farmerDistrict = useMemo(() => districtFromProfile(profile), [profile]);
  const farmerLandArea =
    profile && profile.role === "farmer" && profile.totalLandArea
      ? String(profile.totalLandArea)
      : "0.5";
  const farmerExperience =
    profile && profile.role === "farmer" && profile.experienceYears != null
      ? String(profile.experienceYears)
      : "10";
  const farmerIrrigation =
    profile && profile.role === "farmer"
      ? profile.hasIrrigation
        ? "Irrigated"
        : "Rainfed"
      : "Irrigated";

  const [selectedCrop, setSelectedCrop] = useState("");
  const [selectedRegion, setSelectedRegion] = useState(farmerRegion);
  const [selectedDistrict, setSelectedDistrict] = useState(farmerDistrict);
  const [selectedSeason, setSelectedSeason] = useState("Maha");
  const [selectedIrrigation, setSelectedIrrigation] =
    useState(farmerIrrigation);
  const [landArea, setLandArea] = useState(farmerLandArea);
  const [fertilizer, setFertilizer] = useState("");
  const [rainfall, setRainfall] = useState("150");
  const [experience, setExperience] = useState(farmerExperience);
  const [weatherLoading, setWeatherLoading] = useState(false);

  const availableDistricts = useMemo(() => {
    const upCountry = ["Nuwara Eliya", "Badulla", "Kandy"];
    const lowCountry = ["Gampaha", "Kalutara", "Ratnapura", "Kurunegala"];

    if (selectedRegion === "Up country") {
      return allDistricts.filter((d) => upCountry.includes(d));
    }
    if (selectedRegion === "Low country") {
      return allDistricts.filter((d) => lowCountry.includes(d));
    }
    return allDistricts;
  }, [allDistricts, selectedRegion]);

  const loadOptions = useCallback(async () => {
    try {
      setLoadingOptions(true);
      setError("");
      const options = await getPredictionOptions();
      setCrops(options.crops);
      setAllDistricts(options.districts);
      setSelectedCrop(options.crops[0] ?? "");
    } catch (requestError) {
      setError(
        requestError instanceof Error
          ? requestError.message
          : "Unable to load prediction options.",
      );
    } finally {
      setLoadingOptions(false);
    }
  }, []);

  useEffect(() => {
    void loadOptions();
  }, [loadOptions]);

  const fetchRainfall = useCallback(async (region: string) => {
    try {
      setWeatherLoading(true);
      const weather = await fetchWeatherForRegion(region);
      const rainfallValue = weather.humidity ?? 150;
      setRainfall(String(Math.round(rainfallValue)));
    } catch {
      // Keep the default rainfall value if weather fetch fails
    } finally {
      setWeatherLoading(false);
    }
  }, []);

  useEffect(() => {
    void fetchRainfall(farmerRegion);
  }, [fetchRainfall, farmerRegion]);

  const handleRegionChange = (region: string) => {
    setSelectedRegion(region);
    const upCountry = ["Nuwara Eliya", "Badulla", "Kandy"];
    const lowCountry = ["Gampaha", "Kalutara", "Ratnapura", "Kurunegala"];
    const pool = region === "Up country" ? upCountry : lowCountry;
    const filtered = allDistricts.filter((d) => pool.includes(d));
    setSelectedDistrict(filtered[0] ?? "");
  };

  const handlePredict = useCallback(async () => {
    try {
      setPredicting(true);
      setError("");

      const landAreaHa = parseFloat(landArea);
      if (Number.isNaN(landAreaHa) || landAreaHa <= 0) {
        throw new Error("Please enter a valid land area in hectares.");
      }

      const prediction = await predictFarm({
        land_area_ha: landAreaHa,
        crop: selectedCrop,
        season: selectedSeason,
        region: selectedRegion,
        district: selectedDistrict,
        irrigation: selectedIrrigation,
        ...(fertilizer ? { fertilizer_kg: parseFloat(fertilizer) } : {}),
        rainfall_mm: rainfall ? parseFloat(rainfall) : 150,
        farmer_experience_yrs: experience ? parseInt(experience, 10) : 10,
        year: 2026,
      });

      setResult(prediction);
    } catch (requestError) {
      setResult(null);
      setError(
        requestError instanceof Error
          ? requestError.message
          : "Unable to run the prediction.",
      );
    } finally {
      setPredicting(false);
    }
  }, [
    landArea,
    selectedCrop,
    selectedSeason,
    selectedRegion,
    selectedDistrict,
    selectedIrrigation,
    fertilizer,
    rainfall,
    experience,
  ]);

  const renderPicker = (
    label: string,
    value: string,
    options: string[],
    onSelect: (value: string) => void,
  ) => (
    <View style={styles.field}>
      <Text style={styles.fieldLabel}>{label}</Text>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.chipRow}
      >
        {options.map((option) => {
          const isSelected = option === value;
          return (
            <TouchableOpacity
              key={option}
              style={[styles.chip, isSelected && styles.chipSelected]}
              activeOpacity={0.85}
              onPress={() => onSelect(option)}
            >
              <Text
                style={[styles.chipText, isSelected && styles.chipTextSelected]}
              >
                {option}
              </Text>
            </TouchableOpacity>
          );
        })}
      </ScrollView>
    </View>
  );

  const renderInput = (
    label: string,
    value: string,
    onChangeText: (text: string) => void,
    placeholder: string,
  ) => (
    <View style={styles.field}>
      <Text style={styles.fieldLabel}>{label}</Text>
      <TextInput
        style={styles.input}
        value={value}
        onChangeText={onChangeText}
        keyboardType="numeric"
        placeholder={placeholder}
        placeholderTextColor="#94A3B8"
      />
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.topBlob} />
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.headerRow}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={onBackToHome}
            activeOpacity={0.85}
          >
            <MaterialCommunityIcons
              name="arrow-left"
              size={22}
              color="#0F172A"
            />
            <Text style={styles.backButtonText}>Home</Text>
          </TouchableOpacity>
          <View style={styles.headerIconWrap}>
            <MaterialCommunityIcons
              name="chart-line"
              size={22}
              color="#15803D"
            />
          </View>
        </View>

        <Text style={styles.title}>Yield Prediction</Text>
        <Text style={styles.subtitle}>
          Select a vegetable crop to estimate your production and expected
          revenue. Your farm details are pre-filled from your profile.
        </Text>

        {profile ? (
          <View style={styles.profileSummaryCard}>
            <View style={styles.profileSummaryRow}>
              <MaterialCommunityIcons
                name="account-circle-outline"
                size={20}
                color="#15803D"
              />
              <Text style={styles.profileSummaryText}>{profile.fullName}</Text>
            </View>
            <View style={styles.profileSummaryRow}>
              <MaterialCommunityIcons
                name="map-marker-outline"
                size={20}
                color="#15803D"
              />
              <Text style={styles.profileSummaryText}>
                {profile.region}
                {profile.role === "farmer" && profile.totalLandArea != null
                  ? ` · ${profile.totalLandArea} ha`
                  : ""}
              </Text>
            </View>
            {profile.role === "farmer" ? (
              <View style={styles.profileSummaryRow}>
                <MaterialCommunityIcons
                  name="water-outline"
                  size={20}
                  color="#15803D"
                />
                <Text style={styles.profileSummaryText}>
                  {profile.hasIrrigation ? "Irrigated" : "Rainfed"}
                  {profile.experienceYears != null
                    ? ` · ${profile.experienceYears} yrs experience`
                    : ""}
                </Text>
              </View>
            ) : null}
          </View>
        ) : null}

        {loadingOptions ? (
          <View style={styles.centerState}>
            <ActivityIndicator color="#15803D" size="large" />
            <Text style={styles.centerText}>Loading crops…</Text>
          </View>
        ) : (
          <>
            {renderPicker(
              "Select Crop (Vegetable)",
              selectedCrop,
              crops,
              setSelectedCrop,
            )}

            {renderPicker(
              "Season",
              selectedSeason,
              ["Maha", "Yala"],
              setSelectedSeason,
            )}

            {renderPicker(
              "Region",
              selectedRegion,
              ["Up country", "Low country"],
              handleRegionChange,
            )}

            {renderPicker(
              "District",
              selectedDistrict,
              availableDistricts,
              setSelectedDistrict,
            )}

            {renderPicker(
              "Irrigation",
              selectedIrrigation,
              ["Irrigated", "Rainfed"],
              setSelectedIrrigation,
            )}

            {renderInput(
              "Land area (hectares)",
              landArea,
              setLandArea,
              "e.g. 0.5",
            )}

            {renderInput(
              "Fertilizer (kg) — optional",
              fertilizer,
              setFertilizer,
              "Auto: 150 kg/ha",
            )}

            {renderInput(
              weatherLoading
                ? "Rainfall (mm) — fetching forecast…"
                : "Rainfall (mm) — from forecast",
              rainfall,
              setRainfall,
              "e.g. 150",
            )}

            {renderInput(
              "Farmer experience (years)",
              experience,
              setExperience,
              "e.g. 10",
            )}

            <TouchableOpacity
              style={styles.predictButton}
              onPress={handlePredict}
              activeOpacity={0.9}
              disabled={predicting}
            >
              {predicting ? (
                <ActivityIndicator color="#FFFFFF" />
              ) : (
                <MaterialCommunityIcons
                  name="chart-line"
                  size={20}
                  color="#FFFFFF"
                />
              )}
              <Text style={styles.predictButtonText}>
                {predicting ? "Predicting…" : "Predict Production & Revenue"}
              </Text>
            </TouchableOpacity>

            {error ? (
              <View style={styles.errorCard}>
                <MaterialCommunityIcons
                  name="alert-circle-outline"
                  size={22}
                  color="#B91C1C"
                />
                <Text style={styles.errorText}>{error}</Text>
              </View>
            ) : null}

            {result ? (
              <View style={styles.resultCard}>
                <View style={styles.resultHeaderRow}>
                  <View style={styles.resultIconWrap}>
                    <MaterialCommunityIcons
                      name="sprout"
                      size={28}
                      color="#15803D"
                    />
                  </View>
                  <Text style={styles.resultTitle}>Prediction Results</Text>
                </View>

                <View style={styles.resultCropBadge}>
                  <Text style={styles.resultCropText}>{result.input.crop}</Text>
                </View>

                <View style={styles.resultRow}>
                  <Text style={styles.resultLabel}>Est. production</Text>
                  <Text style={styles.resultValueHighlight}>
                    {formatNumber(result.production_kg)} kg
                  </Text>
                </View>
                <View style={styles.resultRow}>
                  <Text style={styles.resultLabel}>Est. price</Text>
                  <Text style={styles.resultValueHighlight}>
                    Rs {formatNumber(result.price_rs_per_kg)} / kg
                  </Text>
                </View>
                <View style={styles.divider} />
                <View style={styles.resultRow}>
                  <Text style={styles.resultLabel}>Est. revenue</Text>
                  <Text style={styles.resultRevenue}>
                    Rs {formatNumber(result.revenue_rs)}
                  </Text>
                </View>
                <View style={styles.resultRow}>
                  <Text style={styles.resultLabel}>Relative supply</Text>
                  <Text style={styles.resultValue}>
                    {result.relative_supply.toFixed(3)}× crop median
                  </Text>
                </View>
              </View>
            ) : null}
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
  topBlob: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    height: 220,
    backgroundColor: "#DCFCE7",
    borderBottomLeftRadius: 60,
    borderBottomRightRadius: 60,
  },
  scrollContent: {
    paddingHorizontal: 18,
    paddingTop: 12,
    paddingBottom: 40,
  },
  headerRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 18,
  },
  backButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: "#FFFFFF",
    borderRadius: 999,
    paddingHorizontal: 14,
    paddingVertical: 10,
    shadowColor: "#0F172A",
    shadowOpacity: 0.06,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 6 },
    elevation: 3,
  },
  backButtonText: {
    color: "#0F172A",
    fontWeight: "700",
    fontSize: 14,
  },
  headerIconWrap: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: "#FFFFFF",
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#0F172A",
    shadowOpacity: 0.06,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 6 },
    elevation: 3,
  },
  title: {
    fontSize: 28,
    fontWeight: "900",
    color: "#0F172A",
  },
  subtitle: {
    color: "#64748B",
    marginTop: 6,
    marginBottom: 16,
    lineHeight: 20,
  },
  profileSummaryCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 18,
    padding: 14,
    marginBottom: 18,
    gap: 8,
    shadowColor: "#0F172A",
    shadowOpacity: 0.05,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 6 },
    elevation: 3,
  },
  profileSummaryRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  profileSummaryText: {
    color: "#334155",
    fontWeight: "600",
    fontSize: 13,
  },
  centerState: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 60,
    gap: 14,
  },
  centerText: {
    color: "#64748B",
    fontWeight: "600",
  },
  field: {
    marginBottom: 16,
  },
  fieldLabel: {
    color: "#334155",
    fontWeight: "700",
    fontSize: 13,
    marginBottom: 8,
  },
  chipRow: {
    gap: 8,
    paddingRight: 4,
  },
  chip: {
    backgroundColor: "#FFFFFF",
    borderRadius: 999,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderWidth: 1,
    borderColor: "#E2E8F0",
  },
  chipSelected: {
    backgroundColor: "#15803D",
    borderColor: "#15803D",
  },
  chipText: {
    color: "#334155",
    fontWeight: "600",
    fontSize: 13,
  },
  chipTextSelected: {
    color: "#FFFFFF",
  },
  input: {
    backgroundColor: "#FFFFFF",
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "#E2E8F0",
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 15,
    color: "#0F172A",
  },
  predictButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    backgroundColor: "#15803D",
    borderRadius: 999,
    paddingVertical: 15,
    marginTop: 4,
  },
  predictButtonText: {
    color: "#FFFFFF",
    fontWeight: "800",
    fontSize: 15,
  },
  errorCard: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    backgroundColor: "#FEF2F2",
    borderRadius: 16,
    padding: 14,
    marginTop: 16,
    borderWidth: 1,
    borderColor: "#FECACA",
  },
  errorText: {
    color: "#B91C1C",
    fontWeight: "600",
    flex: 1,
  },
  resultCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 24,
    padding: 20,
    marginTop: 20,
    shadowColor: "#0F172A",
    shadowOpacity: 0.08,
    shadowRadius: 18,
    shadowOffset: { width: 0, height: 10 },
    elevation: 5,
  },
  resultHeaderRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    marginBottom: 16,
  },
  resultIconWrap: {
    width: 52,
    height: 52,
    borderRadius: 18,
    backgroundColor: "#DCFCE7",
    alignItems: "center",
    justifyContent: "center",
  },
  resultTitle: {
    color: "#0F172A",
    fontWeight: "800",
    fontSize: 17,
  },
  resultCropBadge: {
    alignSelf: "flex-start",
    backgroundColor: "#FEF3C7",
    borderRadius: 999,
    paddingHorizontal: 14,
    paddingVertical: 6,
    marginBottom: 14,
  },
  resultCropText: {
    color: "#B45309",
    fontWeight: "800",
    fontSize: 14,
  },
  resultRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 8,
  },
  resultLabel: {
    color: "#64748B",
    fontWeight: "600",
    fontSize: 13,
  },
  resultValue: {
    color: "#0F172A",
    fontWeight: "700",
    fontSize: 14,
  },
  resultValueHighlight: {
    color: "#15803D",
    fontWeight: "800",
    fontSize: 15,
  },
  resultRevenue: {
    color: "#B45309",
    fontWeight: "900",
    fontSize: 18,
  },
  divider: {
    height: 1,
    backgroundColor: "#E2E8F0",
    marginVertical: 8,
  },
});
