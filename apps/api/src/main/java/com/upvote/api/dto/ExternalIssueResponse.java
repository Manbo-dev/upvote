package com.upvote.api.dto;

import java.util.UUID;

/**
 * Response DTO for an external issue linked to a feedback group.
 */
public record ExternalIssueResponse(
        UUID id,
        String provider,
        String externalId,
        String externalUrl,
        String externalStatus
) {}
