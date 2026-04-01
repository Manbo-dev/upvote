package com.upvote.api.dto;

/**
 * Internal DTO for the validated claims from an Apple ID token.
 * Not exposed to API consumers.
 *
 * Note: email may be null on subsequent sign-ins — Apple only sends it on the first authorization.
 * The sub (Apple user ID) is stable and used as the primary identifier.
 */
public record AppleTokenInfo(
        String sub,
        String email,
        String aud,
        boolean emailVerified
) {}
