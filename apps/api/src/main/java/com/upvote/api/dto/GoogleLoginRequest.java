package com.upvote.api.dto;

import jakarta.validation.constraints.NotBlank;

/**
 * Request body for Google social login.
 * Contains the Google ID token obtained by the frontend via Google Identity Services.
 */
public record GoogleLoginRequest(
        @NotBlank(message = "ID token is required")
        String idToken
) {}
