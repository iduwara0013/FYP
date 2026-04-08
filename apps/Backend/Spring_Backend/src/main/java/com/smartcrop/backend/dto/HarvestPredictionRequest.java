package com.smartcrop.backend.dto;

import jakarta.validation.constraints.NotBlank;

public record HarvestPredictionRequest(
    @NotBlank String farmerId,
    @NotBlank String plotId,
    @NotBlank String cropName,
    String predictedHarvestDate,
    Double predictedYield,
    String modelName,
    Double confidenceScore
) {
}