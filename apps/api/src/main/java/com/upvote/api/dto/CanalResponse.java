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
        String widgetMode,
        String widgetTheme,
        String widgetLanguage,
        String widgetButtonStyle,
        boolean publicBoardEnabled,
        LocalDateTime createdAt
) {
}
