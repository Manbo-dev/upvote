package com.upvote.api.dto;

import java.util.UUID;

/**
 * Resposta após submissão de feedback pelo widget
 */
public record FeedbackSubmitResponse(
        UUID feedbackId,
        String followUpQuestion,
        boolean grouped
) {}
