package com.upvote.api.dto;

import java.time.LocalDateTime;
import java.util.UUID;

/**
 * Resposta com dados de um grupo de feedback para o dashboard
 */
public record FeedbackGroupResponse(
        UUID id,
        String title,
        String summary,
        int voteCount,
        String status,
        String topContext,
        LocalDateTime createdAt,
        LocalDateTime updatedAt
) {}
