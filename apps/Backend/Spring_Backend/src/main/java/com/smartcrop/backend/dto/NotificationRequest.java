package com.smartcrop.backend.dto;

import jakarta.validation.constraints.NotBlank;

public record NotificationRequest(
    @NotBlank String userId,
    @NotBlank String title,
    @NotBlank String body,
    @NotBlank String notificationType,
    String readStatus,
    String createdAt
) {
}