package com.upvote.api.domain;

import lombok.Getter;
import lombok.RequiredArgsConstructor;

/**
 * Available plans with their limits and feature flags
 */
@Getter
@RequiredArgsConstructor
public enum Plano {

    FREE    (1,                 20,                false, false, false, false),
    STARTER (3,                 500,               true,  false, true,  true),
    PRO     (20,                Integer.MAX_VALUE, true,  true,  true,  true),
    BUSINESS(Integer.MAX_VALUE, Integer.MAX_VALUE, true,  true,  true,  true);

    private final int     limiteCanais;
    private final int     limiteSugestoesMes;
    private final boolean widgetHabilitado;
    private final boolean widgetCustomizationEnabled;
    private final boolean integrationsEnabled;
    private final boolean publicBoardEnabled;
}
