package com.smartcrop.backend.service;

import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.time.Duration;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;

@Service
public class MarketPriceAutomationService {
    private final HartiPriceService hartiPriceService;
    private final FirestoreCollectionService collectionService;
    private final HttpClient httpClient = HttpClient.newBuilder().connectTimeout(Duration.ofSeconds(15)).build();

    @Value("${python.backend.url:http://localhost:5000}")
    private String pythonBackendUrl;

    public MarketPriceAutomationService(HartiPriceService hartiPriceService, FirestoreCollectionService collectionService) {
        this.hartiPriceService = hartiPriceService;
        this.collectionService = collectionService;
    }

    public Map<String, Object> collectAndArchive() {
        Map<String, Object> response = hartiPriceService.fetchLivePrices();
        archive(response);
        return response;
    }

    @Scheduled(cron = "${harti.collection.cron:0 30 7 * * *}", zone = "Asia/Colombo")
    public void dailyCollection() {
        collectAndArchive();
    }

    @Scheduled(cron = "${harti.retraining.cron:0 0 2 * * SUN}", zone = "Asia/Colombo")
    public void weeklyRetraining() {
        try {
            HttpRequest request = HttpRequest.newBuilder()
                .uri(URI.create(pythonBackendUrl + "/price-model/retrain"))
                .timeout(Duration.ofMinutes(10))
                .header("Content-Type", "application/json")
                .POST(HttpRequest.BodyPublishers.ofString("{}"))
                .build();
            httpClient.send(request, HttpResponse.BodyHandlers.discarding());
        } catch (Exception ignored) {
            // The next weekly run retries; the currently promoted model remains active.
        }
    }

    @SuppressWarnings("unchecked")
    private void archive(Map<String, Object> response) {
        Object rawBulletins = response.get("bulletins");
        if (!(rawBulletins instanceof List<?> bulletins)) return;
        for (Object item : bulletins) {
            if (!(item instanceof Map<?, ?> raw) || !Boolean.TRUE.equals(raw.get("success"))) continue;
            Map<String, Object> bulletin = new HashMap<>((Map<String, Object>) raw);
            String date = String.valueOf(bulletin.get("date"));
            if (date.isBlank() || "null".equals(date)) continue;
            bulletin.put("source", "HARTI");
            try {
                collectionService.saveDocument("market_price_bulletins", date, bulletin);
            } catch (Exception ignored) {
                // A temporary Firestore failure must not stop the collector.
            }
        }
    }
}
