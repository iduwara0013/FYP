/**
 * ChatBot — A small crop-recommendation chatbot for the AI Recommendation screen.
 *
 * The farmer can discuss crops ("What should I grow on 1.5 ha in Kandy?") and
 * the assistant replies via the FastAPI /api/ai/chat endpoint. When a reply
 * carries crop recommendations they are rendered as tappable tiles — tapping a
 * tile selects that crop and (via `onSelectCrop`) opens the growing-plan screen.
 *
 * Selection is seeded with the recommendation screen's existing `top_crops` so
 * the farmer can always pick a crop even when the chat backend is unreachable.
 */
import { MaterialCommunityIcons } from "@expo/vector-icons";
import React, { useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";

import { useI18n } from "@/i18n";
import { sendAIMessage, type AIChatResponse } from "@/lib/aiService";
import { toCropOptionFromChat } from "@/lib/cropConverters";
import type { CropOption } from "@/lib/plan-types";
import type { ProfileData } from "@/components/screens/profile-types";
import {
  predictionColors,
  predictionRadius,
  predictionShadow,
  predictionSpacing,
} from "@/components/prediction/theme";

type ChatMessage = {
  id: string;
  role: "assistant" | "user";
  text: string;
  recommendations?: CropOption[];
};

type ChatBotProps = {
  profile?: ProfileData | null;
  seedOptions: CropOption[];
  onSelectCrop: (option: CropOption) => void;
};

let msgSeq = 0;
const nextId = () => `msg_${Date.now()}_${msgSeq++}`;

export function ChatBot({ profile, seedOptions, onSelectCrop }: ChatBotProps) {
  const { t, language } = useI18n();
  const lang: "en" | "si" = language === "si" ? "si" : "en";
  const region = profile?.region?.trim() || "Kandy";
  const landArea =
    profile?.role === "farmer" && profile.totalLandArea
      ? profile.totalLandArea
      : 1.0;

  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const listRef = useRef<FlatList<ChatMessage>>(null);

  useEffect(() => {
    if (seedOptions.length > 0 && messages.length === 0) {
      setMessages([
        {
          id: nextId(),
          role: "assistant",
          text: t("chatGreeting"),
          recommendations: seedOptions,
        },
      ]);
    }
  }, [seedOptions, messages.length, t]);

  const append = (m: Omit<ChatMessage, "id">) =>
    setMessages((prev) => [...prev, { id: nextId(), ...m }]);

  const onSend = async () => {
    const text = input.trim();
    if (!text || sending) return;
    append({ role: "user", text });
    setInput("");
    setSending(true);
    try {
      const res: AIChatResponse = await sendAIMessage({
        message: text,
        language: lang,
        location: region,
        cultivatedArea: landArea,
      });
      const options = (res.recommendations ?? []).map(toCropOptionFromChat);
      append({
        role: "assistant",
        text: res.message || "",
        recommendations: options.length ? options : undefined,
      });
    } catch (e) {
      append({
        role: "assistant",
        text: e instanceof Error ? e.message : t("chatError"),
      });
    } finally {
      setSending(false);
    }
  };
    const renderTile = (rec: CropOption) => (
    <TouchableOpacity
      style={styles.tile}
      onPress={() => onSelectCrop(rec)}
      activeOpacity={0.85}
      accessibilityLabel={`${rec.cropName}, score ${Math.round(rec.score)}`}>
      <MaterialCommunityIcons name="leaf" size={20} color={predictionColors.primary} />
      <Text style={styles.tileName}>{rec.cropName}</Text>
      <Text style={styles.tileScore}>{Math.round(rec.score)}/100</Text>
    </TouchableOpacity>
  );

  const renderMessage = ({ item }: { item: ChatMessage }) => (
    <View
      style={[
        styles.messageRow,
        item.role === "user" ? styles.userRow : styles.assistantRow,
      ]}>
      {item.role === "assistant" && (
        <View style={styles.avatar}>
          <MaterialCommunityIcons
            name="robot-outline"
            size={18}
            color={predictionColors.white}
          />
        </View>
      )}
      <View style={styles.bubble}>
        {item.text ? <Text style={styles.messageText}>{item.text}</Text> : null}
        {item.recommendations && item.recommendations.length > 0 ? (
          <View style={styles.suggestWrap}>
            <Text style={styles.suggestLabel}>{t("chatSelectCrop")}:</Text>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.tileScroll}>
              {item.recommendations.map((r) => (
                <React.Fragment key={r.cropId}>{renderTile(r)}</React.Fragment>
              ))}
            </ScrollView>
          </View>
        ) : null}
      </View>
    </View>
  );

  return (
    <View style={styles.container}>
      <FlatList
        ref={listRef}
        data={messages}
        keyExtractor={(m) => m.id}
        renderItem={renderMessage}
        contentContainerStyle={styles.list}
        showsVerticalScrollIndicator={false}
        onContentSizeChange={() => listRef.current?.scrollToEnd({ animated: true })}
        ListEmptyComponent={
          <View style={styles.empty}>
            <Text style={styles.emptyText}>{t("chatPlaceholder")}</Text>
          </View>
        }
      />
      <View style={styles.inputRow}>
        <TextInput
          style={styles.input}
          placeholder={t("chatPlaceholder")}
          placeholderTextColor={predictionColors.textMuted}
          value={input}
          onChangeText={setInput}
          onSubmitEditing={sending ? undefined : onSend}
          returnKeyType="send"
          editable={!sending}
        />
        <TouchableOpacity
          style={[styles.sendButton, { opacity: sending || !input.trim() ? 0.5 : 1 }]}
          onPress={onSend}
          disabled={sending || !input.trim()}
          activeOpacity={0.8}
          accessibilityLabel={t("chatSend")}>
          {sending ? (
            <ActivityIndicator size="small" color={predictionColors.white} />
          ) : (
            <MaterialCommunityIcons name="send" size={20} color={predictionColors.white} />
          )}
        </TouchableOpacity>
      </View>
    </View>
  );
  }

const styles = StyleSheet.create({
  container: {
    backgroundColor: predictionColors.card,
    borderRadius: predictionRadius.lg,
    overflow: "hidden",
    ...predictionShadow.soft,
  },
  list: { padding: predictionSpacing.md, paddingBottom: predictionSpacing.sm },
  empty: { alignItems: "center", padding: predictionSpacing.lg },
  emptyText: { color: predictionColors.textSecondary, fontSize: 13 },
  messageRow: {
    flexDirection: "row",
    gap: predictionSpacing.sm,
    marginBottom: predictionSpacing.md,
    alignItems: "flex-end",
  },
  assistantRow: { justifyContent: "flex-start" },
  userRow: { justifyContent: "flex-end" },
  avatar: {
    width: 30,
    height: 30,
    borderRadius: 15,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: predictionColors.primary,
  },
  bubble: {
    maxWidth: "82%",
    backgroundColor: predictionColors.background,
    borderRadius: predictionRadius.xl,
    padding: predictionSpacing.md,
  },
  messageText: { fontSize: 13, lineHeight: 19, color: predictionColors.text },
  suggestWrap: { marginTop: predictionSpacing.sm },
  suggestLabel: {
    fontSize: 12,
    fontWeight: "700",
    color: predictionColors.textSecondary,
    marginBottom: 4,
  },
  tileScroll: { gap: predictionSpacing.sm, paddingVertical: 2 },
  tile: {
    alignItems: "center",
    marginRight: predictionSpacing.sm,
    padding: predictionSpacing.md,
    backgroundColor: predictionColors.card,
    borderRadius: predictionRadius.md,
    minWidth: 84,
    ...predictionShadow.card,
  },
  tileName: {
    fontSize: 12,
    fontWeight: "800",
    color: predictionColors.text,
    marginTop: 4,
  },
  tileScore: { fontSize: 11, color: predictionColors.textMuted },
  inputRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: predictionSpacing.sm,
    padding: predictionSpacing.sm,
    borderTopWidth: 1,
    borderTopColor: predictionColors.border,
    backgroundColor: predictionColors.card,
  },
  input: {
    flex: 1,
    backgroundColor: predictionColors.background,
    borderRadius: predictionRadius.pill,
    paddingHorizontal: predictionSpacing.md,
    paddingVertical: 8,
    fontSize: 14,
    color: predictionColors.text,
  },
  sendButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: predictionColors.primary,
  },
});
