import { MaterialCommunityIcons } from "@expo/vector-icons";
import React from "react";
import { StyleSheet, Text, TextInput, View } from "react-native";

import {
    predictionColors,
    predictionRadius,
    predictionShadow,
    predictionSpacing,
} from "./theme";

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
  return (
    <View style={styles.card}>
      <View style={styles.header}>
        <View style={styles.iconWrap}>
          <MaterialCommunityIcons
            name={icon}
            size={18}
            color={predictionColors.primary}
          />
        </View>
        <View style={styles.headerText}>
          <Text style={styles.title}>{title}</Text>
          {subtitle ? <Text style={styles.subtitle}>{subtitle}</Text> : null}
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
  return (
    <View style={styles.field}>
      <Text style={styles.fieldLabel}>{label}</Text>
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
  return (
    <View>
      <View style={[styles.inputWrap, error && styles.inputWrapError]}>
        {icon ? (
          <MaterialCommunityIcons
            name={icon}
            size={18}
            color={predictionColors.textMuted}
          />
        ) : null}
        <TextInput
          value={value}
          onChangeText={onChangeText}
          keyboardType="numeric"
          placeholder={placeholder}
          placeholderTextColor={predictionColors.textMuted}
          style={styles.input}
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
