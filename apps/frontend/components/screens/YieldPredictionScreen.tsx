import { useFormI18n } from "@/i18n/useFormI18n";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import React, { useCallback, useEffect, useMemo, useState } from "react";
import { ScrollView, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { ScreenHeader } from "@/components/ui/ScreenHeader";
import { useTheme } from "@/context/ThemeContext";

import { recordPredictionMade } from "../../lib/notifications/DailyTipsService";
import {
  FarmPrediction,
  getPredictionOptions,
  predictFarm,
} from "../../lib/prediction-api";
import { FarmSummaryCard } from "../prediction/FarmSummaryCard";
import {
  InputSection,
  LabeledField,
  NumericInput,
} from "../prediction/InputSection";
import { PredictionLoadingSkeleton } from "../prediction/LoadingSkeleton";
import { PredictionButton } from "../prediction/PredictionButton";
import { ResultCard } from "../prediction/ResultCard";
import { ChipSelector, DropdownSelector } from "../prediction/Selectors";
import {
  predictionColors,
  createPredictionPalette,
  predictionRadius,
  predictionSpacing,
} from "../prediction/theme";
import { ProfileData } from "./profile-types";

type YieldPredictionScreenProps = {
  profile?: ProfileData | null;
  onBackToHome: () => void;
};

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
  const { tx, errorText } = useFormI18n();

  const { isDark } = useTheme();
  const colors = createPredictionPalette(isDark);
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
      : "";
  const farmerExperience =
    profile && profile.role === "farmer" && profile.experienceYears != null
      ? String(profile.experienceYears)
      : "";
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
  const [rainfall, setRainfall] = useState("");
  const [experience, setExperience] = useState(farmerExperience);

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
        errorText(requestError, "Unable to load prediction options."),
      );
    } finally {
      setLoadingOptions(false);
    }
  }, [errorText]);

  useEffect(() => {
    void loadOptions();
  }, [loadOptions]);

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
        throw new Error(tx("Please enter a valid land area in hectares."));
      }

      const prediction = await predictFarm({
        land_area_ha: landAreaHa,
        crop: selectedCrop,
        season: selectedSeason,
        region: selectedRegion,
        district: selectedDistrict,
        irrigation: selectedIrrigation,
        ...(fertilizer ? { fertilizer_kg: parseFloat(fertilizer) } : {}),
        ...(rainfall ? { rainfall_mm: parseFloat(rainfall) } : {}),
        ...(experience ? { farmer_experience_yrs: parseInt(experience, 10) } : {}),
        year: new Date().getFullYear(),
      });

      setResult(prediction);
      // Record that the user made a prediction (for prediction reminders).
      void recordPredictionMade();
    } catch (requestError) {
      setResult(null);
      setError(
        errorText(requestError, "Unable to run the prediction."),
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
    tx,
    errorText,
  ]);

  return (
    <SafeAreaView edges={["top"]} style={[styles.container, { backgroundColor: colors.background }]}> 
      <ScreenHeader title={tx("AI yield prediction")} subtitle={tx("Forecast harvest and revenue")} icon="chart-timeline-variant" onBack={onBackToHome} />
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        <View style={[styles.introCard, { backgroundColor: colors.accentSoft, borderColor: colors.border }]}> 
          <View style={[styles.introIcon, { backgroundColor: colors.card }]}><MaterialCommunityIcons name="brain" size={22} color={colors.accent}/></View>
          <View style={{ flex: 1 }}><Text style={[styles.introTitle, { color: colors.text }]}>{tx("Farm-aware forecast")}</Text><Text style={[styles.introText, { color: colors.textSecondary }]}>{tx("Uses your crop, location, land, irrigation and optional field conditions.")}</Text></View>
        </View>

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
          <View style={[styles.errorCard, { backgroundColor: colors.dangerSoft, borderColor: colors.danger }]}> 
            <MaterialCommunityIcons
              name="alert-circle-outline"
              size={20}
              color={predictionColors.danger}
            />
            <Text style={[styles.errorText, { color: colors.danger }]}>{error}</Text>
          </View>
        ) : null}

        {loadingOptions ? (
          <PredictionLoadingSkeleton />
        ) : (
          <>
            <View style={styles.sectionSpacing}>
              <InputSection
                title={tx("Farm Information")}
                icon="information-outline"
                subtitle={tx("Crop, season and location")}
              >
                <LabeledField label={tx("Crop")}>
                  <DropdownSelector
                    label=""
                    value={selectedCrop}
                    options={crops}
                    onChange={setSelectedCrop}
                    error={
                      touched.crop && !cropValid
                        ? tx("Please select a crop.")
                        : null
                    }
                  />
                </LabeledField>

                <LabeledField label={tx("Season")}>
                  <ChipSelector
                    options={["Maha", "Yala"]}
                    value={selectedSeason}
                    onChange={setSelectedSeason}
                  />
                </LabeledField>

                <LabeledField label={tx("Region")}>
                  <DropdownSelector
                    label=""
                    value={selectedRegion}
                    options={["Up country", "Low country"]}
                    onChange={handleRegionChange}
                  />
                </LabeledField>

                <LabeledField label={tx("District")}>
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
                title={tx("Farm Details")}
                icon="tractor-variant"
                subtitle={tx("Land, irrigation and experience")}
              >
                <LabeledField label={tx("Land Area (hectares)")}>
                  <NumericInput
                    value={landArea}
                    onChangeText={(text) => {
                      setLandArea(text);
                      setTouched((current) => ({ ...current, landArea: true }));
                    }}
                    placeholder={tx("e.g. 0.5")}
                    icon="vector-square"
                    error={
                      touched.landArea && !landAreaValid
                        ? tx("Enter a valid land area.")
                        : null
                    }
                  />
                </LabeledField>

                <LabeledField label={tx("Irrigation")}>
                  <ChipSelector
                    options={["Irrigated", "Rainfed"]}
                    value={selectedIrrigation}
                    onChange={setSelectedIrrigation}
                  />
                </LabeledField>

                <LabeledField label={tx("Farmer Experience (years)")}>
                  <NumericInput
                    value={experience}
                    onChangeText={setExperience}
                    placeholder={tx("e.g. 10")}
                    icon="star-outline"
                  />
                </LabeledField>
              </InputSection>
            </View>

            <View style={styles.sectionSpacing}>
              <InputSection
                title={tx("Weather")}
                icon="weather-pouring"
                subtitle={tx("Optional observed rainfall")}
              >
                <LabeledField label={tx("Rainfall (mm, optional)")}>
                  <NumericInput
                    value={rainfall}
                    onChangeText={setRainfall}
                    placeholder={tx("e.g. 150")}
                    icon="water-outline"
                  />
                </LabeledField>

                <View style={styles.weatherDoneRow}><MaterialCommunityIcons name="information-outline" size={16} color={predictionColors.info}/><Text style={styles.weatherDoneText}>{tx("Leave empty when rainfall is unknown.")}</Text></View>
              </InputSection>
            </View>

            <View style={styles.sectionSpacing}>
              <InputSection
                title={tx("Fertilizer (Optional)")}
                icon="sprout-outline"
                subtitle={tx("Auto default: 150 kg/ha")}
              >
                <LabeledField label={tx("Fertilizer (kg)")}>
                  <NumericInput
                    value={fertilizer}
                    onChangeText={setFertilizer}
                    placeholder={tx("Auto: 150 kg/ha")}
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
                  {tx("Complete the crop and land area to enable prediction.")}</Text>
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
  introCard: { flexDirection: "row", alignItems: "center", gap: 12, borderWidth: 1, borderRadius: 20, padding: 16, marginBottom: 18 },
  introIcon: { width: 44, height: 44, borderRadius: 14, alignItems: "center", justifyContent: "center" },
  introTitle: { fontSize: 15, fontWeight: "900" }, introText: { fontSize: 12, lineHeight: 18, marginTop: 3 },
  errorCard: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: predictionSpacing.sm,
    backgroundColor: predictionColors.dangerSoft,
    borderRadius: predictionRadius.md,
    padding: predictionSpacing.md,
    marginBottom: predictionSpacing.lg,
    borderWidth: 1,
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
