package com.upvote.api.dto;

import jakarta.validation.constraints.NotBlank;

public record CommentRequest(
        @NotBlank(message = "Conteúdo do comentário é obrigatório")
        String content
) {}
