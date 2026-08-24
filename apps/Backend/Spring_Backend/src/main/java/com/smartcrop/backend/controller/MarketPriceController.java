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
import com.smartcrop.backend.service.HartiPriceService;

import jakarta.validation.Valid;

@RestController
@RequestMapping("/api/market-prices")
public class MarketPriceController {

    private final FirestoreCollectionService collectionService;
    private final HartiPriceService hartiPriceService;

    public MarketPriceController(FirestoreCollectionService collectionService, HartiPriceService hartiPriceService) {
        this.collectionService = collectionService;
        this.hartiPriceService = hartiPriceService;
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

    @GetMapping("/live")
    public ResponseEntity<Map<String, Object>> getLiveMarketPrices() throws Exception {
        Map<String, Object> response = hartiPriceService.fetchLivePrices();
        archiveSuccessfulBulletins(response);
        return ResponseEntity.ok(response);
    }

    @GetMapping("/history")
    public ResponseEntity<List<Map<String, Object>>> getMarketPriceHistory() throws Exception {
        return ResponseEntity.ok(collectionService.getDocuments("market_price_bulletins"));
    }

    @SuppressWarnings("unchecked")
    private void archiveSuccessfulBulletins(Map<String, Object> response) {
        Object rawBulletins = response.get("bulletins");
        if (!(rawBulletins instanceof List<?> bulletins)) return;
        for (Object rawBulletin : bulletins) {
            if (!(rawBulletin instanceof Map<?, ?> rawMap) || !Boolean.TRUE.equals(rawMap.get("success"))) continue;
            Map<String, Object> bulletin = new HashMap<>((Map<String, Object>) rawMap);
            String date = String.valueOf(bulletin.get("date"));
            if (date.isBlank() || "null".equals(date)) continue;
            bulletin.put("source", "HARTI");
            try {
                collectionService.saveDocument("market_price_bulletins", date, bulletin);
            } catch (Exception ignored) {
                // Live prices remain available even when archival storage is temporarily unavailable.
            }
        }
    }
}
