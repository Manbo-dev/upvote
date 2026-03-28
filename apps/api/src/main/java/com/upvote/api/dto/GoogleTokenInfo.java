package com.upvote.api.dto;

import com.fasterxml.jackson.annotation.JsonProperty;

/**
 * Internal DTO for the response from https://oauth2.googleapis.com/tokeninfo.
 * Not exposed to API consumers.
 */
public record GoogleTokenInfo(
        String sub,
        String email,
        String name,
        String aud,
        @JsonProperty("email_verified") String emailVerified
) {}
