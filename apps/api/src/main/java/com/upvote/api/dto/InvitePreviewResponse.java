package com.upvote.api.dto;

public record InvitePreviewResponse(
        String ownerName,
        String ownerAvatar,
        String invitedEmail,
        boolean expired,
        boolean alreadyAccepted
) {
}
