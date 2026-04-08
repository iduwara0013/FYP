package com.smartcrop.backend.dto;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;

public record BuyerRequest(
    @NotBlank String fullName,
    @NotBlank String phoneNumber,
    @Email @NotBlank String email,
    @NotBlank String address,
    @NotBlank String region,
    @NotBlank String buyerType,
    String organizationName,
    String preferredCrop,
    Double requiredQuantity,
    String notes
) {
}