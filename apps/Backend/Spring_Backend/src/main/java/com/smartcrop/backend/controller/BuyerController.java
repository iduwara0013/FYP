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

import com.smartcrop.backend.dto.BuyerRequest;
import com.smartcrop.backend.service.BuyerService;

import jakarta.validation.Valid;

@RestController
@RequestMapping("/api/buyers")
public class BuyerController {

    private final BuyerService buyerService;

    public BuyerController(BuyerService buyerService) {
        this.buyerService = buyerService;
    }

    @PostMapping
    public ResponseEntity<Map<String, String>> createBuyer(@Valid @RequestBody BuyerRequest request) throws Exception {
        Map<String, String> result = buyerService.createBuyer(request);
        return ResponseEntity.status(HttpStatus.CREATED).body(Map.of(
            "id", result.get("id"),
            "buyerCode", result.get("buyerCode"),
            "message", "Buyer saved successfully"
        ));
    }

    @GetMapping
    public ResponseEntity<List<Map<String, Object>>> getBuyers() throws Exception {
        return ResponseEntity.ok(buyerService.getBuyers());
    }

    @GetMapping("/{buyerId}")
    public ResponseEntity<Map<String, Object>> getBuyerById(@PathVariable String buyerId) throws Exception {
        Map<String, Object> buyer = buyerService.getBuyerById(buyerId);

        if (buyer == null) {
            return ResponseEntity.notFound().build();
        }

        return ResponseEntity.ok(buyer);
    }

    @GetMapping("/by-email")
    public ResponseEntity<Map<String, Object>> getBuyerByEmail(@RequestParam String email) throws Exception {
        Map<String, Object> buyer = buyerService.getBuyerByEmail(email);

        if (buyer == null) {
            return ResponseEntity.notFound().build();
        }

        return ResponseEntity.ok(buyer);
    }
}