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

import com.smartcrop.backend.dto.CropRequest;
import com.smartcrop.backend.service.FirestoreCollectionService;

import jakarta.validation.Valid;

@RestController
@RequestMapping("/api/crops")
public class CropController {

    private final FirestoreCollectionService collectionService;

    public CropController(FirestoreCollectionService collectionService) {
        this.collectionService = collectionService;
    }

    @PostMapping
    public ResponseEntity<Map<String, String>> createCrop(@Valid @RequestBody CropRequest request) throws Exception {
        Map<String, Object> payload = new HashMap<>();
        payload.put("crop_name", request.cropName());
        payload.put("crop_type", request.cropType());
        payload.put("season", request.season());
        payload.put("region", request.region());
        payload.put("expected_yield", request.expectedYield());
        payload.put("description", request.description());

        Map<String, String> result = collectionService.createDocument("crops", payload);

        return ResponseEntity.status(HttpStatus.CREATED).body(Map.of(
            "id", result.get("id"),
            "message", "Crop saved successfully"
        ));
    }

    @GetMapping
    public ResponseEntity<List<Map<String, Object>>> getCrops() throws Exception {
        return ResponseEntity.ok(collectionService.getDocuments("crops"));
    }
}