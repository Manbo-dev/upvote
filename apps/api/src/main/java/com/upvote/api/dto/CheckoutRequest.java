package com.upvote.api.dto;

import jakarta.validation.constraints.NotBlank;

public record CheckoutRequest(
        @NotBlank(message = "Plano é obrigatório")
        String plano
) {
}
