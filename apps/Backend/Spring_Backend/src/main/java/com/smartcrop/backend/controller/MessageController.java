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

import com.smartcrop.backend.dto.MessageRequest;
import com.smartcrop.backend.service.FirestoreCollectionService;

import jakarta.validation.Valid;

@RestController
@RequestMapping("/api/messages")
public class MessageController {

    private final FirestoreCollectionService collectionService;

    public MessageController(FirestoreCollectionService collectionService) {
        this.collectionService = collectionService;
    }

    @PostMapping
    public ResponseEntity<Map<String, String>> createMessage(@Valid @RequestBody MessageRequest request) throws Exception {
        Map<String, Object> payload = new HashMap<>();
        payload.put("sender_id", request.senderId());
        payload.put("receiver_id", request.receiverId());
        payload.put("message_text", request.messageText());
        payload.put("message_type", request.messageType());
        payload.put("sent_at", request.sentAt());

        Map<String, String> result = collectionService.createDocument("messages", payload);

        return ResponseEntity.status(HttpStatus.CREATED).body(Map.of(
            "id", result.get("id"),
            "message", "Message saved successfully"
        ));
    }

    @GetMapping
    public ResponseEntity<List<Map<String, Object>>> getMessages() throws Exception {
        return ResponseEntity.ok(collectionService.getDocuments("messages"));
    }
}