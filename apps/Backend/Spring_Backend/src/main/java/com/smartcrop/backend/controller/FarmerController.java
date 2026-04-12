package com.smartcrop.backend.controller;

import java.util.List;
import java.util.Map;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import com.smartcrop.backend.dto.FarmerRequest;
import com.smartcrop.backend.service.FarmerService;

import jakarta.validation.Valid;

@RestController
@RequestMapping("/api/farmers")
public class FarmerController {

    private final FarmerService farmerService;

    public FarmerController(FarmerService farmerService) {
        this.farmerService = farmerService;
    }

    @PostMapping
    public ResponseEntity<Map<String, String>> createFarmer(@Valid @RequestBody FarmerRequest request) throws Exception {
        Map<String, String> result = farmerService.createFarmer(request);
        return ResponseEntity.status(HttpStatus.CREATED).body(Map.of(
            "id", result.get("id"),
            "farmerCode", result.get("farmerCode"),
            "message", "Farmer saved successfully"
        ));
    }

    @GetMapping
    public ResponseEntity<List<Map<String, Object>>> getFarmers() throws Exception {
        return ResponseEntity.ok(farmerService.getFarmers());
    }

    @GetMapping("/{farmerId}")
    public ResponseEntity<Map<String, Object>> getFarmerById(@PathVariable String farmerId) throws Exception {
        Map<String, Object> farmer = farmerService.getFarmerById(farmerId);

        if (farmer == null) {
            return ResponseEntity.notFound().build();
        }

        return ResponseEntity.ok(farmer);
    }

    @GetMapping("/by-email")
    public ResponseEntity<Map<String, Object>> getFarmerByEmail(@RequestParam String email) throws Exception {
        Map<String, Object> farmer = farmerService.getFarmerByEmail(email);

        if (farmer == null) {
            return ResponseEntity.notFound().build();
        }

        return ResponseEntity.ok(farmer);
    }
}