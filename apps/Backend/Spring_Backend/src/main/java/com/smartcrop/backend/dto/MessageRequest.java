package com.smartcrop.backend.dto;

import jakarta.validation.constraints.NotBlank;

public record MessageRequest(
    @NotBlank String senderId,
    @NotBlank String receiverId,
    @NotBlank String messageText,
    @NotBlank String messageType,
    String sentAt
) {
}