package com.smartcrop.backend.controller;

import java.util.Map;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.smartcrop.backend.dto.YieldPredictionSaveRequest;
import com.smartcrop.backend.service.YieldPredictionSaveService;

import jakarta.validation.Valid;

@RestController
@RequestMapping("/api/yield-predictions")
public class YieldPredictionSaveController {

    private final YieldPredictionSaveService yieldPredictionSaveService;

    public YieldPredictionSaveController(YieldPredictionSaveService yieldPredictionSaveService) {
        this.yieldPredictionSaveService = yieldPredictionSaveService;
    }

    @PostMapping
    public ResponseEntity<Map<String, String>> savePrediction(@Valid @RequestBody YieldPredictionSaveRequest request) throws Exception {
        Map<String, String> result = yieldPredictionSaveService.savePrediction(request);
        return ResponseEntity.status(HttpStatus.CREATED).body(Map.of(
            "id", result.get("id"),
            "message", result.get("message")
        ));
    }
}