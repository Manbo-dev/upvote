package com.upvote.api.dto;

import com.fasterxml.jackson.annotation.JsonInclude;

import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

/**
 * Resposta com dados de um grupo de feedback para o dashboard
 */
@JsonInclude(JsonInclude.Include.NON_NULL)
public record FeedbackGroupResponse(
        UUID id,
        String title,
        String summary,
        int voteCount,
        String status,
        String category,
        String topContext,
        List<ExternalIssueResponse> externalIssues,
        LocalDateTime createdAt,
        LocalDateTime updatedAt
) {}
