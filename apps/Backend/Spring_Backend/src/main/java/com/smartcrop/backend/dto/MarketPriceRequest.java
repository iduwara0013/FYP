package com.smartcrop.backend.dto;

import jakarta.validation.constraints.NotBlank;

public record MarketPriceRequest(
    @NotBlank String cropName,
    @NotBlank String marketName,
    @NotBlank String region,
    Double pricePerKg,
    String priceDate,
    String unit
) {
}