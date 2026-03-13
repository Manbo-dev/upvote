package com.upvote.api.dto;

import jakarta.validation.constraints.NotBlank;

/**
 * Request para submissão de feedback pelo widget
 */
public record FeedbackSubmitRequest(
        @NotBlank(message = "Mensagem é obrigatória")
        String message,

        String pageUrl,
        String pageTitle,
        String triggerType,
        String lastInteraction,
        String deviceType
) {}
