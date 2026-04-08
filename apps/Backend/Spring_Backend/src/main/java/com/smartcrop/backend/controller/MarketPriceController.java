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

import com.smartcrop.backend.dto.MarketPriceRequest;
import com.smartcrop.backend.service.FirestoreCollectionService;

import jakarta.validation.Valid;

@RestController
@RequestMapping("/api/market-prices")
public class MarketPriceController {

    private final FirestoreCollectionService collectionService;

    public MarketPriceController(FirestoreCollectionService collectionService) {
        this.collectionService = collectionService;
    }

    @PostMapping
    public ResponseEntity<Map<String, String>> createMarketPrice(@Valid @RequestBody MarketPriceRequest request) throws Exception {
        Map<String, Object> payload = new HashMap<>();
        payload.put("crop_name", request.cropName());
        payload.put("market_name", request.marketName());
        payload.put("region", request.region());
        payload.put("price_per_kg", request.pricePerKg());
        payload.put("price_date", request.priceDate());
        payload.put("unit", request.unit());

        Map<String, String> result = collectionService.createDocument("market_prices", payload);

        return ResponseEntity.status(HttpStatus.CREATED).body(Map.of(
            "id", result.get("id"),
            "message", "Market price saved successfully"
        ));
    }

    @GetMapping
    public ResponseEntity<List<Map<String, Object>>> getMarketPrices() throws Exception {
        return ResponseEntity.ok(collectionService.getDocuments("market_prices"));
    }
}