package com.smartcrop.backend.controller;

import java.util.List;
import java.util.Map;
import java.util.Set;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.smartcrop.backend.service.FirestoreCollectionService;

@RestController
@RequestMapping("/api/collections")
public class FirestoreCollectionController {

    private final FirestoreCollectionService collectionService;

    public FirestoreCollectionController(FirestoreCollectionService collectionService) {
        this.collectionService = collectionService;
    }

    @GetMapping
    public ResponseEntity<Set<String>> getAllowedCollections() {
        return ResponseEntity.ok(collectionService.getAllowedCollections());
    }

    @PostMapping("/{collectionName}")
    public ResponseEntity<Map<String, String>> createDocument(
        @PathVariable String collectionName,
        @RequestBody Map<String, Object> payload
    ) throws Exception {
        Map<String, String> result = collectionService.createDocument(collectionName, payload);

        return ResponseEntity.status(HttpStatus.CREATED).body(Map.of(
            "id", result.get("id"),
            "collectionName", result.get("collectionName"),
            "message", "Document saved successfully"
        ));
    }

    @GetMapping("/{collectionName}")
    public ResponseEntity<List<Map<String, Object>>> getDocuments(@PathVariable String collectionName) throws Exception {
        return ResponseEntity.ok(collectionService.getDocuments(collectionName));
    }

    @PutMapping("/{collectionName}/{documentId}")
    public ResponseEntity<Map<String, String>> updateDocument(@PathVariable String collectionName, @PathVariable String documentId, @RequestBody Map<String, Object> payload) throws Exception {
        return ResponseEntity.ok(collectionService.saveDocument(collectionName, documentId, payload));
    }

    @GetMapping("/cropPlans/farmer/{farmerId}")
    public ResponseEntity<List<Map<String, Object>>> getFarmerCropPlans(
        @PathVariable String farmerId
    ) throws Exception {
        return ResponseEntity.ok(collectionService.getDocumentsByField(
            "cropPlans", "farmerId", farmerId
        ));
    }
}
