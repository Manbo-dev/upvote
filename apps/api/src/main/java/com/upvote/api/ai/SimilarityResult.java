package com.upvote.api.ai;

import java.util.UUID;

/**
 * Resultado da busca por feedbacks similares
 */
public record SimilarityResult(
        UUID matchedGroupId,
        double confidence,
        boolean isMatch
) {}
