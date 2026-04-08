package com.smartcrop.backend.dto;

import jakarta.validation.constraints.NotBlank;

public record CropRequest(
    @NotBlank String cropName,
    @NotBlank String cropType,
    @NotBlank String season,
    @NotBlank String region,
    Double expectedYield,
    String description
) {
}