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

import com.smartcrop.backend.dto.DemandRecordRequest;
import com.smartcrop.backend.service.FirestoreCollectionService;

import jakarta.validation.Valid;

@RestController
@RequestMapping("/api/demand-records")
public class DemandRecordController {

    private final FirestoreCollectionService collectionService;

    public DemandRecordController(FirestoreCollectionService collectionService) {
        this.collectionService = collectionService;
    }

    @PostMapping
    public ResponseEntity<Map<String, String>> createDemandRecord(@Valid @RequestBody DemandRecordRequest request) throws Exception {
        Map<String, Object> payload = new HashMap<>();
        payload.put("crop_name", request.cropName());
        payload.put("region", request.region());
        payload.put("market_name", request.marketName());
        payload.put("demand_date", request.demandDate());
        payload.put("demand_score", request.demandScore());
        payload.put("notes", request.notes());

        Map<String, String> result = collectionService.createDocument("demand_records", payload);

        return ResponseEntity.status(HttpStatus.CREATED).body(Map.of(
            "id", result.get("id"),
            "message", "Demand record saved successfully"
        ));
    }

    @GetMapping
    public ResponseEntity<List<Map<String, Object>>> getDemandRecords() throws Exception {
        return ResponseEntity.ok(collectionService.getDocuments("demand_records"));
    }
}