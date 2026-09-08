package com.smartcrop.backend.controller;

import java.util.List;
import java.util.Map;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import com.smartcrop.backend.service.TradeDealService;

@RestController
@RequestMapping("/api/trades")
public class TradeDealController {

    private final TradeDealService tradeDealService;

    public TradeDealController(TradeDealService tradeDealService) {
        this.tradeDealService = tradeDealService;
    }

    @PostMapping("/listings/{listingId}/claim")
    public ResponseEntity<Map<String, Object>> claim(@PathVariable String listingId, @RequestBody Map<String, Object> payload) throws Exception {
        return ResponseEntity.ok(tradeDealService.claimListing(listingId, payload));
    }

    @GetMapping("/{listingId}")
    public ResponseEntity<Map<String, Object>> conversation(@PathVariable String listingId, @RequestParam String userId) throws Exception {
        return ResponseEntity.ok(tradeDealService.getConversation(listingId, userId));
    }

    @GetMapping("/user/{userId}")
    public ResponseEntity<List<Map<String, Object>>> conversations(@PathVariable String userId) throws Exception {
        return ResponseEntity.ok(tradeDealService.getUserConversations(userId));
    }

    @PostMapping("/{listingId}/messages")
    public ResponseEntity<Map<String, Object>> message(@PathVariable String listingId, @RequestBody Map<String, Object> payload) throws Exception {
        return ResponseEntity.status(HttpStatus.CREATED).body(tradeDealService.sendMessage(listingId, payload));
    }

    @GetMapping("/{listingId}/messages")
    public ResponseEntity<List<Map<String, Object>>> messages(@PathVariable String listingId, @RequestParam String userId) throws Exception {
        return ResponseEntity.ok(tradeDealService.getMessages(listingId, userId));
    }

    @PostMapping("/{listingId}/finalize")
    public ResponseEntity<Map<String, Object>> finalizeDeal(@PathVariable String listingId, @RequestBody Map<String, Object> payload) throws Exception {
        return ResponseEntity.ok(tradeDealService.finalizeDeal(listingId, payload));
    }

    @PostMapping("/{listingId}/cancel")
    public ResponseEntity<Map<String, Object>> cancel(@PathVariable String listingId, @RequestBody Map<String, Object> payload) throws Exception {
        return ResponseEntity.ok(tradeDealService.cancelDiscussion(listingId, payload));
    }

    @ExceptionHandler({IllegalArgumentException.class, IllegalStateException.class})
    public ResponseEntity<Map<String, String>> badRequest(RuntimeException error) {
        return ResponseEntity.status(HttpStatus.CONFLICT).body(Map.of("message", error.getMessage()));
    }

    @ExceptionHandler(SecurityException.class)
    public ResponseEntity<Map<String, String>> forbidden(SecurityException error) {
        return ResponseEntity.status(HttpStatus.FORBIDDEN).body(Map.of("message", error.getMessage()));
    }
}
