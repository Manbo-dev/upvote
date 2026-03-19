package com.upvote.api.dto;

import java.util.UUID;

/**
 * Response returned after a widget feedback submission.
 */
public record FeedbackSubmitResponse(
        UUID feedbackId,
        boolean grouped
) {}
