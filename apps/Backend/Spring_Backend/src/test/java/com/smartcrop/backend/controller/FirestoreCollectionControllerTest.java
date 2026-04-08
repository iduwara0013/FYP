package com.smartcrop.backend.controller;

import static org.hamcrest.Matchers.containsString;
import static org.hamcrest.Matchers.hasSize;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.content;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import java.util.List;
import java.util.Map;
import java.util.Set;

import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;

import com.smartcrop.backend.service.FirestoreCollectionService;

@WebMvcTest(FirestoreCollectionController.class)
class FirestoreCollectionControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @MockBean
    private FirestoreCollectionService collectionService;

    @Test
    void getAllowedCollectionsReturnsConfiguredCollectionNames() throws Exception {
        when(collectionService.getAllowedCollections()).thenReturn(Set.of("buyers", "farmers"));

        mockMvc.perform(get("/api/collections"))
            .andExpect(status().isOk())
            .andExpect(content().string(containsString("buyers")))
            .andExpect(content().string(containsString("farmers")));
    }

    @Test
    void createDocumentReturnsCreatedResponse() throws Exception {
        when(collectionService.createDocument(any(), any())).thenReturn(Map.of(
            "id", "buyer-doc-1",
            "collectionName", "buyers"
        ));

        mockMvc.perform(post("/api/collections/buyers")
                .contentType(MediaType.APPLICATION_JSON)
                .content("""
                    {
                      "full_name": "Buyer One",
                      "phone_number": "0771111111",
                      "email": "buyer1@gmail.com",
                      "location": "Galle"
                    }
                    """))
            .andExpect(status().isCreated())
            .andExpect(jsonPath("$.id").value("buyer-doc-1"))
            .andExpect(jsonPath("$.collectionName").value("buyers"))
            .andExpect(jsonPath("$.message").value("Document saved successfully"));
    }

    @Test
    void getDocumentsReturnsCollectionDocuments() throws Exception {
        when(collectionService.getDocuments("buyers")).thenReturn(List.of(
            Map.of("id", "buyer-1", "full_name", "Buyer One")
        ));

        mockMvc.perform(get("/api/collections/buyers"))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$", hasSize(1)))
            .andExpect(jsonPath("$[0].id").value("buyer-1"))
            .andExpect(jsonPath("$[0].full_name").value("Buyer One"));
    }
}