package com.upvote.api.messaging;

import java.util.UUID;

/**
 * Message published to the feedback processing queue.
 *
 * <p>Only the feedbackId is sent — the consumer re-loads the full Feedback
 * from the DB, which avoids stale data and keeps the message payload small.
 */
public record FeedbackProcessingMessage(UUID feedbackId) {
}
