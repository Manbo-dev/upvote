package com.upvote.api.ai;

/**
 * Contexto da página capturado automaticamente pelo widget
 */
public record PageContext(
        String pageUrl,
        String pageTitle,
        String triggerType,
        String lastInteraction,
        String deviceType
) {}
