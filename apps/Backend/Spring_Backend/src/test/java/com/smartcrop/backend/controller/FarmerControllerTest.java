package com.smartcrop.backend.controller;

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

import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;

import com.smartcrop.backend.service.FarmerService;

@WebMvcTest(FarmerController.class)
class FarmerControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @MockBean
    private FarmerService farmerService;

    @Test
    void createFarmerReturnsFarmerCode() throws Exception {
        when(farmerService.createFarmer(any())).thenReturn(Map.of(
            "id", "doc-123",
            "farmerCode", "FARM-2026-0001"
        ));

        mockMvc.perform(post("/api/farmers")
                .contentType(MediaType.APPLICATION_JSON)
                .content("""
                    {
                      "fullName": "Kamal Perera",
                      "phoneNumber": "0771234567",
                      "email": "kamal@gmail.com",
                      "address": "Matale",
                      "region": "Matale",
                      "nationalId": "987654321V",
                      "farmerType": "individual",
                      "totalLandArea": 5.5,
                      "experienceYears": 10
                    }
                    """))
            .andExpect(status().isCreated())
            .andExpect(jsonPath("$.id").value("doc-123"))
            .andExpect(jsonPath("$.farmerCode").value("FARM-2026-0001"))
            .andExpect(jsonPath("$.message").value("Farmer saved successfully"));
    }

    @Test
    void getFarmersReturnsFarmersList() throws Exception {
        when(farmerService.getFarmers()).thenReturn(List.of(
            Map.of("id", "doc-1", "full_name", "Kamal Perera")
        ));

        mockMvc.perform(get("/api/farmers"))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$", hasSize(1)))
            .andExpect(jsonPath("$[0].id").value("doc-1"))
            .andExpect(jsonPath("$[0].full_name").value("Kamal Perera"));
    }
}