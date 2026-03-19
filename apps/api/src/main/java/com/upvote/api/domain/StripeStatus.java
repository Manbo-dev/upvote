package com.upvote.api.domain;

/**
 * Status da assinatura no Stripe
 */
public enum StripeStatus {
    ACTIVE,
    PAST_DUE,
    CANCELED,
    INCOMPLETE,
    INCOMPLETE_EXPIRED,
    PAUSED,
    TRIALING,
    UNPAID
}
