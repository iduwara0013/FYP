import { MaterialCommunityIcons } from "@expo/vector-icons";
import React, { useCallback, useEffect, useMemo, useState } from "react";
import { SafeAreaView, ScrollView, StyleSheet, Text, View } from "react-native";

import {
  FarmPrediction,
  getPredictionOptions,
  predictFarm,
} from "../../lib/prediction-api";
import { fetchWeatherForRegion } from "../../lib/weather";
import { FarmSummaryCard } from "../prediction/FarmSummaryCard";
import {
  InputSection,
  LabeledField,
  NumericInput,
} from "../prediction/InputSection";
import { PredictionLoadingSkeleton } from "../prediction/LoadingSkeleton";
import { PredictionButton } from "../prediction/PredictionButton";
import { PredictionHeader } from "../prediction/PredictionHeader";
import { ResultCard } from "../prediction/ResultCard";
import { ChipSelector, DropdownSelector } from "../prediction/Selectors";
import {
  predictionColors,
  predictionRadius,
  predictionSpacing,
} from "../prediction/theme";
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

  const [touched, setTouched] = useState({
    landArea: false,
    crop: false,
  });

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

  const landAreaValid = useMemo(() => {
    const parsed = parseFloat(landArea);
    return !Number.isNaN(parsed) && parsed > 0;
  }, [landArea]);

  const cropValid = useMemo(
    () => selectedCrop.trim().length > 0,
    [selectedCrop],
  );

  const canPredict = useMemo(
    () => landAreaValid && cropValid && !predicting,
    [landAreaValid, cropValid, predicting],
  );

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

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        <PredictionHeader onBackToHome={onBackToHome} />

        {profile ? (
          <FarmSummaryCard
            profile={profile}
            farmerRegion={farmerRegion}
            farmerDistrict={farmerDistrict}
            farmerLandArea={farmerLandArea}
            farmerIrrigation={farmerIrrigation}
            farmerExperience={farmerExperience}
          />
        ) : null}

        {error ? (
          <View style={styles.errorCard}>
            <MaterialCommunityIcons
              name="alert-circle-outline"
              size={20}
              color={predictionColors.danger}
            />
            <Text style={styles.errorText}>{error}</Text>
          </View>
        ) : null}

        {loadingOptions ? (
          <PredictionLoadingSkeleton />
        ) : (
          <>
            <View style={styles.sectionSpacing}>
              <InputSection
                title="Farm Information"
                icon="information-outline"
                subtitle="Crop, season and location"
              >
                <LabeledField label="Crop">
                  <DropdownSelector
                    label=""
                    value={selectedCrop}
                    options={crops}
                    onChange={setSelectedCrop}
                    error={
                      touched.crop && !cropValid
                        ? "Please select a crop."
                        : null
                    }
                  />
                </LabeledField>

                <LabeledField label="Season">
                  <ChipSelector
                    options={["Maha", "Yala"]}
                    value={selectedSeason}
                    onChange={setSelectedSeason}
                  />
                </LabeledField>

                <LabeledField label="Region">
                  <DropdownSelector
                    label=""
                    value={selectedRegion}
                    options={["Up country", "Low country"]}
                    onChange={handleRegionChange}
                  />
                </LabeledField>

                <LabeledField label="District">
                  <DropdownSelector
                    label=""
                    value={selectedDistrict}
                    options={availableDistricts}
                    onChange={setSelectedDistrict}
                  />
                </LabeledField>
              </InputSection>
            </View>

            <View style={styles.sectionSpacing}>
              <InputSection
                title="Farm Details"
                icon="tractor-variant"
                subtitle="Land, irrigation and experience"
              >
                <LabeledField label="Land Area (hectares)">
                  <NumericInput
                    value={landArea}
                    onChangeText={(text) => {
                      setLandArea(text);
                      setTouched((current) => ({ ...current, landArea: true }));
                    }}
                    placeholder="e.g. 0.5"
                    icon="vector-square"
                    error={
                      touched.landArea && !landAreaValid
                        ? "Enter a valid land area."
                        : null
                    }
                  />
                </LabeledField>

                <LabeledField label="Irrigation">
                  <ChipSelector
                    options={["Irrigated", "Rainfed"]}
                    value={selectedIrrigation}
                    onChange={setSelectedIrrigation}
                  />
                </LabeledField>

                <LabeledField label="Farmer Experience (years)">
                  <NumericInput
                    value={experience}
                    onChangeText={setExperience}
                    placeholder="e.g. 10"
                    icon="star-outline"
                  />
                </LabeledField>
              </InputSection>
            </View>

            <View style={styles.sectionSpacing}>
              <InputSection
                title="Weather"
                icon="weather-pouring"
                subtitle="Auto-filled from region forecast"
              >
                <LabeledField label="Rainfall (mm)">
                  <NumericInput
                    value={rainfall}
                    onChangeText={setRainfall}
                    placeholder="e.g. 150"
                    icon="water-outline"
                  />
                </LabeledField>

                {weatherLoading ? (
                  <View style={styles.weatherLoadingRow}>
                    <MaterialCommunityIcons
                      name="weather-partly-cloudy"
                      size={16}
                      color={predictionColors.primary}
                    />
                    <Text style={styles.weatherLoadingText}>
                      Fetching weather forecast…
                    </Text>
                  </View>
                ) : (
                  <View style={styles.weatherDoneRow}>
                    <MaterialCommunityIcons
                      name="check-circle-outline"
                      size={16}
                      color={predictionColors.success}
                    />
                    <Text style={styles.weatherDoneText}>Forecast loaded</Text>
                  </View>
                )}
              </InputSection>
            </View>

            <View style={styles.sectionSpacing}>
              <InputSection
                title="Fertilizer (Optional)"
                icon="sprout-outline"
                subtitle="Auto default: 150 kg/ha"
              >
                <LabeledField label="Fertilizer (kg)">
                  <NumericInput
                    value={fertilizer}
                    onChangeText={setFertilizer}
                    placeholder="Auto: 150 kg/ha"
                    icon="flower"
                  />
                </LabeledField>
              </InputSection>
            </View>

            <View style={styles.buttonSpacing}>
              <PredictionButton
                loading={predicting}
                disabled={!canPredict}
                onPress={handlePredict}
              />
              {!canPredict && !predicting ? (
                <Text style={styles.hintText}>
                  Complete the crop and land area to enable prediction.
                </Text>
              ) : null}
            </View>

            {result ? (
              <View style={styles.resultSpacing}>
                <ResultCard result={result} />
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
    backgroundColor: predictionColors.background,
  },
  scrollContent: {
    paddingHorizontal: predictionSpacing.lg,
    paddingTop: predictionSpacing.lg,
    paddingBottom: predictionSpacing.xxl,
  },
  errorCard: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: predictionSpacing.sm,
    backgroundColor: predictionColors.dangerSoft,
    borderRadius: predictionRadius.md,
    padding: predictionSpacing.md,
    marginBottom: predictionSpacing.lg,
  },
  errorText: {
    flex: 1,
    color: "#991B1B",
    fontSize: 13,
    lineHeight: 18,
  },
  sectionSpacing: {
    marginBottom: predictionSpacing.lg,
  },
  buttonSpacing: {
    marginTop: predictionSpacing.lg,
    marginBottom: predictionSpacing.lg,
  },
  resultSpacing: {
    marginTop: predictionSpacing.md,
  },
  hintText: {
    marginTop: predictionSpacing.md,
    fontSize: 12,
    color: predictionColors.textMuted,
    textAlign: "center",
  },
  weatherLoadingRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: predictionSpacing.sm,
    backgroundColor: predictionColors.accentSoft,
    borderRadius: predictionRadius.md,
    padding: predictionSpacing.md,
  },
  weatherLoadingText: {
    color: predictionColors.primaryDark,
    fontSize: 13,
    fontWeight: "600",
  },
  weatherDoneRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: predictionSpacing.sm,
    backgroundColor: predictionColors.successSoft,
    borderRadius: predictionRadius.md,
    padding: predictionSpacing.md,
  },
  weatherDoneText: {
    color: predictionColors.primaryDark,
    fontSize: 13,
    fontWeight: "600",
  },
});
