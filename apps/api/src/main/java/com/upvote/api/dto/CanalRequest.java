package com.upvote.api.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;

public record CanalRequest(
        @NotBlank(message = "Nome do canal é obrigatório")
        String name,

        @NotBlank(message = "Slug é obrigatório")
        @Pattern(regexp = "^[a-z0-9-]+$", message = "Slug deve conter apenas letras minúsculas, números e hífens")
        String slug
) {
}
