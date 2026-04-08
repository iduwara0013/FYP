package com.smartcrop.backend.controller;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.smartcrop.backend.dto.HarvestPredictionRequest;
import com.smartcrop.backend.service.FirestoreCollectionService;

import jakarta.validation.Valid;

@RestController
@RequestMapping("/api/harvest-predictions")
public class HarvestPredictionController {

    private final FirestoreCollectionService collectionService;

    public HarvestPredictionController(FirestoreCollectionService collectionService) {
        this.collectionService = collectionService;
    }

    @PostMapping
    public ResponseEntity<Map<String, String>> createHarvestPrediction(@Valid @RequestBody HarvestPredictionRequest request) throws Exception {
        Map<String, Object> payload = new HashMap<>();
        payload.put("farmer_id", request.farmerId());
        payload.put("plot_id", request.plotId());
        payload.put("crop_name", request.cropName());
        payload.put("predicted_harvest_date", request.predictedHarvestDate());
        payload.put("predicted_yield", request.predictedYield());
        payload.put("model_name", request.modelName());
        payload.put("confidence_score", request.confidenceScore());

        Map<String, String> result = collectionService.createDocument("harvest_predictions", payload);

        return ResponseEntity.status(HttpStatus.CREATED).body(Map.of(
            "id", result.get("id"),
            "message", "Harvest prediction saved successfully"
        ));
    }

    @GetMapping
    public ResponseEntity<List<Map<String, Object>>> getHarvestPredictions() throws Exception {
        return ResponseEntity.ok(collectionService.getDocuments("harvest_predictions"));
    }
}