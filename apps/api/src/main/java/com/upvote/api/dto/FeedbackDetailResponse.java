package com.upvote.api.dto;

import java.time.LocalDateTime;
import java.util.UUID;

/**
 * Individual feedback entry within a group, shown in the dashboard detail modal.
 */
public record FeedbackDetailResponse(
        UUID id,
        String rawMessage,
        String synthesizedMessage,
        String pageUrl,
        String pageTitle,
        String triggerType,
        String lastInteraction,
        String deviceType,
        LocalDateTime createdAt
) {}
