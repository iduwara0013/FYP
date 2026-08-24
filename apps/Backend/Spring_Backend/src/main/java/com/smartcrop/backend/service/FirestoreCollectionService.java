package com.smartcrop.backend.service;

import java.util.HashMap;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Map;
import java.util.Set;

import org.springframework.stereotype.Service;

import com.google.cloud.firestore.FieldValue;
import com.google.cloud.firestore.Firestore;
import com.google.cloud.firestore.QueryDocumentSnapshot;
import com.google.cloud.firestore.QuerySnapshot;

@Service
public class FirestoreCollectionService {

    private static final Set<String> ALLOWED_COLLECTIONS = new LinkedHashSet<>(List.of(
        "buyers",
        "buyer_orders",
        "cropPlans",
        "crops",
        "demand_records",
        "farmers",
        "harvest_predictions",
        "land_plots",
        "market_prices",
        "market_price_bulletins",
        "market_price_alerts",
        "marketplace_listings",
        "purchase_requests",
        "trade_conversations",
        "messages",
        "offers",
        "trade_orders",
        "deliveries",
        "payments",
        "invoices",
        "ratings",
        "trusted_contacts",
        "disputes",
        "verification_requests",
        "saved_listings",
        "notifications",
        "weather_data",
        "yield_predictions",
        "app_notifications",
        "notification_preferences"
    ));

    private final Firestore firestore;

    public FirestoreCollectionService(Firestore firestore) {
        this.firestore = firestore;
    }

    public Set<String> getAllowedCollections() {
        return ALLOWED_COLLECTIONS;
    }

    public Map<String, String> createDocument(String collectionName, Map<String, Object> payload) throws Exception {
        ensureAllowedCollection(collectionName);

        Map<String, Object> document = new HashMap<>(payload);
        document.put("created_at", FieldValue.serverTimestamp());
        document.put("collection_name", collectionName);

        String documentId = firestore.collection(collectionName).add(document).get().getId();

        return Map.of(
            "id", documentId,
            "collectionName", collectionName
        );
    }

    public Map<String, String> saveDocument(String collectionName, String documentId, Map<String, Object> payload) throws Exception {
        ensureAllowedCollection(collectionName);
        Map<String, Object> document = new HashMap<>(payload);
        document.put("updated_at", FieldValue.serverTimestamp());
        document.put("collection_name", collectionName);
        firestore.collection(collectionName).document(documentId).set(document).get();
        return Map.of("id", documentId, "collectionName", collectionName);
    }

    public List<Map<String, Object>> getDocuments(String collectionName) throws Exception {
        ensureAllowedCollection(collectionName);

        QuerySnapshot snapshot = firestore.collection(collectionName).get().get();

        return snapshot.getDocuments().stream().map(this::toDocumentMap).toList();
    }

    public List<Map<String, Object>> getDocumentsByField(
        String collectionName,
        String fieldName,
        String fieldValue
    ) throws Exception {
        ensureAllowedCollection(collectionName);
        QuerySnapshot snapshot = firestore.collection(collectionName)
            .whereEqualTo(fieldName, fieldValue)
            .get()
            .get();
        return snapshot.getDocuments().stream().map(this::toDocumentMap).toList();
    }

    private Map<String, Object> toDocumentMap(QueryDocumentSnapshot document) {
        Map<String, Object> data = new HashMap<>(document.getData());
        data.put("id", document.getId());
        return data;
    }

    private void ensureAllowedCollection(String collectionName) {
        if (!ALLOWED_COLLECTIONS.contains(collectionName)) {
            throw new IllegalArgumentException("Unsupported collection: " + collectionName);
        }
    }
}
