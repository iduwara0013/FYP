import { useFormI18n } from "@/i18n/useFormI18n";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import React, { useCallback, useEffect, useRef, useState } from "react";
import { ActivityIndicator, Alert, KeyboardAvoidingView, Linking, Platform, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { ScreenHeader } from "@/components/ui/ScreenHeader";
import { useTheme } from "@/context/ThemeContext";
import { sendNotification } from "@/lib/notifications/NotificationService";
import { cancelTradeDiscussion, finalizeTrade, getTradeConversation, getTradeMessages, sendTradeMessage, type TradeContact, type TradeConversation, type TradeMessage } from "@/lib/trade-api";
import type { ProfileData } from "./profile-types";

type Props = { profile: ProfileData; initialConversation: TradeConversation; onBack: () => void };

export function TradeDealScreen({ profile, initialConversation, onBack }: Props) {
  const { tx, errorText, language } = useFormI18n();

  const { colors } = useTheme().theme;
  const userId = profile.id ?? profile.email;
  const [conversation, setConversation] = useState(initialConversation);
  const [messages, setMessages] = useState<TradeMessage[]>([]);
  const [message, setMessage] = useState("");
  const [sending, setSending] = useState(false);
  const [showTerms, setShowTerms] = useState(initialConversation.status === "awaiting_confirmation");
  const [quantity, setQuantity] = useState(String(initialConversation.finalQuantity ?? initialConversation.listedQuantity ?? ""));
  const [price, setPrice] = useState(String(initialConversation.finalPrice ?? initialConversation.listedPrice ?? ""));
  const [deliveryMethod, setDeliveryMethod] = useState(initialConversation.deliveryMethod ?? "Buyer pickup");
  const [deliveryDate, setDeliveryDate] = useState(initialConversation.deliveryDate ?? "");
  const [savingTerms, setSavingTerms] = useState(false);
  const scrollRef = useRef<ScrollView>(null);
  const otherName = conversation.farmerId === userId ? conversation.buyerName : conversation.farmerName;
  const closed = conversation.status === "agreed" || conversation.status === "cancelled";

  const load = useCallback(async () => {
    try {
      const [nextConversation, nextMessages] = await Promise.all([
        getTradeConversation(conversation.listingId, userId),
        getTradeMessages(conversation.listingId, userId),
      ]);
      setConversation(nextConversation);
      setMessages(uniqueMessages(nextMessages));
      if (nextConversation.status === "awaiting_confirmation") {
        setQuantity(String(nextConversation.finalQuantity ?? ""));
        setPrice(String(nextConversation.finalPrice ?? ""));
        setDeliveryMethod(nextConversation.deliveryMethod ?? "Buyer pickup");
        setDeliveryDate(nextConversation.deliveryDate ?? "");
      }
    } catch { /* retain the last successful view during temporary network loss */ }
  }, [conversation.listingId, userId]);

  useEffect(() => {
    void load();
    if (closed) return;
    const timer = setInterval(() => void load(), 3000);
    return () => clearInterval(timer);
  }, [closed, load]);

  const send = async () => {
    if (!message.trim() || sending) return;
    const text = message.trim(); setMessage(""); setSending(true);
    try {
      const saved = await sendTradeMessage(conversation.listingId, { senderId: userId, senderName: profile.fullName, text });
      setMessages((items) => uniqueMessages([...items, saved]));
      setTimeout(() => scrollRef.current?.scrollToEnd({ animated: true }), 50);
    } catch (error) { setMessage(text); Alert.alert(tx("Message not sent"), errorText(error, "Please try again.")); }
    finally { setSending(false); }
  };

  const saveTerms = async () => {
    if (Number(quantity) <= 0 || Number(price) <= 0 || !deliveryMethod.trim() || !deliveryDate.trim()) {
      return Alert.alert(tx("Incomplete deal"), tx("Enter quantity, price, delivery method and delivery date."));
    }
    setSavingTerms(true);
    try {
      const updated = await finalizeTrade(conversation.listingId, { userId, finalQuantity: Number(quantity), finalPrice: Number(price), deliveryMethod: deliveryMethod.trim(), deliveryDate: deliveryDate.trim() });
      setConversation(updated);
      setShowTerms(updated.status !== "agreed");
      Alert.alert(updated.status === "agreed" ? tx("Trade agreed") : tx("Terms proposed"), updated.status === "agreed" ? tx("The listing is now closed and saved under Agreed trades.") : tx("{name} must confirm these exact terms before the listing closes.", { name: otherName }));
    } catch (error) { Alert.alert(tx("Could not save terms"), errorText(error, "Please try again.")); }
    finally { setSavingTerms(false); }
  };

  const cancel = () => Alert.alert(profile.role === "buyer" ? tx("Not interested in these goods?") : tx("End this discussion?"), tx("The harvest will be unlocked and shown to all buyers in the marketplace again."), [
    { text: tx("Continue discussion"), style: "cancel" },
    { text: tx("Release goods"), style: "destructive", onPress: async () => { try {
      await cancelTradeDiscussion(conversation.listingId, userId);
      const recipientId = profile.role === "buyer" ? conversation.farmerId : conversation.buyerId;
      void sendNotification({ userId: recipientId, title: "Trade discussion ended", body: `${profile.fullName} ended the discussion for ${conversation.crop}. The harvest is available again.`, emoji: "🔓", category: "market", priority: "normal", deepLink: "smartcrop://trade-hub", data: { listingId: conversation.listingId }, silent: true }).catch(() => undefined);
      onBack();
    } catch (error) { Alert.alert(tx("Could not unlock"), errorText(error, "Please try again.")); } } },
  ]);

  return <SafeAreaView edges={["top"]} style={[styles.safe, { backgroundColor: colors.background }]}>
    <KeyboardAvoidingView style={styles.safe} behavior={Platform.OS === "ios" ? "padding" : undefined}>
      <ScreenHeader title={otherName || tx("Private trade")} subtitle={`${tx(conversation.crop ?? "")} · ${tx("Private discussion")}`} icon="chat-processing-outline" onBack={onBack} />
      <View style={[styles.lockBanner, { backgroundColor: conversation.status === "agreed" ? colors.primarySoft : colors.infoSoft }]}>
        <MaterialCommunityIcons name={conversation.status === "agreed" ? "check-decagram" : "lock-outline"} size={18} color={conversation.status === "agreed" ? colors.primary : colors.info} />
        <Text style={{ flex: 1, color: conversation.status === "agreed" ? colors.primary : colors.info, fontSize: 12, fontWeight: "800" }}>{conversation.status === "agreed" ? tx("Trade agreed · removed from the open marketplace") : tx("Locked · only this farmer and buyer can access the discussion")}</Text>
      </View>
      <ScrollView ref={scrollRef} style={styles.chat} contentContainerStyle={styles.chatContent} onContentSizeChange={() => scrollRef.current?.scrollToEnd({ animated: false })}>
        <View style={[styles.goodsCard, { backgroundColor: colors.surface, borderColor: colors.border }]}><View style={[styles.goodsIcon, { backgroundColor: colors.primarySoft }]}><MaterialCommunityIcons name="sprout" size={25} color={colors.primary} /></View><View style={{ flex: 1 }}><Text style={[styles.goodsTitle, { color: colors.text }]}>{conversation.crop ? tx(conversation.crop) : conversation.listingTitle}</Text><Text style={[styles.goodsMeta, { color: colors.textMuted }]}>{conversation.listedQuantity} {tx("kg")} · {tx("Rs")} {conversation.listedPrice}{tx("/kg")} · {tx(conversation.location ?? "")}</Text></View></View>
        {messages.length ? messages.map((item) => { const mine = item.senderId === userId; return <View key={item.id} style={[styles.messageRow, mine && styles.mineRow]}><View style={[styles.bubble, { backgroundColor: mine ? colors.primary : colors.surface, borderColor: colors.border }]}><Text style={{ color: mine ? colors.primaryContrast : colors.text, fontSize: 14, lineHeight: 20 }}>{item.text}</Text><Text style={{ color: mine ? colors.primaryContrast : colors.textMuted, opacity: .72, fontSize: 9, marginTop: 4, textAlign: "right" }}>{new Date(item.sentAt).toLocaleTimeString(language === "si" ? "si-LK" : "en-US", { hour: "2-digit", minute: "2-digit" })}</Text></View></View>; }) : <View style={styles.start}><MaterialCommunityIcons name="shield-lock-outline" size={32} color={colors.textMuted} /><Text style={{ color: colors.textMuted, textAlign: "center", lineHeight: 19 }}>{tx("Start discussing quality, available quantity, price and delivery. This conversation is private.")}</Text></View>}
        {conversation.status === "awaiting_confirmation" ? <View style={[styles.proposal, { backgroundColor: colors.warningSoft, borderColor: colors.warning }]}><Text style={[styles.proposalTitle, { color: colors.text }]}>{tx("Final terms proposed")}</Text><Text style={{ color: colors.textSecondary, lineHeight: 20 }}>{conversation.finalQuantity} {tx("kg")} × {tx("Rs")} {conversation.finalPrice}{tx("/kg")}{"\n"}{tx(conversation.deliveryMethod ?? "")} · {conversation.deliveryDate}{"\n"}{tx("Total:")} {tx("Rs")} {conversation.totalAmount?.toLocaleString()}</Text><Text style={{ color: colors.warning, fontWeight: "800", fontSize: 11, marginTop: 7 }}>{conversation.proposedBy === userId ? tx("Waiting for {name} to confirm", { name: otherName }) : tx("Review and confirm the exact terms below")}</Text></View> : null}
        {conversation.status === "agreed" ? <><View style={[styles.agreed, { backgroundColor: colors.primarySoft }]}><MaterialCommunityIcons name="check-decagram" size={42} color={colors.primary} /><Text style={[styles.agreedTitle, { color: colors.primary }]}>{tx("Deal finalized")}</Text><Text style={[styles.agreedText, { color: colors.text }]}>{conversation.finalQuantity} {tx("kg")} {tx("at Rs")} {conversation.finalPrice}{tx("/kg")}{"\n"}{tx("Total")} {tx("Rs")} {conversation.totalAmount?.toLocaleString()}{"\n"}{tx(conversation.deliveryMethod ?? "")} · {conversation.deliveryDate}</Text></View><Text style={[styles.contactHeading, { color: colors.text }]}>{tx("Contact details")}</Text><ContactCard role={tx("Farmer")} contact={conversation.farmerContact} fallbackName={conversation.farmerName} colors={colors} /><ContactCard role={tx("Buyer")} contact={conversation.buyerContact} fallbackName={conversation.buyerName} colors={colors} /></> : null}
        {showTerms && !closed ? <View style={[styles.terms, { backgroundColor: colors.surface, borderColor: colors.border }]}><Text style={[styles.termsTitle, { color: colors.text }]}>{tx("Final deal details")}</Text><View style={styles.row}><Field value={quantity} setValue={setQuantity} placeholder={tx("Quantity kg")} numeric colors={colors} /><Field value={price} setValue={setPrice} placeholder={tx("Rs per kg")} numeric colors={colors} /></View><Field value={tx(deliveryMethod)} setValue={setDeliveryMethod} placeholder={tx("Buyer pickup or farmer delivery")} colors={colors} /><Field value={deliveryDate} setValue={setDeliveryDate} placeholder={tx("Delivery date (YYYY-MM-DD)")} colors={colors} /><Text style={[styles.total, { color: colors.text }]}>{tx("Total:")} {tx("Rs")} {((Number(quantity) || 0) * (Number(price) || 0)).toLocaleString()}</Text><TouchableOpacity disabled={savingTerms} onPress={saveTerms} style={[styles.confirm, { backgroundColor: colors.primary }]}>{savingTerms ? <ActivityIndicator color={colors.primaryContrast} /> : <Text style={{ color: colors.primaryContrast, fontWeight: "900" }}>{conversation.status === "awaiting_confirmation" && conversation.proposedBy !== userId ? tx("Confirm these terms") : tx("Propose final terms")}</Text>}</TouchableOpacity></View> : null}
      </ScrollView>
      {!closed ? <><TouchableOpacity onPress={cancel} style={[styles.releaseBar, { backgroundColor: colors.dangerSoft ?? "#FEE2E2" }]}><MaterialCommunityIcons name="lock-open-outline" size={18} color={colors.danger} /><Text style={{ color: colors.danger, fontSize: 12, fontWeight: "900" }}>{profile.role === "buyer" ? tx("Not interested · Release goods") : tx("End discussion · Make goods available again")}</Text></TouchableOpacity><View style={[styles.footer, { backgroundColor: colors.surface, borderColor: colors.border }]}>{!showTerms ? <TouchableOpacity onPress={() => setShowTerms(true)} style={[styles.termsButton, { backgroundColor: colors.primarySoft }]}><MaterialCommunityIcons name="file-sign" size={20} color={colors.primary} /><Text style={{ color: colors.primary, fontWeight: "900", fontSize: 11 }}>{tx("Finalize")}</Text></TouchableOpacity> : null}<TextInput value={message} onChangeText={setMessage} placeholder={tx("Message...")} placeholderTextColor={colors.textMuted} style={[styles.messageInput, { color: colors.text, backgroundColor: colors.background, borderColor: colors.border }]} /><TouchableOpacity onPress={send} disabled={sending || !message.trim()} style={[styles.send, { backgroundColor: colors.primary }]}><MaterialCommunityIcons name="send" size={20} color={colors.primaryContrast} /></TouchableOpacity></View></> : null}
    </KeyboardAvoidingView>
  </SafeAreaView>;
}

function Field({ value, setValue, placeholder, numeric, colors }: { value: string; setValue: (value: string) => void; placeholder: string; numeric?: boolean; colors: any }) { return <TextInput value={value} onChangeText={setValue} placeholder={placeholder} placeholderTextColor={colors.textMuted} keyboardType={numeric ? "decimal-pad" : "default"} style={[styles.field, { color: colors.text, backgroundColor: colors.background, borderColor: colors.border }]} />; }
function uniqueMessages(messages: TradeMessage[]): TradeMessage[] { const byId = new Map<string, TradeMessage>(); messages.forEach((item) => byId.set(item.id, item)); return [...byId.values()].sort((a, b) => a.sentAt.localeCompare(b.sentAt)); }
function ContactCard({ role, contact, fallbackName, colors }: { role: string; contact?: TradeContact; fallbackName: string; colors: any }) { return <View style={[styles.contactCard, { backgroundColor: colors.surface, borderColor: colors.border }]}><View style={[styles.contactAvatar, { backgroundColor: colors.infoSoft }]}><MaterialCommunityIcons name="account-outline" size={24} color={colors.info} /></View><View style={{ flex: 1 }}><Text style={[styles.contactRole, { color: colors.textMuted }]}>{role}</Text><Text style={[styles.contactName, { color: colors.text }]}>{contact?.name || fallbackName}</Text>{contact?.phoneNumber ? <TouchableOpacity onPress={() => void Linking.openURL(`tel:${contact.phoneNumber}`)}><Text style={[styles.contactLine, { color: colors.primary }]}>☎ {contact.phoneNumber}</Text></TouchableOpacity> : null}{contact?.email ? <TouchableOpacity onPress={() => void Linking.openURL(`mailto:${contact.email}`)}><Text style={[styles.contactLine, { color: colors.primary }]}>✉ {contact.email}</Text></TouchableOpacity> : null}{contact?.address ? <Text style={[styles.contactLine, { color: colors.textSecondary }]}>⌖ {contact.address}{contact.region ? `, ${contact.region}` : ""}</Text> : null}</View></View>; }

const styles = StyleSheet.create({ safe: { flex: 1 }, lockBanner: { flexDirection: "row", alignItems: "center", gap: 8, marginHorizontal: 15, padding: 11, borderRadius: 13 }, chat: { flex: 1 }, chatContent: { padding: 15, paddingBottom: 24 }, goodsCard: { flexDirection: "row", alignItems: "center", gap: 11, padding: 13, borderWidth: 1, borderRadius: 17, marginBottom: 18 }, goodsIcon: { width: 47, height: 47, borderRadius: 14, alignItems: "center", justifyContent: "center" }, goodsTitle: { fontSize: 16, fontWeight: "900" }, goodsMeta: { fontSize: 11, marginTop: 4 }, messageRow: { alignItems: "flex-start", marginBottom: 8 }, mineRow: { alignItems: "flex-end" }, bubble: { maxWidth: "82%", borderWidth: 1, borderRadius: 17, paddingHorizontal: 13, paddingVertical: 9 }, start: { alignItems: "center", alignSelf: "center", maxWidth: 270, gap: 9, marginVertical: 25 }, proposal: { borderWidth: 1, borderRadius: 17, padding: 14, marginTop: 14 }, proposalTitle: { fontSize: 15, fontWeight: "900", marginBottom: 7 }, agreed: { alignItems: "center", borderRadius: 20, padding: 20, marginTop: 18 }, agreedTitle: { fontSize: 19, fontWeight: "900", marginTop: 7 }, agreedText: { textAlign: "center", lineHeight: 22, marginTop: 8 }, contactHeading: { fontSize: 17, fontWeight: "900", marginTop: 20, marginBottom: 9 }, contactCard: { flexDirection: "row", gap: 11, borderWidth: 1, borderRadius: 17, padding: 13, marginBottom: 9 }, contactAvatar: { width: 44, height: 44, borderRadius: 14, alignItems: "center", justifyContent: "center" }, contactRole: { fontSize: 9, fontWeight: "900" }, contactName: { fontSize: 15, fontWeight: "900", marginTop: 2, marginBottom: 4 }, contactLine: { fontSize: 12, lineHeight: 19 }, terms: { borderWidth: 1, borderRadius: 20, padding: 15, gap: 9, marginTop: 16 }, termsTitle: { fontSize: 17, fontWeight: "900" }, row: { flexDirection: "row", gap: 8 }, field: { flex: 1, minHeight: 47, borderWidth: 1, borderRadius: 12, paddingHorizontal: 12 }, total: { fontSize: 17, fontWeight: "900", textAlign: "right" }, confirm: { minHeight: 49, borderRadius: 13, alignItems: "center", justifyContent: "center" }, releaseBar: { minHeight: 38, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 7, marginHorizontal: 9, borderRadius: 11 }, footer: { flexDirection: "row", alignItems: "center", gap: 7, borderTopWidth: 1, padding: 9 }, termsButton: { height: 48, paddingHorizontal: 10, borderRadius: 13, alignItems: "center", justifyContent: "center" }, messageInput: { flex: 1, height: 48, borderWidth: 1, borderRadius: 24, paddingHorizontal: 16 }, send: { width: 46, height: 46, borderRadius: 23, alignItems: "center", justifyContent: "center" } });
