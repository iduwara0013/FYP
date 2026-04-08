package com.smartcrop.backend.dto;

import jakarta.validation.constraints.NotBlank;

public record YieldPredictionRequest(
    @NotBlank String cropType,
    @NotBlank String region,
    @NotBlank String soilType,
    Double rainfallMm,
    Double temperatureC,
    Double humidityPercent,
    Double landAreaHa,
    @NotBlank String season
) {
}