package com.smartcrop.backend.dto;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;

public record FarmerRequest(
    @NotBlank String fullName,
    @NotBlank String phoneNumber,
    @Email @NotBlank String email,
    @NotBlank String address,
    @NotBlank String region,
    String nationalId,
    String farmerType,
    Double totalLandArea,
    Integer experienceYears
) {
}