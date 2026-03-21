package com.upvote.api.dto;

import jakarta.validation.constraints.NotBlank;

public record RenameCanelRequest(
        @NotBlank(message = "Channel name is required")
        String name,
        @NotBlank(message = "Channel slug is required")
        String slug
) {
}
