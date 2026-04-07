package com.upvote.api.dto;

import jakarta.validation.constraints.NotBlank;

public record AcceptInviteRequest(
        @NotBlank(message = "Token é obrigatório")
        String token
) {
}
