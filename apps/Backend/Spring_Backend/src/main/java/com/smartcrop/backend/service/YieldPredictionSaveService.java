package com.smartcrop.backend.service;

import java.util.HashMap;
import java.util.Map;

import org.springframework.stereotype.Service;

import com.google.cloud.firestore.FieldValue;
import com.google.cloud.firestore.Firestore;
import com.smartcrop.backend.dto.YieldPredictionSaveRequest;

@Service
public class YieldPredictionSaveService {

    private static final String YIELD_PREDICTIONS_COLLECTION = "yield_predictions";

    private final Firestore firestore;

    public YieldPredictionSaveService(Firestore firestore) {
        this.firestore = firestore;
    }

    public Map<String, String> savePrediction(YieldPredictionSaveRequest request) throws Exception {
        Map<String, Object> prediction = new HashMap<>();
        prediction.put("farmer_id", request.farmerId());
        prediction.put("crop_type", request.cropType());
        prediction.put("farmer", request.farmer());
        prediction.put("input", request.input());
        prediction.put("predicted_yield", request.predictedYield());
        prediction.put("unit", request.unit());
        prediction.put("created_at", FieldValue.serverTimestamp());

        String documentId = firestore.collection(YIELD_PREDICTIONS_COLLECTION).add(prediction).get().getId();

        return Map.of(
            "id", documentId,
            "message", "Yield prediction saved successfully"
        );
    }
}