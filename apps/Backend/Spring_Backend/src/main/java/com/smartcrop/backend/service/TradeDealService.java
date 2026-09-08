package com.smartcrop.backend.service;

import java.time.Instant;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

import org.springframework.stereotype.Service;

import com.google.cloud.firestore.DocumentReference;
import com.google.cloud.firestore.DocumentSnapshot;
import com.google.cloud.firestore.FieldValue;
import com.google.cloud.firestore.Firestore;
import com.google.cloud.firestore.QueryDocumentSnapshot;
import com.google.cloud.firestore.SetOptions;

@Service
public class TradeDealService {

    private final Firestore firestore;

    public TradeDealService(Firestore firestore) {
        this.firestore = firestore;
    }

    public Map<String, Object> claimListing(String listingId, Map<String, Object> payload) throws Exception {
        String buyerId = required(payload, "buyerId");
        String buyerName = required(payload, "buyerName");
        DocumentReference listingRef = firestore.collection("marketplace_listings").document(listingId);
        DocumentReference conversationRef = firestore.collection("trade_conversations").document(listingId);

        return firestore.runTransaction(transaction -> {
            DocumentSnapshot listing = transaction.get(listingRef).get();
            if (!listing.exists()) {
                throw new IllegalArgumentException("Listing was not found.");
            }

            String farmerId = value(listing.get("ownerId"));
            if (buyerId.equals(farmerId)) {
                throw new IllegalStateException("A farmer cannot claim their own listing.");
            }

            String status = value(listing.get("status"));
            String lockedBuyer = value(listing.get("buyerId"));
            if (("locked".equals(status) || "negotiating".equals(status)) && !buyerId.equals(lockedBuyer)) {
                throw new IllegalStateException("This harvest is already being discussed with another buyer.");
            }
            if ("closed".equals(status) || "agreed".equals(status)) {
                throw new IllegalStateException("This harvest is no longer available.");
            }

            Map<String, Object> lock = new HashMap<>();
            lock.put("status", "locked");
            lock.put("buyerId", buyerId);
            lock.put("buyerName", buyerName);
            lock.put("lockedAt", Instant.now().toString());
            lock.put("updated_at", FieldValue.serverTimestamp());
            transaction.set(listingRef, lock, SetOptions.merge());

            Map<String, Object> conversation = new HashMap<>();
            conversation.put("listingId", listingId);
            conversation.put("farmerId", farmerId);
            conversation.put("farmerName", value(listing.get("ownerName")));
            conversation.put("buyerId", buyerId);
            conversation.put("buyerName", buyerName);
            conversation.put("crop", value(listing.get("crop")));
            conversation.put("listingTitle", value(listing.get("title")));
            conversation.put("listedQuantity", listing.get("quantity"));
            conversation.put("listedPrice", listing.get("price"));
            conversation.put("location", listing.get("location"));
            conversation.put("status", "negotiating");
            conversation.put("updatedAt", Instant.now().toString());
            transaction.set(conversationRef, conversation, SetOptions.merge());

            Map<String, Object> result = new HashMap<>(conversation);
            result.put("id", listingId);
            return result;
        }).get();
    }

    public Map<String, Object> getConversation(String listingId, String userId) throws Exception {
        DocumentSnapshot snapshot = firestore.collection("trade_conversations").document(listingId).get().get();
        if (!snapshot.exists()) {
            throw new IllegalArgumentException("Trade discussion was not found.");
        }
        ensureParticipant(snapshot.getData(), userId);
        Map<String, Object> result = new HashMap<>(snapshot.getData());
        result.put("id", snapshot.getId());
        return result;
    }

    public List<Map<String, Object>> getUserConversations(String userId) throws Exception {
        List<Map<String, Object>> result = new ArrayList<>();
        for (QueryDocumentSnapshot document : firestore.collection("trade_conversations").get().get().getDocuments()) {
            Map<String, Object> data = document.getData();
            if (userId.equals(value(data.get("farmerId"))) || userId.equals(value(data.get("buyerId")))) {
                Map<String, Object> item = new HashMap<>(data);
                item.put("id", document.getId());
                result.add(item);
            }
        }
        result.sort(Comparator.comparing(item -> value(item.get("updatedAt")), Comparator.reverseOrder()));
        return result;
    }

    public Map<String, Object> sendMessage(String listingId, Map<String, Object> payload) throws Exception {
        String senderId = required(payload, "senderId");
        String text = required(payload, "text");
        Map<String, Object> conversation = getConversation(listingId, senderId);
        if ("agreed".equals(value(conversation.get("status"))) || "cancelled".equals(value(conversation.get("status")))) {
            throw new IllegalStateException("This trade discussion is closed.");
        }

        String sentAt = Instant.now().toString();
        Map<String, Object> message = new HashMap<>();
        message.put("conversationId", listingId);
        message.put("senderId", senderId);
        message.put("senderName", required(payload, "senderName"));
        message.put("text", text);
        message.put("sentAt", sentAt);
        String id = firestore.collection("trade_messages").add(message).get().getId();
        firestore.collection("trade_conversations").document(listingId)
            .set(Map.of("lastMessage", text, "updatedAt", sentAt), SetOptions.merge()).get();
        String recipientId = senderId.equals(value(conversation.get("farmerId")))
            ? value(conversation.get("buyerId"))
            : value(conversation.get("farmerId"));
        Map<String, Object> notification = new HashMap<>();
        notification.put("user_id", recipientId);
        notification.put("title", "New trade message");
        notification.put("body", message.get("senderName") + ": " + text);
        notification.put("emoji", "💬");
        notification.put("category", "market");
        notification.put("priority", "high");
        notification.put("read_status", "unread");
        notification.put("deep_link", "smartcrop://trade-hub");
        notification.put("data", "{\"listingId\":\"" + listingId + "\"}");
        notification.put("created_at_text", sentAt);
        notification.put("created_at", FieldValue.serverTimestamp());
        firestore.collection("app_notifications").add(notification).get();
        message.put("id", id);
        return message;
    }

    public List<Map<String, Object>> getMessages(String listingId, String userId) throws Exception {
        getConversation(listingId, userId);
        List<Map<String, Object>> result = firestore.collection("trade_messages")
            .whereEqualTo("conversationId", listingId).get().get().getDocuments().stream().map(document -> {
                Map<String, Object> item = new HashMap<>(document.getData());
                item.put("id", document.getId());
                return item;
            }).sorted(Comparator.comparing(item -> value(item.get("sentAt")))).toList();
        return result;
    }

    public Map<String, Object> finalizeDeal(String listingId, Map<String, Object> payload) throws Exception {
        String userId = required(payload, "userId");
        double finalQuantity = positiveNumber(payload, "finalQuantity");
        double finalPrice = positiveNumber(payload, "finalPrice");
        String deliveryMethod = required(payload, "deliveryMethod");
        String deliveryDate = required(payload, "deliveryDate");
        DocumentReference conversationRef = firestore.collection("trade_conversations").document(listingId);
        DocumentReference listingRef = firestore.collection("marketplace_listings").document(listingId);
        DocumentReference orderRef = firestore.collection("trade_orders").document(listingId);

        return firestore.runTransaction(transaction -> {
            DocumentSnapshot conversation = transaction.get(conversationRef).get();
            if (!conversation.exists()) {
                throw new IllegalArgumentException("Trade discussion was not found.");
            }
            ensureParticipant(conversation.getData(), userId);
            DocumentSnapshot farmer = transaction.get(
                firestore.collection("farmers").document(value(conversation.get("farmerId")))
            ).get();
            DocumentSnapshot buyer = transaction.get(
                firestore.collection("buyers").document(value(conversation.get("buyerId")))
            ).get();
            String status = value(conversation.get("status"));
            if ("agreed".equals(status)) {
                Map<String, Object> existing = new HashMap<>(conversation.getData());
                existing.put("id", listingId);
                return existing;
            }
            if ("cancelled".equals(status)) {
                throw new IllegalStateException("A cancelled discussion cannot be finalized.");
            }

            String now = Instant.now().toString();
            String proposedBy = value(conversation.get("proposedBy"));
            boolean sameTerms = numbersEqual(conversation.get("finalQuantity"), finalQuantity)
                && numbersEqual(conversation.get("finalPrice"), finalPrice)
                && deliveryMethod.equals(value(conversation.get("deliveryMethod")))
                && deliveryDate.equals(value(conversation.get("deliveryDate")));

            Map<String, Object> finalTerms = new HashMap<>();
            finalTerms.put("finalQuantity", finalQuantity);
            finalTerms.put("finalPrice", finalPrice);
            finalTerms.put("totalAmount", finalQuantity * finalPrice);
            finalTerms.put("deliveryMethod", deliveryMethod);
            finalTerms.put("deliveryDate", deliveryDate);
            finalTerms.put("updatedAt", now);

            if (proposedBy.isBlank() || proposedBy.equals(userId) || !sameTerms) {
                finalTerms.put("status", "awaiting_confirmation");
                finalTerms.put("proposedBy", userId);
                transaction.set(conversationRef, finalTerms, SetOptions.merge());
                Map<String, Object> proposed = new HashMap<>(conversation.getData());
                proposed.putAll(finalTerms);
                proposed.put("id", listingId);
                return proposed;
            }

            finalTerms.put("status", "agreed");
            finalTerms.put("agreedAt", now);
            finalTerms.put("finalizedBy", userId);
            finalTerms.put("farmerContact", contactDetails(farmer));
            finalTerms.put("buyerContact", contactDetails(buyer));
            transaction.set(conversationRef, finalTerms, SetOptions.merge());
            transaction.set(listingRef, Map.of("status", "closed", "closedAt", now), SetOptions.merge());

            Map<String, Object> order = new HashMap<>(conversation.getData());
            order.putAll(finalTerms);
            order.put("listingId", listingId);
            order.put("status", "agreed");
            order.put("createdAt", now);
            transaction.set(orderRef, order);

            Map<String, Object> result = new HashMap<>(order);
            result.put("id", listingId);
            return result;
        }).get();
    }

    public Map<String, Object> cancelDiscussion(String listingId, Map<String, Object> payload) throws Exception {
        String userId = required(payload, "userId");
        DocumentReference conversationRef = firestore.collection("trade_conversations").document(listingId);
        DocumentReference listingRef = firestore.collection("marketplace_listings").document(listingId);
        return firestore.runTransaction(transaction -> {
            DocumentSnapshot conversation = transaction.get(conversationRef).get();
            if (!conversation.exists()) throw new IllegalArgumentException("Trade discussion was not found.");
            ensureParticipant(conversation.getData(), userId);
            if ("agreed".equals(value(conversation.get("status")))) {
                throw new IllegalStateException("An agreed trade cannot be reopened.");
            }
            String now = Instant.now().toString();
            transaction.set(conversationRef, Map.of("status", "cancelled", "updatedAt", now), SetOptions.merge());
            transaction.update(listingRef, "status", "active", "buyerId", FieldValue.delete(), "buyerName", FieldValue.delete(), "lockedAt", FieldValue.delete());
            return Map.<String, Object>of("id", listingId, "status", "cancelled");
        }).get();
    }

    private static void ensureParticipant(Map<String, Object> conversation, String userId) {
        if (!userId.equals(value(conversation.get("farmerId"))) && !userId.equals(value(conversation.get("buyerId")))) {
            throw new SecurityException("Only the farmer and selected buyer can access this discussion.");
        }
    }

    private static String required(Map<String, Object> payload, String key) {
        String result = value(payload.get(key));
        if (result.isBlank()) throw new IllegalArgumentException(key + " is required.");
        return result;
    }

    private static double positiveNumber(Map<String, Object> payload, String key) {
        try {
            double result = Double.parseDouble(value(payload.get(key)));
            if (result <= 0) throw new NumberFormatException();
            return result;
        } catch (NumberFormatException error) {
            throw new IllegalArgumentException(key + " must be greater than zero.");
        }
    }

    private static boolean numbersEqual(Object value, double expected) {
        try {
            return Math.abs(Double.parseDouble(String.valueOf(value)) - expected) < 0.001;
        } catch (NumberFormatException error) {
            return false;
        }
    }

    private static Map<String, Object> contactDetails(DocumentSnapshot profile) {
        if (!profile.exists()) return Map.of();
        Map<String, Object> contact = new HashMap<>();
        contact.put("name", value(profile.get("full_name")));
        contact.put("email", value(profile.get("email")));
        contact.put("phoneNumber", value(profile.get("phone_number")));
        contact.put("address", value(profile.get("address")));
        contact.put("region", value(profile.get("region")));
        return contact;
    }

    private static String value(Object value) {
        return value == null ? "" : String.valueOf(value).trim();
    }
}
