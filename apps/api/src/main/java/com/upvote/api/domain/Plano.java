package com.upvote.api.domain;

import lombok.Getter;
import lombok.RequiredArgsConstructor;

/**
 * Planos disponíveis no sistema com seus limites
 */
@Getter
@RequiredArgsConstructor
public enum Plano {

    FREE(1, 50, false),
    STARTER(3, Integer.MAX_VALUE, true),
    PRO(10, Integer.MAX_VALUE, true);

    private final int limiteCanais;
    private final int limiteSugestoesMes;
    private final boolean widgetHabilitado;
}
