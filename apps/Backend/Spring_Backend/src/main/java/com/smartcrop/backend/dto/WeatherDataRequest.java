package com.smartcrop.backend.dto;

import jakarta.validation.constraints.NotBlank;

public record WeatherDataRequest(
    @NotBlank String region,
    @NotBlank String forecastDate,
    Double temperature,
    Double humidity,
    Double rainfall,
    Double windSpeed,
    String weatherCondition
) {
}