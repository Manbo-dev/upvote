package com.upvote.api.ai;

import com.upvote.api.domain.FeedbackGroup;

import java.util.List;

/**
 * Interface para integração com IA — abstração injetável que permite
 * trocar o fornecedor (OpenAI, Anthropic, etc.) sem alterar os consumidores
 */
public interface AiService {

    /**
     * Sintetiza o comentário do usuário em uma frase clara
     */
    String synthesizeFeedback(String rawMessage, PageContext context);

    /**
     * Busca feedbacks similares e retorna score de confiança
     */
    SimilarityResult findSimilarFeedback(String synthesizedMessage, List<FeedbackGroup> existingGroups);

    /**
     * Gera uma pergunta de follow-up quando a confiança é baixa
     */
    String generateFollowUpQuestion(String rawMessage, PageContext context);

    /**
     * Gera título e resumo para um novo grupo de feedback
     */
    GroupSuggestion suggestGroup(String synthesizedMessage, PageContext context);
}
