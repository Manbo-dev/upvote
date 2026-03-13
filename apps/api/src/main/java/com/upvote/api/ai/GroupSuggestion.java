package com.upvote.api.ai;

/**
 * Sugestão de título e resumo para um novo grupo de feedback
 */
public record GroupSuggestion(
        String title,
        String summary
) {}
