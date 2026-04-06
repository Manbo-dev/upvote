package com.upvote.api.dto;

import java.util.UUID;

public record PublicBoardGroupResponse(
        UUID id,
        String title,
        String summary,
        String status,
        String category,
        int voteCount
) {
}
