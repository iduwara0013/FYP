package com.smartcrop.backend.controller;

import static org.hamcrest.Matchers.hasSize;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
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

import com.smartcrop.backend.service.BuyerService;

@WebMvcTest(BuyerController.class)
class BuyerControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @MockBean
    private BuyerService buyerService;

    @Test
    void createBuyerReturnsBuyerCode() throws Exception {
        when(buyerService.createBuyer(any())).thenReturn(Map.of(
            "id", "buyer-doc-1",
            "buyerCode", "BUY-2026-0001"
        ));

        mockMvc.perform(post("/api/buyers")
                .contentType(MediaType.APPLICATION_JSON)
                .content("""
                    {
                      "fullName": "Buyer One",
                      "phoneNumber": "0772222222",
                      "email": "buyer1@gmail.com",
                      "address": "Galle",
                      "region": "Southern",
                      "buyerType": "wholesaler",
                      "organizationName": "Green Mart",
                      "preferredCrop": "Rice",
                      "requiredQuantity": 100.0,
                      "notes": "Need weekly supply"
                    }
                    """))
            .andExpect(status().isCreated())
            .andExpect(jsonPath("$.id").value("buyer-doc-1"))
            .andExpect(jsonPath("$.buyerCode").value("BUY-2026-0001"))
            .andExpect(jsonPath("$.message").value("Buyer saved successfully"));
    }

    @Test
    void getBuyersReturnsList() throws Exception {
        when(buyerService.getBuyers()).thenReturn(List.of(
            Map.of("id", "buyer-1", "full_name", "Buyer One")
        ));

        mockMvc.perform(get("/api/buyers"))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$", hasSize(1)))
            .andExpect(jsonPath("$[0].id").value("buyer-1"));
    }
}