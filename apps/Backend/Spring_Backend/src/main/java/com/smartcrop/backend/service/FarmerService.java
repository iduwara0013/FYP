package com.smartcrop.backend.service;

import java.time.LocalDate;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

import org.springframework.stereotype.Service;

import com.google.cloud.firestore.DocumentReference;
import com.google.cloud.firestore.DocumentSnapshot;
import com.google.cloud.firestore.FieldValue;
import com.google.cloud.firestore.Firestore;
import com.google.cloud.firestore.QuerySnapshot;
import com.google.cloud.firestore.Transaction;
import com.smartcrop.backend.dto.FarmerRequest;

@Service
public class FarmerService {

    private static final String FARMER_COLLECTION = "farmers";
    private static final String COUNTERS_COLLECTION = "counters";
    private static final int CODE_SEQUENCE_WIDTH = 4;

    private final Firestore firestore;

    public FarmerService(Firestore firestore) {
        this.firestore = firestore;
    }

    public Map<String, String> createFarmer(FarmerRequest request) throws Exception {
        String farmerCode = generateFarmerCode();

        Map<String, Object> farmer = new HashMap<>();
        farmer.put("full_name", request.fullName());
        farmer.put("phone_number", request.phoneNumber());
        farmer.put("email", request.email());
        farmer.put("address", request.address());
        farmer.put("region", request.region());
        farmer.put("national_id", request.nationalId());
        farmer.put("farmer_type", request.farmerType());
        farmer.put("total_land_area", request.totalLandArea());
        farmer.put("experience_years", request.experienceYears());
        farmer.put("farmer_code", farmerCode);
        farmer.put("created_at", FieldValue.serverTimestamp());

        DocumentReference savedDocument = firestore.collection(FARMER_COLLECTION).add(farmer).get();

        return Map.of(
            "id", savedDocument.getId(),
            "farmerCode", farmerCode
        );
    }

    public List<Map<String, Object>> getFarmers() throws Exception {
        QuerySnapshot snapshot = firestore.collection(FARMER_COLLECTION).get().get();

        return snapshot.getDocuments().stream().map(document -> {
            Map<String, Object> farmer = new HashMap<>(document.getData());
            farmer.put("id", document.getId());
            return farmer;
        }).toList();
    }

    public Map<String, Object> getFarmerById(String farmerId) throws Exception {
        DocumentSnapshot document = firestore.collection(FARMER_COLLECTION).document(farmerId).get().get();

        if (!document.exists()) {
            return null;
        }

        Map<String, Object> farmer = new HashMap<>(document.getData());
        farmer.put("id", document.getId());
        return farmer;
    }

    public Map<String, Object> getFarmerByEmail(String email) throws Exception {
        QuerySnapshot snapshot = firestore.collection(FARMER_COLLECTION)
            .whereEqualTo("email", email)
            .limit(1)
            .get()
            .get();

        if (snapshot.isEmpty()) {
            return null;
        }

        DocumentSnapshot document = snapshot.getDocuments().get(0);
        Map<String, Object> farmer = new HashMap<>(document.getData());
        farmer.put("id", document.getId());
        farmer.put("role", "farmer");
        return farmer;
    }

    private String generateFarmerCode() throws Exception {
        int year = LocalDate.now().getYear();
        DocumentReference counterDocument = firestore.collection(COUNTERS_COLLECTION).document("farmer_code_" + year);

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

        return String.format("FARM-%d-%0" + CODE_SEQUENCE_WIDTH + "d", year, sequence);
    }
}