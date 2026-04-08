package com.smartcrop.backend.dto;

import jakarta.validation.constraints.NotBlank;

public record DemandRecordRequest(
    @NotBlank String cropName,
    @NotBlank String region,
    @NotBlank String marketName,
    String demandDate,
    Double demandScore,
    String notes
) {
}