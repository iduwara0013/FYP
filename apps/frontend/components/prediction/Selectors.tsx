import { MaterialCommunityIcons } from "@expo/vector-icons";
import React, { useEffect, useRef, useState } from "react";
import {
    Animated,
    Modal,
    Pressable,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from "react-native";

import {
    predictionColors,
    predictionRadius,
    predictionShadow,
    predictionSpacing,
} from "./theme";

/* ------------------------------------------------------------------ */
/* ChipSelector – used for Season and Irrigation                       */
/* ------------------------------------------------------------------ */

type ChipSelectorProps = {
  options: string[];
  value: string;
  onChange: (value: string) => void;
};

export function ChipSelector({ options, value, onChange }: ChipSelectorProps) {
  return (
    <View style={styles.chipRow}>
      {options.map((option) => {
        const active = option === value;
        return (
          <TouchableOpacity
            key={option}
            style={[styles.chip, active && styles.chipActive]}
            activeOpacity={0.85}
            onPress={() => onChange(option)}
          >
            <Text style={[styles.chipText, active && styles.chipTextActive]}>
              {option}
            </Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

/* ------------------------------------------------------------------ */
/* DropdownSelector – bottom sheet selector for Crop / District / Region */
/* ------------------------------------------------------------------ */

type DropdownSelectorProps = {
  label: string;
  value: string;
  options: string[];
  onChange: (value: string) => void;
  error?: string | null;
};

export function DropdownSelector({
  label,
  value,
  options,
  onChange,
  error,
}: DropdownSelectorProps) {
  const [visible, setVisible] = useState(false);

  return (
    <View>
      <Text style={styles.fieldLabel}>{label}</Text>
      <TouchableOpacity
        style={[styles.dropdown, error && styles.dropdownError]}
        activeOpacity={0.8}
        onPress={() => setVisible(true)}
      >
        <View style={styles.dropdownLeft}>
          <MaterialCommunityIcons
            name="chevron-down-circle-outline"
            size={18}
            color={predictionColors.primary}
          />
          <Text
            style={[styles.dropdownText, !value && styles.dropdownPlaceholder]}
          >
            {value || "Select..."}
          </Text>
        </View>
        <MaterialCommunityIcons
          name="chevron-down"
          size={20}
          color={predictionColors.textMuted}
        />
      </TouchableOpacity>
      {error ? <Text style={styles.errorText}>{error}</Text> : null}

      <DropdownSheet
        visible={visible}
        title={label}
        value={value}
        options={options}
        onClose={() => setVisible(false)}
        onSelect={(option) => {
          onChange(option);
          setVisible(false);
        }}
      />
    </View>
  );
}

function DropdownSheet({
  visible,
  title,
  value,
  options,
  onClose,
  onSelect,
}: {
  visible: boolean;
  title: string;
  value: string;
  options: string[];
  onClose: () => void;
  onSelect: (value: string) => void;
}) {
  const translateY = useRef(new Animated.Value(600)).current;
  const opacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (visible) {
      translateY.setValue(600);
      opacity.setValue(0);
      Animated.parallel([
        Animated.timing(translateY, {
          toValue: 0,
          duration: 280,
          useNativeDriver: true,
        }),
        Animated.timing(opacity, {
          toValue: 1,
          duration: 220,
          useNativeDriver: true,
        }),
      ]).start();
    }
  }, [visible, translateY, opacity]);

  const close = () => {
    Animated.parallel([
      Animated.timing(translateY, {
        toValue: 600,
        duration: 220,
        useNativeDriver: true,
      }),
      Animated.timing(opacity, {
        toValue: 0,
        duration: 180,
        useNativeDriver: true,
      }),
    ]).start(onClose);
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="none"
      onRequestClose={close}
    >
      <Animated.View style={[styles.modal, { opacity }]}>
        <Pressable style={styles.backdrop} onPress={close} />
        <Animated.View style={[styles.sheet, { transform: [{ translateY }] }]}>
          <View style={styles.handle} />
          <Text style={styles.sheetTitle}>{title}</Text>
          <ScrollView
            showsVerticalScrollIndicator={false}
            style={styles.sheetScroll}
          >
            {options.map((option) => {
              const active = option === value;
              return (
                <TouchableOpacity
                  key={option}
                  style={[styles.option, active && styles.optionActive]}
                  activeOpacity={0.8}
                  onPress={() => onSelect(option)}
                >
                  <Text
                    style={[
                      styles.optionText,
                      active && styles.optionTextActive,
                    ]}
                  >
                    {option}
                  </Text>
                  {active ? (
                    <MaterialCommunityIcons
                      name="check"
                      size={18}
                      color={predictionColors.primary}
                    />
                  ) : null}
                </TouchableOpacity>
              );
            })}
          </ScrollView>
        </Animated.View>
      </Animated.View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  chipRow: {
    flexDirection: "row",
    gap: predictionSpacing.sm,
  },
  chip: {
    paddingHorizontal: predictionSpacing.lg,
    paddingVertical: predictionSpacing.sm + 2,
    borderRadius: predictionRadius.pill,
    backgroundColor: predictionColors.card,
    borderWidth: 1,
    borderColor: predictionColors.border,
  },
  chipActive: {
    backgroundColor: predictionColors.primary,
    borderColor: predictionColors.primary,
  },
  chipText: {
    fontSize: 13,
    fontWeight: "700",
    color: predictionColors.textSecondary,
  },
  chipTextActive: {
    color: predictionColors.white,
  },
  fieldLabel: {
    fontSize: 12,
    fontWeight: "700",
    color: predictionColors.textSecondary,
    marginBottom: predictionSpacing.sm,
  },
  dropdown: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: predictionColors.background,
    borderRadius: predictionRadius.md,
    borderWidth: 1,
    borderColor: predictionColors.border,
    paddingHorizontal: predictionSpacing.md,
    minHeight: 46,
  },
  dropdownError: {
    borderColor: predictionColors.danger,
  },
  dropdownLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: predictionSpacing.sm,
    flex: 1,
  },
  dropdownText: {
    flex: 1,
    fontSize: 14,
    fontWeight: "700",
    color: predictionColors.text,
  },
  dropdownPlaceholder: {
    color: predictionColors.textMuted,
    fontWeight: "500",
  },
  errorText: {
    marginTop: 4,
    fontSize: 11,
    fontWeight: "600",
    color: predictionColors.danger,
  },
  modal: {
    flex: 1,
    justifyContent: "flex-end",
  },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: predictionColors.overlay,
  },
  sheet: {
    backgroundColor: predictionColors.card,
    borderTopLeftRadius: 26,
    borderTopRightRadius: 26,
    maxHeight: "70%",
    paddingBottom: predictionSpacing.xxl,
    ...predictionShadow.card,
  },
  handle: {
    alignSelf: "center",
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: predictionColors.border,
    marginTop: predictionSpacing.md,
    marginBottom: predictionSpacing.md,
  },
  sheetTitle: {
    fontSize: 17,
    fontWeight: "800",
    color: predictionColors.text,
    paddingHorizontal: predictionSpacing.xl,
    marginBottom: predictionSpacing.md,
  },
  sheetScroll: {
    paddingHorizontal: predictionSpacing.lg,
  },
  option: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: predictionSpacing.md,
    paddingVertical: predictionSpacing.md,
    borderRadius: predictionRadius.md,
    marginBottom: predictionSpacing.sm,
    backgroundColor: predictionColors.background,
  },
  optionActive: {
    backgroundColor: predictionColors.accentSoft,
  },
  optionText: {
    fontSize: 14,
    fontWeight: "700",
    color: predictionColors.text,
  },
  optionTextActive: {
    color: predictionColors.primaryDark,
  },
});
