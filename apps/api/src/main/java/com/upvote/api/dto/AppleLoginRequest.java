package com.upvote.api.dto;

import jakarta.validation.constraints.NotBlank;

/**
 * Request body for Apple Sign-In social login.
 * Contains the Apple ID token and optionally the user's name.
 *
 * Apple only sends the user's name on the first authorization — the frontend must
 * capture it from the JS callback's user object and forward it here.
 * On subsequent sign-ins, name will be null.
 */
public record AppleLoginRequest(
        @NotBlank(message = "ID token is required")
        String idToken,

        String name
) {}
