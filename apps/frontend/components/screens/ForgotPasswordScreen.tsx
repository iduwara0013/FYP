import { MaterialCommunityIcons } from "@expo/vector-icons";
import React, { useEffect, useRef } from "react";
import {
    Animated,
    Easing,
    SafeAreaView,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from "react-native";

type ForgotPasswordScreenProps = {
  onBackToLogin: () => void;
};

export function ForgotPasswordScreen({
  onBackToLogin,
}: ForgotPasswordScreenProps) {
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
      <View style={styles.backgroundGlowOne} />
      <View style={styles.backgroundGlowTwo} />
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <Animated.View
          style={{
            opacity: cardOpacity,
            transform: [{ translateY: cardOffset }],
          }}
        >
          <TouchableOpacity onPress={onBackToLogin} style={styles.backRow}>
            <MaterialCommunityIcons
              name="arrow-left"
              size={20}
              color="#334155"
            />
            <Text style={styles.backText}>Back</Text>
          </TouchableOpacity>
        </Animated.View>

        <Animated.View
          style={[
            styles.iconWrap,
            {
              opacity: cardOpacity,
              transform: [{ translateY: cardOffset }],
            },
          ]}
        >
          <MaterialCommunityIcons name="lock-reset" size={36} color="#0F7A3A" />
        </Animated.View>

        <Animated.View
          style={{
            opacity: cardOpacity,
            transform: [{ translateY: cardOffset }],
          }}
        >
          <Text style={styles.title}>Reset Password</Text>
          <Text style={styles.subtitle}>
            Enter your email address and we&apos;ll send you a password reset
            link.
          </Text>
        </Animated.View>

        <Animated.View
          style={[
            styles.formCard,
            {
              opacity: cardOpacity,
              transform: [{ translateY: cardOffset }],
            },
          ]}
        >
          <View style={styles.inputGroup}>
            <MaterialCommunityIcons
              name="email-outline"
              size={20}
              color="#6B7280"
            />
            <TextInput
              placeholder="Email Address"
              placeholderTextColor="#9CA3AF"
              style={styles.input}
            />
          </View>

          <TouchableOpacity activeOpacity={0.9} style={styles.primaryButton}>
            <Text style={styles.primaryButtonText}>Send Reset Link</Text>
          </TouchableOpacity>

          <TouchableOpacity onPress={onBackToLogin} style={styles.backToLogin}>
            <Text style={styles.backToLoginText}>
              Remember your password? Back to Login
            </Text>
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
  backgroundGlowOne: {
    position: "absolute",
    width: 200,
    height: 200,
    borderRadius: 200,
    backgroundColor: "#DCFCE7",
    opacity: 0.35,
    top: -60,
    right: -60,
  },
  backgroundGlowTwo: {
    position: "absolute",
    width: 160,
    height: 160,
    borderRadius: 160,
    backgroundColor: "#FEF3C7",
    opacity: 0.28,
    bottom: -40,
    left: -60,
  },
  scrollContent: {
    flexGrow: 1,
    padding: 20,
    justifyContent: "center",
  },
  backRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 18,
  },
  backText: {
    color: "#334155",
    fontWeight: "700",
  },
  iconWrap: {
    width: 86,
    height: 86,
    borderRadius: 43,
    backgroundColor: "#DCFCE7",
    alignItems: "center",
    justifyContent: "center",
    alignSelf: "center",
    marginBottom: 18,
  },
  title: {
    fontSize: 28,
    fontWeight: "800",
    color: "#0F172A",
    textAlign: "center",
  },
  subtitle: {
    marginTop: 10,
    textAlign: "center",
    color: "#475569",
    lineHeight: 22,
    marginBottom: 18,
  },
  formCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 28,
    padding: 20,
    shadowColor: "#0F172A",
    shadowOpacity: 0.08,
    shadowRadius: 24,
    shadowOffset: { width: 0, height: 12 },
    elevation: 6,
  },
  inputGroup: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#E2E8F0",
    borderRadius: 18,
    backgroundColor: "#F8FAFC",
    paddingHorizontal: 14,
    marginBottom: 16,
    minHeight: 56,
  },
  input: {
    flex: 1,
    fontSize: 15,
    color: "#0F172A",
    marginLeft: 10,
  },
  primaryButton: {
    backgroundColor: "#0F7A3A",
    borderRadius: 18,
    height: 54,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#0F7A3A",
    shadowOpacity: 0.22,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 10 },
    elevation: 4,
  },
  primaryButtonText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "800",
  },
  backToLogin: {
    marginTop: 18,
  },
  backToLoginText: {
    color: "#0F7A3A",
    fontWeight: "700",
    textAlign: "center",
  },
});
