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

import com.smartcrop.backend.dto.WeatherDataRequest;
import com.smartcrop.backend.service.FirestoreCollectionService;

import jakarta.validation.Valid;

@RestController
@RequestMapping("/api/weather-data")
public class WeatherDataController {

    private final FirestoreCollectionService collectionService;

    public WeatherDataController(FirestoreCollectionService collectionService) {
        this.collectionService = collectionService;
    }

    @PostMapping
    public ResponseEntity<Map<String, String>> createWeatherData(@Valid @RequestBody WeatherDataRequest request) throws Exception {
        Map<String, Object> payload = new HashMap<>();
        payload.put("region", request.region());
        payload.put("forecast_date", request.forecastDate());
        payload.put("temperature", request.temperature());
        payload.put("humidity", request.humidity());
        payload.put("rainfall", request.rainfall());
        payload.put("wind_speed", request.windSpeed());
        payload.put("weather_condition", request.weatherCondition());

        Map<String, String> result = collectionService.createDocument("weather_data", payload);

        return ResponseEntity.status(HttpStatus.CREATED).body(Map.of(
            "id", result.get("id"),
            "message", "Weather data saved successfully"
        ));
    }

    @GetMapping
    public ResponseEntity<List<Map<String, Object>>> getWeatherData() throws Exception {
        return ResponseEntity.ok(collectionService.getDocuments("weather_data"));
    }
}