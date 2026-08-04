import { MaterialCommunityIcons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import React, { useRef } from "react";
import {
    ActivityIndicator,
    Animated,
    StyleSheet,
    Text,
    TouchableWithoutFeedback
} from "react-native";

import { predictionColors, predictionRadius } from "./theme";

type PredictionButtonProps = {
  loading: boolean;
  disabled: boolean;
  onPress: () => void;
};

export function PredictionButton({
  loading,
  disabled,
  onPress,
}: PredictionButtonProps) {
  const scale = useRef(new Animated.Value(1)).current;

  const handlePressIn = () => {
    Animated.spring(scale, {
      toValue: 0.97,
      useNativeDriver: true,
      speed: 40,
      bounciness: 0,
    }).start();
  };

  const handlePressOut = () => {
    Animated.spring(scale, {
      toValue: 1,
      useNativeDriver: true,
      speed: 40,
      bounciness: 8,
    }).start();
  };

  const isDisabled = disabled || loading;

  return (
    <Animated.View style={{ transform: [{ scale }] }}>
      <TouchableWithoutFeedback
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        onPress={onPress}
        disabled={isDisabled}
      >
        <LinearGradient
          colors={
            isDisabled
              ? ["#9CA3AF", "#9CA3AF"]
              : [predictionColors.primary, predictionColors.accent]
          }
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={[styles.button, isDisabled && styles.buttonDisabled]}
        >
          {loading ? (
            <ActivityIndicator color={predictionColors.white} />
          ) : (
            <MaterialCommunityIcons
              name="chart-line"
              size={20}
              color={predictionColors.white}
            />
          )}
          <Text style={styles.buttonText}>
            {loading ? "Predicting…" : "Predict Harvest"}
          </Text>
        </LinearGradient>
      </TouchableWithoutFeedback>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  button: {
    height: 56,
    borderRadius: predictionRadius.pill,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    shadowColor: predictionColors.primary,
    shadowOpacity: 0.3,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 6 },
    elevation: 5,
  },
  buttonDisabled: {
    shadowOpacity: 0.1,
  },
  buttonText: {
    color: predictionColors.white,
    fontSize: 16,
    fontWeight: "800",
  },
});
