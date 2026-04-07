package com.upvote.api.domain;

import lombok.Getter;
import lombok.RequiredArgsConstructor;

/**
 * Available plans with their limits and feature flags
 */
@Getter
@RequiredArgsConstructor
public enum Plano {

    FREE    (1,                 20,                false, false, false, false, 0,                 false),
    STARTER (3,                 500,               true,  false, true,  true,  3,                 false),
    PRO     (20,                Integer.MAX_VALUE, true,  true,  true,  true,  10,                false),
    BUSINESS(Integer.MAX_VALUE, Integer.MAX_VALUE, true,  true,  true,  true,  Integer.MAX_VALUE, true);

    private final int     limiteCanais;
    private final int     limiteSugestoesMes;
    private final boolean widgetHabilitado;
    private final boolean widgetCustomizationEnabled;
    private final boolean integrationsEnabled;
    private final boolean publicBoardEnabled;
    private final int     limiteMembrosTimes;
    private final boolean whiteLabelEnabled;
}
