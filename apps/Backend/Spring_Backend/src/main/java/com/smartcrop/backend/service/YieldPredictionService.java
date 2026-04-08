package com.smartcrop.backend.service;

import java.util.Map;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;

import com.smartcrop.backend.dto.YieldPredictionRequest;

@Service
public class YieldPredictionService {

    private final RestTemplate restTemplate;
    private final String pythonBackendUrl;

    public YieldPredictionService(@Value("${python.backend.url:http://localhost:5000}") String pythonBackendUrl) {
        this.restTemplate = new RestTemplate();
        this.pythonBackendUrl = pythonBackendUrl;
    }

    public Map<?, ?> predictYield(YieldPredictionRequest request) {
        Map<String, Object> payload = Map.of(
            "crop_type", request.cropType(),
            "region", request.region(),
            "soil_type", request.soilType(),
            "rainfall_mm", request.rainfallMm(),
            "temperature_c", request.temperatureC(),
            "humidity_percent", request.humidityPercent(),
            "land_area_ha", request.landAreaHa(),
            "season", request.season()
        );

        return restTemplate.postForObject(
            pythonBackendUrl + "/predict-yield",
            payload,
            Map.class
        );
    }
}