package com.upvote.api.dto;

import java.time.LocalDateTime;

public record SubscriptionResponse(
        String plano,
        String stripeStatus,
        LocalDateTime currentPeriodEnd,
        int limiteCanais,
        long canaisAtivos,
        int limiteSugestoesMes,
        long sugestoesUsadasMes,
        boolean widgetHabilitado,
        boolean widgetCustomizationEnabled,
        boolean integrationsEnabled
) {
}
