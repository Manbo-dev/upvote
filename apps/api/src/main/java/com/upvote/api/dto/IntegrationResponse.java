package com.upvote.api.dto;

import java.time.LocalDateTime;
import java.util.UUID;

/**
 * Response DTO for a connected integration (Jira/ClickUp).
 */
public record IntegrationResponse(
        UUID id,
        String provider,
        String siteUrl,
        LocalDateTime createdAt
) {}
