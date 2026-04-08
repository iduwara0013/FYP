package com.smartcrop.backend.dto;

import jakarta.validation.constraints.NotBlank;

public record LandPlotRequest(
    @NotBlank String farmerId,
    @NotBlank String plotName,
    @NotBlank String region,
    @NotBlank String district,
    Double area,
    String soilType,
    String irrigationType,
    String latitude,
    String longitude
) {
}