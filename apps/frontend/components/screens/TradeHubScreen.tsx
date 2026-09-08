import { MaterialCommunityIcons } from "@expo/vector-icons";
import React, { useCallback, useEffect, useMemo, useState } from "react";
import { ActivityIndicator, Alert, RefreshControl, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { ScreenHeader } from "@/components/ui/ScreenHeader";
import { useTheme } from "@/context/ThemeContext";
import { sendNotification } from "@/lib/notifications/NotificationService";
import { claimTradeListing, createTradeRecord, getTradeRecords, getUserTradeConversations, type TradeConversation, type TradeRecord } from "@/lib/trade-api";
import type { ProfileData } from "./profile-types";

type Tab = "market" | "discussions" | "completed";
type Props = { profile: ProfileData; onBack: () => void; onOpenDeal: (conversation: TradeConversation) => void };

export function TradeHubScreen({ profile, onBack, onOpenDeal }: Props) {
  const { colors } = useTheme().theme;
  const userId = profile.id ?? profile.email;
  const [tab, setTab] = useState<Tab>("market");
  const [listings, setListings] = useState<TradeRecord[]>([]);
  const [conversations, setConversations] = useState<TradeConversation[]>([]);
  const [loading, setLoading] = useState(true);
  const [publishing, setPublishing] = useState(false);
  const [claimingId, setClaimingId] = useState<string | null>(null);
  const [formOpen, setFormOpen] = useState(false);
  const [crop, setCrop] = useState("");
  const [quantity, setQuantity] = useState("");
  const [price, setPrice] = useState("");
  const [detail, setDetail] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [marketResult, dealsResult] = await Promise.allSettled([getTradeRecords("marketplace_listings"), getUserTradeConversations(userId)]);
      if (marketResult.status === "fulfilled") setListings(marketResult.value);
      if (dealsResult.status === "fulfilled") setConversations(dealsResult.value);
      if (marketResult.status === "rejected") throw marketResult.reason;
      if (dealsResult.status === "rejected" && String(dealsResult.reason).includes("404")) {
        Alert.alert("Spring restart required", "The marketplace loaded, but the new private-trade API is not running. Restart the Spring backend and pull down to refresh.");
      }
    } catch (error) {
      Alert.alert("Could not load Trade Hub", error instanceof Error ? error.message : "Please try again.");
    } finally { setLoading(false); }
  }, [userId]);

  useEffect(() => { void load(); }, [load]);

  const marketListings = useMemo(() => listings.filter((item) => {
    if (profile.role === "farmer") return item.ownerId === userId && item.status !== "closed";
    return item.status === "active" || (!item.status && item.ownerRole === "farmer");
  }).sort((a, b) => new Date(b.createdAt ?? 0).getTime() - new Date(a.createdAt ?? 0).getTime()), [listings, profile.role, userId]);

  const visibleDeals = conversations.filter((item) => tab === "completed" ? item.status === "agreed" : item.status !== "agreed" && item.status !== "cancelled");

  const publish = async () => {
    const parsedQuantity = Number(quantity), parsedPrice = Number(price);
    if (!crop.trim() || parsedQuantity <= 0 || parsedPrice <= 0) return Alert.alert("Missing details", "Enter the crop, available quantity and expected price.");
    setPublishing(true);
    try {
      await createTradeRecord("marketplace_listings", { ownerId: userId, ownerName: profile.fullName, ownerRole: "farmer", title: `${crop.trim()} available`, crop: crop.trim(), quantity: parsedQuantity, price: parsedPrice, detail: detail.trim(), location: profile.region, status: "active", createdAt: new Date().toISOString() });
      setCrop(""); setQuantity(""); setPrice(""); setDetail(""); setFormOpen(false);
      await load(); Alert.alert("Published", "Buyers can now see this harvest.");
    } catch (error) { Alert.alert("Publish failed", error instanceof Error ? error.message : "Please try again."); }
    finally { setPublishing(false); }
  };

  const claim = async (listing: TradeRecord) => {
    setClaimingId(listing.id);
    try {
      const conversation = await claimTradeListing(listing.id, userId, profile.fullName);
      void sendNotification({ userId: listing.ownerId, title: "Buyer interested in your harvest", body: `${profile.fullName} locked ${listing.quantity} kg of ${listing.crop} for a private discussion.`, emoji: "🤝", category: "market", priority: "high", deepLink: "smartcrop://trade-hub", data: { listingId: listing.id }, silent: true }).catch(() => undefined);
      onOpenDeal(conversation);
    }
    catch (error) { Alert.alert("Harvest unavailable", error instanceof Error ? error.message : "Another buyer may have selected it."); await load(); }
    finally { setClaimingId(null); }
  };

  return <SafeAreaView edges={["top"]} style={[styles.safe, { backgroundColor: colors.background }]}>
    <ScreenHeader title="Trade Hub" subtitle={profile.role === "farmer" ? "Publish harvests and negotiate securely" : "Find harvests and deal directly with farmers"} icon="handshake-outline" onBack={onBack} action={profile.role === "farmer" ? <TouchableOpacity style={[styles.addButton, { backgroundColor: colors.primary }]} onPress={() => setFormOpen((value) => !value)}><MaterialCommunityIcons name={formOpen ? "close" : "plus"} size={22} color={colors.primaryContrast} /></TouchableOpacity> : undefined} />
    <View style={styles.tabRow}>
      <TabButton label={profile.role === "farmer" ? "My harvests" : "Marketplace"} icon="storefront-outline" selected={tab === "market"} onPress={() => setTab("market")} colors={colors} />
      <TabButton label="Discussions" icon="chat-outline" selected={tab === "discussions"} onPress={() => setTab("discussions")} colors={colors} />
      <TabButton label="Agreed" icon="check-decagram-outline" selected={tab === "completed"} onPress={() => setTab("completed")} colors={colors} />
    </View>
    <ScrollView contentContainerStyle={styles.content} refreshControl={<RefreshControl refreshing={loading} onRefresh={load} tintColor={colors.primary} />}>
      {formOpen && profile.role === "farmer" ? <View style={[styles.form, { backgroundColor: colors.surface, borderColor: colors.border }]}>
        <Text style={[styles.formTitle, { color: colors.text }]}>What do you have to sell?</Text>
        <Text style={[styles.formHelp, { color: colors.textMuted }]}>The first buyer to select it will lock it while you discuss the deal.</Text>
        <Input value={crop} onChange={setCrop} placeholder="Crop name, e.g. Tomato" colors={colors} />
        <View style={styles.inputRow}><Input value={quantity} onChange={setQuantity} placeholder="Quantity (kg)" numeric colors={colors} /><Input value={price} onChange={setPrice} placeholder="Rs per kg" numeric colors={colors} /></View>
        <Input value={detail} onChange={setDetail} placeholder="Grade, harvest date and notes" colors={colors} multiline />
        <TouchableOpacity disabled={publishing} onPress={publish} style={[styles.primaryButton, { backgroundColor: colors.primary }]}>{publishing ? <ActivityIndicator color={colors.primaryContrast} /> : <Text style={[styles.primaryText, { color: colors.primaryContrast }]}>Publish harvest</Text>}</TouchableOpacity>
      </View> : null}
      {loading && !listings.length && !conversations.length ? <ActivityIndicator size="large" color={colors.primary} style={styles.loader} /> : null}
      {tab === "market" ? marketListings.length ? marketListings.map((listing) => <ListingCard key={listing.id} listing={listing} buyer={profile.role === "buyer"} claiming={claimingId === listing.id} onClaim={() => claim(listing)} colors={colors} />) : <Empty icon="basket-outline" title={profile.role === "farmer" ? "No active harvests" : "No harvests available"} body={profile.role === "farmer" ? "Tap + to publish goods for buyers." : "Pull down to check for new farmer listings."} colors={colors} /> : visibleDeals.length ? visibleDeals.map((deal) => <DealCard key={deal.id} deal={deal} userId={userId} onPress={() => onOpenDeal(deal)} colors={colors} />) : <Empty icon={tab === "completed" ? "check-circle-outline" : "chat-outline"} title={tab === "completed" ? "No agreed trades yet" : "No active discussions"} body="Your private farmer–buyer trades will appear here." colors={colors} />}
    </ScrollView>
  </SafeAreaView>;
}

function TabButton({ label, icon, selected, onPress, colors }: { label: string; icon: keyof typeof MaterialCommunityIcons.glyphMap; selected: boolean; onPress: () => void; colors: any }) { return <TouchableOpacity onPress={onPress} style={[styles.tab, { backgroundColor: selected ? colors.primary : colors.surface, borderColor: colors.border }]}><MaterialCommunityIcons name={icon} size={18} color={selected ? colors.primaryContrast : colors.textMuted} /><Text style={{ color: selected ? colors.primaryContrast : colors.text, fontSize: 12, lineHeight: 17, fontWeight: "800" }}>{label}</Text></TouchableOpacity>; }
function Input({ value, onChange, placeholder, colors, numeric, multiline }: { value: string; onChange: (value: string) => void; placeholder: string; colors: any; numeric?: boolean; multiline?: boolean }) { return <TextInput value={value} onChangeText={onChange} placeholder={placeholder} placeholderTextColor={colors.textMuted} keyboardType={numeric ? "decimal-pad" : "default"} multiline={multiline} style={[styles.input, multiline && styles.multiline, { color: colors.text, backgroundColor: colors.background, borderColor: colors.border }]} />; }
function ListingCard({ listing, buyer, claiming, onClaim, colors }: { listing: TradeRecord; buyer: boolean; claiming: boolean; onClaim: () => void; colors: any }) { const locked = listing.status === "locked"; return <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}><View style={styles.cardTop}><View style={[styles.cropIcon, { backgroundColor: colors.primarySoft }]}><MaterialCommunityIcons name="sprout" size={25} color={colors.primary} /></View><View style={styles.grow}><Text style={[styles.cardTitle, { color: colors.text }]}>{listing.crop || listing.title}</Text><Text style={[styles.meta, { color: colors.textMuted }]}>{listing.ownerName} · {listing.location || "Location unavailable"}</Text></View><View style={[styles.availableBadge, { backgroundColor: locked ? colors.infoSoft : colors.primarySoft }]}><Text style={{ color: locked ? colors.info : colors.primary, fontSize: 10, fontWeight: "900" }}>{locked ? "LOCKED" : "AVAILABLE"}</Text></View></View>{listing.detail ? <Text style={[styles.detail, { color: colors.textSecondary }]}>{listing.detail}</Text> : null}<View style={styles.values}><View><Text style={[styles.value, { color: colors.text }]}>{listing.quantity ?? 0} kg</Text><Text style={[styles.valueLabel, { color: colors.textMuted }]}>Available</Text></View><View><Text style={[styles.value, { color: colors.market }]}>Rs {listing.price ?? 0}/kg</Text><Text style={[styles.valueLabel, { color: colors.textMuted }]}>Expected price</Text></View></View>{buyer ? <TouchableOpacity disabled={claiming} onPress={onClaim} style={[styles.primaryButton, { backgroundColor: colors.primary }]}>{claiming ? <ActivityIndicator color={colors.primaryContrast} /> : <Text style={[styles.primaryText, { color: colors.primaryContrast }]}>I’m interested · Start private discussion</Text>}</TouchableOpacity> : <Text style={[styles.waiting, { color: colors.textMuted }]}>{locked ? `Private discussion started with ${listing.buyerName || "a buyer"}. Open Discussions.` : "Waiting for a buyer to select this harvest"}</Text>}</View>; }
function DealCard({ deal, userId, onPress, colors }: { deal: TradeConversation; userId: string; onPress: () => void; colors: any }) { const otherName = deal.farmerId === userId ? deal.buyerName : deal.farmerName; const agreed = deal.status === "agreed"; return <TouchableOpacity onPress={onPress} style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}><View style={styles.cardTop}><View style={[styles.cropIcon, { backgroundColor: agreed ? colors.primarySoft : colors.infoSoft }]}><MaterialCommunityIcons name={agreed ? "check-bold" : "chat-processing-outline"} size={23} color={agreed ? colors.primary : colors.info} /></View><View style={styles.grow}><Text style={[styles.cardTitle, { color: colors.text }]}>{deal.crop || deal.listingTitle}</Text><Text style={[styles.meta, { color: colors.textMuted }]}>With {otherName}</Text></View><MaterialCommunityIcons name="chevron-right" size={24} color={colors.textMuted} /></View><Text numberOfLines={1} style={[styles.detail, { color: colors.textSecondary }]}>{agreed ? `${deal.finalQuantity} kg · Rs ${deal.finalPrice}/kg · ${deal.deliveryDate}` : deal.lastMessage || "Open the private discussion"}</Text><Text style={{ color: agreed ? colors.primary : colors.info, fontSize: 11, fontWeight: "900", marginTop: 10 }}>{agreed ? "AGREED TRADE" : deal.status === "awaiting_confirmation" ? "WAITING FOR CONFIRMATION" : "PRIVATE DISCUSSION"}</Text></TouchableOpacity>; }
function Empty({ icon, title, body, colors }: { icon: keyof typeof MaterialCommunityIcons.glyphMap; title: string; body: string; colors: any }) { return <View style={styles.empty}><MaterialCommunityIcons name={icon} size={46} color={colors.textMuted} /><Text style={[styles.emptyTitle, { color: colors.text }]}>{title}</Text><Text style={[styles.emptyBody, { color: colors.textMuted }]}>{body}</Text></View>; }

const styles = StyleSheet.create({ safe: { flex: 1 }, addButton: { width: 42, height: 42, borderRadius: 14, alignItems: "center", justifyContent: "center" }, tabRow: { flexDirection: "row", paddingHorizontal: 16, paddingBottom: 4, gap: 7 }, tab: { flex: 1, minHeight: 42, borderRadius: 14, borderWidth: 1, alignItems: "center", justifyContent: "center", flexDirection: "row", gap: 5 }, content: { padding: 16, paddingBottom: 60, gap: 12 }, loader: { marginTop: 50 }, form: { borderWidth: 1, borderRadius: 22, padding: 16, gap: 10 }, formTitle: { fontSize: 18, fontWeight: "900" }, formHelp: { fontSize: 12, lineHeight: 18 }, inputRow: { flexDirection: "row", gap: 9 }, input: { flex: 1, minHeight: 49, borderWidth: 1, borderRadius: 13, paddingHorizontal: 13, fontSize: 14 }, multiline: { minHeight: 76, paddingTop: 13, textAlignVertical: "top" }, primaryButton: { minHeight: 50, borderRadius: 14, alignItems: "center", justifyContent: "center", paddingHorizontal: 14, marginTop: 4 }, primaryText: { fontSize: 13, fontWeight: "900", textAlign: "center" }, card: { borderWidth: 1, borderRadius: 20, padding: 15 }, cardTop: { flexDirection: "row", alignItems: "center", gap: 11 }, cropIcon: { width: 48, height: 48, borderRadius: 15, alignItems: "center", justifyContent: "center" }, grow: { flex: 1 }, cardTitle: { fontSize: 17, fontWeight: "900" }, meta: { fontSize: 11, marginTop: 3 }, availableBadge: { borderRadius: 999, paddingHorizontal: 8, paddingVertical: 6 }, detail: { fontSize: 13, lineHeight: 19, marginTop: 12 }, values: { flexDirection: "row", justifyContent: "space-between", marginVertical: 15, paddingHorizontal: 4 }, value: { fontSize: 18, fontWeight: "900" }, valueLabel: { fontSize: 10, marginTop: 2 }, waiting: { fontSize: 12, textAlign: "center", marginTop: 12 }, empty: { alignItems: "center", paddingVertical: 70, paddingHorizontal: 35 }, emptyTitle: { fontSize: 18, fontWeight: "900", marginTop: 14 }, emptyBody: { fontSize: 13, textAlign: "center", lineHeight: 20, marginTop: 6 } });
