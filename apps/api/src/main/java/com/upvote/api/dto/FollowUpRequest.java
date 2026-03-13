package com.upvote.api.dto;

import jakarta.validation.constraints.NotBlank;

/**
 * Request para resposta de follow-up do usuário
 */
public record FollowUpRequest(
        @NotBlank(message = "Resposta é obrigatória")
        String answer
) {}
