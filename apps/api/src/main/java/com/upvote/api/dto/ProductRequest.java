package com.upvote.api.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;

public record ProductRequest(
        @NotBlank(message = "Nome do produto é obrigatório")
        String name,

        @NotBlank(message = "Slug é obrigatório")
        @Pattern(regexp = "^[a-z0-9-]+$", message = "Slug deve conter apenas letras minúsculas, números e hífens")
        String slug
) {}
