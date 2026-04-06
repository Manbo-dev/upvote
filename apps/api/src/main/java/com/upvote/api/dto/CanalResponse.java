package com.upvote.api.dto;

import java.time.LocalDateTime;
import java.util.UUID;

public record CanalResponse(
        UUID id,
        String name,
        String slug,
        String apiKey,
        String widgetColor,
        String widgetPosition,
        String widgetTitle,
        String widgetPlaceholder,
        boolean publicBoardEnabled,
        LocalDateTime createdAt
) {
}
