package com.upvote.api.dto;

import java.time.LocalDateTime;
import java.util.UUID;

public record TeamMemberResponse(
        UUID id,
        String invitedEmail,
        String memberName,
        String memberAvatar,
        String role,
        String status,
        LocalDateTime invitedAt,
        LocalDateTime acceptedAt
) {
}
