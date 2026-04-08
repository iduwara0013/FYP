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

import com.smartcrop.backend.dto.LandPlotRequest;
import com.smartcrop.backend.service.FirestoreCollectionService;

import jakarta.validation.Valid;

@RestController
@RequestMapping("/api/land-plots")
public class LandPlotController {

    private final FirestoreCollectionService collectionService;

    public LandPlotController(FirestoreCollectionService collectionService) {
        this.collectionService = collectionService;
    }

    @PostMapping
    public ResponseEntity<Map<String, String>> createLandPlot(@Valid @RequestBody LandPlotRequest request) throws Exception {
        Map<String, Object> payload = new HashMap<>();
        payload.put("farmer_id", request.farmerId());
        payload.put("plot_name", request.plotName());
        payload.put("region", request.region());
        payload.put("district", request.district());
        payload.put("area", request.area());
        payload.put("soil_type", request.soilType());
        payload.put("irrigation_type", request.irrigationType());
        payload.put("latitude", request.latitude());
        payload.put("longitude", request.longitude());

        Map<String, String> result = collectionService.createDocument("land_plots", payload);

        return ResponseEntity.status(HttpStatus.CREATED).body(Map.of(
            "id", result.get("id"),
            "message", "Land plot saved successfully"
        ));
    }

    @GetMapping
    public ResponseEntity<List<Map<String, Object>>> getLandPlots() throws Exception {
        return ResponseEntity.ok(collectionService.getDocuments("land_plots"));
    }
}