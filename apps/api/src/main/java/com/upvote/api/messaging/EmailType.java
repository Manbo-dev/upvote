package com.upvote.api.messaging;

/**
 * Discriminator for transactional email messages.
 * Add new values here when new email types are introduced;
 * implement handling in EmailConsumer and EmailService.
 */
public enum EmailType {
    WELCOME
    // Future: SUBSCRIPTION_UPGRADED, PAYMENT_FAILED, SUBSCRIPTION_CANCELED, FEEDBACK_DIGEST
}
