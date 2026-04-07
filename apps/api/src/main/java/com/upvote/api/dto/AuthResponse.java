package com.upvote.api.dto;

public record AuthResponse(
        String token,
        String name,
        String email,
        String plano,
        String avatar,
        String memberRole,
        String workspaceName,
        String ownPlano
) {
}
