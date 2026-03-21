package com.upvote.api.dto;

import com.upvote.api.domain.FeedbackGroupStatus;
import jakarta.validation.constraints.NotNull;

public record StatusUpdateRequest(
        @NotNull(message = "Status é obrigatório")
        FeedbackGroupStatus status
) {
}
