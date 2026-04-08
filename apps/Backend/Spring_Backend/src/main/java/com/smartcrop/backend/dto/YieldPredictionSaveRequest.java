package com.smartcrop.backend.dto;

import java.util.Map;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

public record YieldPredictionSaveRequest(
    @NotBlank String farmerId,
    @NotBlank String cropType,
    @NotNull Map<String, Object> farmer,
    @NotNull Map<String, Object> input,
    @NotNull Double predictedYield,
    @NotBlank String unit
) {
}