package com.upvote.api.dto;

public record AuthResponse(
        String token,
        String name,
        String email
) {
}
