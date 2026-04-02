package com.upvote.api.messaging;

import java.util.UUID;

/**
 * Minimal payload published to the email.send queue.
 * The consumer loads full user data from the database — keeps the message small
 * and avoids stale-data issues.
 */
public record EmailMessage(EmailType type, UUID userId) {}
