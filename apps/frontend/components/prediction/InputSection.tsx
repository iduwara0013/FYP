import { MaterialCommunityIcons } from "@expo/vector-icons";
import React from "react";
import { StyleSheet, Text, TextInput, View } from "react-native";

import {
    createPredictionPalette,
    predictionColors,
    predictionRadius,
    predictionShadow,
    predictionSpacing,
} from "./theme";
import { useTheme } from "@/context/ThemeContext";

type InputSectionProps = {
  title: string;
  icon: keyof typeof MaterialCommunityIcons.glyphMap;
  subtitle?: string;
  children: React.ReactNode;
};

export function InputSection({
  title,
  icon,
  subtitle,
  children,
}: InputSectionProps) {
  const { isDark } = useTheme();
  const colors = createPredictionPalette(isDark);
  return (
    <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}> 
      <View style={styles.header}>
        <View style={styles.iconWrap}>
          <MaterialCommunityIcons
            name={icon}
            size={18}
            color={colors.primary}
          />
        </View>
        <View style={styles.headerText}>
          <Text style={[styles.title, { color: colors.text }]}>{title}</Text>
          {subtitle ? <Text style={[styles.subtitle, { color: colors.textMuted }]}>{subtitle}</Text> : null}
        </View>
      </View>
      <View style={styles.body}>{children}</View>
    </View>
  );
}

type LabeledFieldProps = {
  label: string;
  children: React.ReactNode;
};

export function LabeledField({ label, children }: LabeledFieldProps) {
  const { isDark } = useTheme();
  const colors = createPredictionPalette(isDark);
  return (
    <View style={styles.field}>
      <Text style={[styles.fieldLabel, { color: colors.textSecondary }]}>{label}</Text>
      {children}
    </View>
  );
}

type NumericInputProps = {
  value: string;
  onChangeText: (text: string) => void;
  placeholder?: string;
  icon?: keyof typeof MaterialCommunityIcons.glyphMap;
  error?: string | null;
};

export function NumericInput({
  value,
  onChangeText,
  placeholder,
  icon,
  error,
}: NumericInputProps) {
  const { isDark } = useTheme();
  const colors = createPredictionPalette(isDark);
  return (
    <View>
      <View style={[styles.inputWrap, { backgroundColor: colors.background, borderColor: error ? colors.danger : colors.border }]}> 
        {icon ? (
          <MaterialCommunityIcons
            name={icon}
            size={18}
            color={colors.textMuted}
          />
        ) : null}
        <TextInput
          value={value}
          onChangeText={onChangeText}
          keyboardType="numeric"
          placeholder={placeholder}
          placeholderTextColor={colors.textMuted}
          style={[styles.input, { color: colors.text }]}
        />
      </View>
      {error ? <Text style={styles.errorText}>{error}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: predictionColors.card,
    borderRadius: predictionRadius.lg,
    padding: predictionSpacing.lg,
    borderWidth: 1,
    ...predictionShadow.soft,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    gap: predictionSpacing.md,
    marginBottom: predictionSpacing.md,
  },
  iconWrap: {
    width: 36,
    height: 36,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: predictionColors.accentSoft,
  },
  headerText: {
    flex: 1,
  },
  title: {
    fontSize: 15,
    fontWeight: "800",
    color: predictionColors.text,
  },
  subtitle: {
    fontSize: 11,
    color: predictionColors.textMuted,
    marginTop: 1,
  },
  body: {
    gap: predictionSpacing.md,
  },
  field: {
    gap: predictionSpacing.sm,
  },
  fieldLabel: {
    fontSize: 12,
    fontWeight: "700",
    color: predictionColors.textSecondary,
  },
  inputWrap: {
    flexDirection: "row",
    alignItems: "center",
    gap: predictionSpacing.sm,
    backgroundColor: predictionColors.background,
    borderRadius: predictionRadius.md,
    borderWidth: 1,
    borderColor: predictionColors.border,
    paddingHorizontal: predictionSpacing.md,
    paddingVertical: 2,
    minHeight: 46,
  },
  inputWrapError: {
    borderColor: predictionColors.danger,
  },
  input: {
    flex: 1,
    color: predictionColors.text,
    fontSize: 15,
    paddingVertical: predictionSpacing.md,
  },
  errorText: {
    marginTop: 4,
    fontSize: 11,
    fontWeight: "600",
    color: predictionColors.danger,
  },
});
