package com.upvote.api.ai;

import com.upvote.api.domain.FeedbackGroup;
import org.springframework.context.annotation.Primary;
import org.springframework.stereotype.Service;

import java.util.Arrays;
import java.util.List;
import java.util.Set;
import java.util.stream.Collectors;

/**
 * Implementação stub do AiService que usa correspondência simples de palavras.
 * Serve como placeholder até a integração com um provedor de IA real.
 * Anotado com @Primary para ser usado por padrão quando nenhum provedor está configurado.
 */
@Service
@Primary
public class StubAiService implements AiService {

    private static final double MATCH_THRESHOLD = 0.5;

    @Override
    public String synthesizeFeedback(String rawMessage, PageContext context) {
        // Retorna a mensagem limpa e truncada
        if (rawMessage == null) {
            return "";
        }
        return rawMessage.trim();
    }

    @Override
    public SimilarityResult findSimilarFeedback(String synthesizedMessage, List<FeedbackGroup> existingGroups) {
        if (existingGroups == null || existingGroups.isEmpty() || synthesizedMessage == null) {
            return new SimilarityResult(null, 0.0, false);
        }

        // Extrai palavras da mensagem sintetizada (ignora palavras curtas)
        Set<String> messageWords = extractWords(synthesizedMessage);

        FeedbackGroup bestMatch = null;
        double bestConfidence = 0.0;

        for (FeedbackGroup group : existingGroups) {
            Set<String> groupWords = extractWords(group.getTitle());

            if (messageWords.isEmpty() || groupWords.isEmpty()) {
                continue;
            }

            // Calcula sobreposição de palavras (Jaccard simplificado)
            long commonWords = messageWords.stream()
                    .filter(groupWords::contains)
                    .count();

            double confidence = (double) commonWords / Math.max(messageWords.size(), groupWords.size());

            if (confidence > bestConfidence) {
                bestConfidence = confidence;
                bestMatch = group;
            }
        }

        if (bestMatch != null && bestConfidence >= MATCH_THRESHOLD) {
            return new SimilarityResult(bestMatch.getId(), bestConfidence, true);
        }

        // Confiança baixa mas encontrou algum candidato
        if (bestMatch != null && bestConfidence > 0.0) {
            return new SimilarityResult(bestMatch.getId(), bestConfidence, false);
        }

        return new SimilarityResult(null, 0.0, false);
    }

    @Override
    public String generateFollowUpQuestion(String rawMessage, PageContext context) {
        return "Pode descrever com mais detalhes o que aconteceu?";
    }

    @Override
    public GroupSuggestion suggestGroup(String synthesizedMessage, PageContext context) {
        String title = synthesizedMessage;
        if (title != null && title.length() > 80) {
            title = title.substring(0, 80) + "...";
        }
        return new GroupSuggestion(title, synthesizedMessage);
    }

    /**
     * Extrai palavras significativas de um texto (ignora palavras com menos de 3 caracteres)
     */
    private Set<String> extractWords(String text) {
        if (text == null) {
            return Set.of();
        }
        return Arrays.stream(text.toLowerCase().split("\\s+"))
                .filter(w -> w.length() >= 3)
                .collect(Collectors.toSet());
    }
}
