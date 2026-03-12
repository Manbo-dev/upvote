package com.upvote.api.dto;

import java.time.LocalDateTime;
import java.util.UUID;

public record ProductResponse(
        UUID id,
        String name,
        String slug,
        String widgetColor,
        LocalDateTime createdAt
) {
}
