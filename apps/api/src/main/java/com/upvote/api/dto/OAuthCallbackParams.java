package com.upvote.api.dto;

/**
 * Parameters received from OAuth callback.
 */
public record OAuthCallbackParams(
        String code,
        String state
) {}
