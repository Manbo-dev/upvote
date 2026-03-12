package com.upvote.api.dto;

import com.upvote.api.domain.SuggestionStatus;

import java.time.LocalDateTime;
import java.util.UUID;

public record SuggestionResponse(
        UUID id,
        String title,
        String description,
        SuggestionStatus status,
        int voteCount,
        String authorName,
        LocalDateTime createdAt,
        boolean votedByCurrentUser
) {
}
