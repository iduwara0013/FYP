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

import com.smartcrop.backend.dto.NotificationRequest;
import com.smartcrop.backend.service.FirestoreCollectionService;

import jakarta.validation.Valid;

@RestController
@RequestMapping("/api/notifications")
public class NotificationController {

    private final FirestoreCollectionService collectionService;

    public NotificationController(FirestoreCollectionService collectionService) {
        this.collectionService = collectionService;
    }

    @PostMapping
    public ResponseEntity<Map<String, String>> createNotification(@Valid @RequestBody NotificationRequest request) throws Exception {
        Map<String, Object> payload = new HashMap<>();
        payload.put("user_id", request.userId());
        payload.put("title", request.title());
        payload.put("body", request.body());
        payload.put("notification_type", request.notificationType());
        payload.put("read_status", request.readStatus());
        payload.put("created_at_text", request.createdAt());

        Map<String, String> result = collectionService.createDocument("notifications", payload);

        return ResponseEntity.status(HttpStatus.CREATED).body(Map.of(
            "id", result.get("id"),
            "message", "Notification saved successfully"
        ));
    }

    @GetMapping
    public ResponseEntity<List<Map<String, Object>>> getNotifications() throws Exception {
        return ResponseEntity.ok(collectionService.getDocuments("notifications"));
    }
}