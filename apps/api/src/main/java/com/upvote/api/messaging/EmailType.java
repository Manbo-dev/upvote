package com.upvote.api.messaging;

/**
 * Discriminator for transactional email messages.
 * Add new values here when new email types are introduced;
 * implement handling in EmailConsumer and EmailService.
 */
public enum EmailType {
    WELCOME,
    SUBSCRIPTION_ACTIVATED,
    SUBSCRIPTION_UPDATED,
    SUBSCRIPTION_CANCELED,
    SUBSCRIPTION_PAYMENT_FAILED,
    MONTHLY_DIGEST,
    TEAM_INVITE,
    TEAM_INVITE_ACCEPTED
}
