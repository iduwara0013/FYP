package com.smartcrop.backend.controller;

import java.util.Map;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.smartcrop.backend.dto.YieldPredictionRequest;
import com.smartcrop.backend.service.YieldPredictionService;

import jakarta.validation.Valid;

@RestController
@RequestMapping("/api/yield")
public class YieldPredictionController {

    private final YieldPredictionService yieldPredictionService;

    public YieldPredictionController(YieldPredictionService yieldPredictionService) {
        this.yieldPredictionService = yieldPredictionService;
    }

    @PostMapping("/predict")
    public ResponseEntity<Map<?, ?>> predict(@Valid @RequestBody YieldPredictionRequest request) {
        return ResponseEntity.ok(yieldPredictionService.predictYield(request));
    }
}