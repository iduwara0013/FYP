package com.smartcrop.backend.service;

import java.time.LocalDate;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Objects;

import org.springframework.stereotype.Service;

import com.google.cloud.firestore.DocumentReference;
import com.google.cloud.firestore.DocumentSnapshot;
import com.google.cloud.firestore.FieldValue;
import com.google.cloud.firestore.Firestore;
import com.google.cloud.firestore.QuerySnapshot;
import com.google.cloud.firestore.Transaction;
import com.smartcrop.backend.dto.BuyerRequest;

@Service
public class BuyerService {

    private static final String BUYER_COLLECTION = "buyers";
    private static final String COUNTERS_COLLECTION = "counters";
    private static final int CODE_SEQUENCE_WIDTH = 4;

    private final Firestore firestore;

    public BuyerService(Firestore firestore) {
        this.firestore = firestore;
    }

    public Map<String, String> createBuyer(BuyerRequest request) throws Exception {
        String buyerCode = generateBuyerCode();

        Map<String, Object> buyer = new HashMap<>();
        buyer.put("full_name", request.fullName());
        buyer.put("phone_number", request.phoneNumber());
        buyer.put("email", request.email());
        buyer.put("address", request.address());
        buyer.put("region", request.region());
        buyer.put("buyer_type", request.buyerType());
        buyer.put("organization_name", request.organizationName());
        buyer.put("preferred_crop", request.preferredCrop());
        buyer.put("required_quantity", request.requiredQuantity());
        buyer.put("notes", request.notes());
        buyer.put("has_storage", Boolean.TRUE.equals(request.hasStorage()));
        buyer.put("has_transport", Boolean.TRUE.equals(request.hasTransport()));
        buyer.put("buyer_code", buyerCode);
        buyer.put("created_at", FieldValue.serverTimestamp());

        DocumentReference savedDocument = firestore.collection(BUYER_COLLECTION).add(buyer).get();

        return Map.of(
            "id", savedDocument.getId(),
            "buyerCode", buyerCode
        );
    }

    public Map<String, Object> updateBuyer(String buyerId, BuyerRequest request) throws Exception {
        DocumentReference document = firestore.collection(BUYER_COLLECTION).document(buyerId);
        if (!document.get().get().exists()) return null;
        Map<String, Object> values = new HashMap<>();
        values.put("full_name", request.fullName()); values.put("phone_number", request.phoneNumber());
        values.put("email", request.email()); values.put("address", request.address()); values.put("region", request.region());
        values.put("buyer_type", request.buyerType()); values.put("organization_name", request.organizationName());
        values.put("preferred_crop", request.preferredCrop()); values.put("required_quantity", request.requiredQuantity());
        values.put("notes", request.notes()); values.put("has_storage", Boolean.TRUE.equals(request.hasStorage()));
        values.put("has_transport", Boolean.TRUE.equals(request.hasTransport())); values.put("updated_at", FieldValue.serverTimestamp());
        document.update(values).get();
        return getBuyerById(buyerId);
    }

    public List<Map<String, Object>> getBuyers() throws Exception {
        QuerySnapshot snapshot = firestore.collection(BUYER_COLLECTION).get().get();

        return snapshot.getDocuments().stream().map(document -> {
            Map<String, Object> buyer = new HashMap<>(document.getData());
            buyer.put("id", document.getId());
            return buyer;
        }).toList();
    }

    public Map<String, Object> getBuyerById(String buyerId) throws Exception {
        String nonNullBuyerId = Objects.requireNonNull(buyerId, "buyerId must not be null");
        DocumentSnapshot document = firestore.collection(BUYER_COLLECTION).document(nonNullBuyerId).get().get();

        if (!document.exists()) {
            return null;
        }

        Map<String, Object> data = document.getData();
        if (data == null) {
            data = Map.of();
        }

        Map<String, Object> buyer = new HashMap<>(data);
        buyer.put("id", document.getId());
        return buyer;
    }

    public Map<String, Object> getBuyerByEmail(String email) throws Exception {
        QuerySnapshot snapshot = firestore.collection(BUYER_COLLECTION)
            .whereEqualTo("email", email)
            .limit(1)
            .get()
            .get();

        if (snapshot.isEmpty()) {
            return null;
        }

        DocumentSnapshot document = snapshot.getDocuments().get(0);
        Map<String, Object> buyer = new HashMap<>(document.getData());
        buyer.put("id", document.getId());
        buyer.put("role", "buyer");
        return buyer;
    }

    private String generateBuyerCode() throws Exception {
        int year = LocalDate.now().getYear();
        DocumentReference counterDocument = firestore.collection(COUNTERS_COLLECTION).document("buyer_code_" + year);

        Long sequence = firestore.runTransaction((Transaction transaction) -> {
            DocumentSnapshot snapshot = transaction.get(counterDocument).get();
            long nextSequence = 1L;

            if (snapshot.exists() && snapshot.contains("sequence")) {
                Number currentSequence = snapshot.getLong("sequence");
                if (currentSequence != null) {
                    nextSequence = currentSequence.longValue() + 1L;
                }
            }

            transaction.set(counterDocument, Map.of(
                "year", year,
                "sequence", nextSequence
            ));

            return nextSequence;
        }).get();

        return String.format("BUY-%d-%0" + CODE_SEQUENCE_WIDTH + "d", year, sequence);
    }
}
