package com.upvote.api.dto;

import java.time.LocalDateTime;
import java.util.UUID;

public record CommentResponse(
        UUID id,
        String content,
        String authorName,
        LocalDateTime createdAt
) {
}
