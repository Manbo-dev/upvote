package com.upvote.api.service;

import com.upvote.api.domain.*;
import com.upvote.api.dto.SuggestionRequest;
import com.upvote.api.dto.SuggestionResponse;
import com.upvote.api.dto.VoteResponse;
import com.upvote.api.exception.BusinessException;
import com.upvote.api.repository.*;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.time.temporal.TemporalAdjusters;
import java.util.List;
import java.util.UUID;

/**
 * Serviço para gerenciamento de sugestões e votos
 */
@Service
@RequiredArgsConstructor
public class SuggestionService {

    private final SuggestionRepository suggestionRepository;
    private final CanalRepository canalRepository;
    private final UserRepository userRepository;
    private final VoteRepository voteRepository;
    private final SubscriptionRepository subscriptionRepository;

    /**
     * Lista sugestões de um canal, indicando se o usuário atual votou
     */
    public List<SuggestionResponse> getSuggestionsByCanal(String slug, UUID currentUserId) {
        Canal canal = canalRepository.findBySlug(slug)
                .orElseThrow(() -> new IllegalArgumentException("Canal não encontrado"));

        List<Suggestion> suggestions = suggestionRepository.findByCanalIdOrderByVoteCountDesc(canal.getId());

        return suggestions.stream()
                .map(s -> toResponse(s, currentUserId))
                .toList();
    }

    /**
     * Cria uma nova sugestão para um canal
     */
    @Transactional
    public SuggestionResponse createSuggestion(String canalSlug, SuggestionRequest request, UUID userId) {
        Canal canal = canalRepository.findBySlug(canalSlug)
                .orElseThrow(() -> new IllegalArgumentException("Canal não encontrado"));

        // Verifica limite de sugestões do plano no mês atual
        UUID ownerId = canal.getUser().getId();
        Subscription subscription = subscriptionRepository.findByUserId(ownerId)
                .orElseThrow(() -> new IllegalStateException("Assinatura não encontrada"));
        int limite = subscription.getPlano().getLimiteSugestoesMes();
        if (limite != Integer.MAX_VALUE) {
            LocalDateTime inicioMes = LocalDateTime.now()
                    .with(TemporalAdjusters.firstDayOfMonth())
                    .withHour(0).withMinute(0).withSecond(0).withNano(0);
            long sugestoesMes = suggestionRepository.countByUserIdAndMesAtual(ownerId, inicioMes);
            if (sugestoesMes >= limite) {
                throw new BusinessException("Limite de sugestões do plano " + subscription.getPlano().name()
                        + " atingido (" + limite + "/mês). Faça upgrade para continuar.");
            }
        }

        User author = userRepository.findById(userId)
                .orElseThrow(() -> new IllegalArgumentException("Usuário não encontrado"));

        Suggestion suggestion = Suggestion.builder()
                .title(request.title())
                .description(request.description())
                .canal(canal)
                .author(author)
                .build();
        suggestion = suggestionRepository.save(suggestion);

        return toResponse(suggestion, userId);
    }

    /**
     * Altera o status de uma sugestão (apenas o owner do canal pode alterar)
     */
    @Transactional
    public SuggestionResponse updateStatus(UUID suggestionId, SuggestionStatus status, UUID userId) {
        Suggestion suggestion = suggestionRepository.findById(suggestionId)
                .orElseThrow(() -> new IllegalArgumentException("Sugestão não encontrada"));

        // Verifica se o usuário é owner do canal
        if (!suggestion.getCanal().getUser().getId().equals(userId)) {
            throw new SecurityException("Apenas o owner pode alterar o status");
        }

        suggestion.setStatus(status);
        suggestion = suggestionRepository.save(suggestion);

        return toResponse(suggestion, userId);
    }

    /**
     * Vota ou desvota em uma sugestão (toggle)
     */
    @Transactional
    public VoteResponse vote(UUID suggestionId, UUID userId) {
        Suggestion suggestion = suggestionRepository.findById(suggestionId)
                .orElseThrow(() -> new IllegalArgumentException("Sugestão não encontrada"));
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new IllegalArgumentException("Usuário não encontrado"));

        var existingVote = voteRepository.findBySuggestionIdAndUserId(suggestionId, userId);

        boolean voted;
        if (existingVote.isPresent()) {
            // Remove o voto
            voteRepository.delete(existingVote.get());
            suggestion.setVoteCount(suggestion.getVoteCount() - 1);
            voted = false;
        } else {
            // Adiciona o voto
            Vote vote = Vote.builder()
                    .suggestion(suggestion)
                    .user(user)
                    .build();
            voteRepository.save(vote);
            suggestion.setVoteCount(suggestion.getVoteCount() + 1);
            voted = true;
        }

        suggestionRepository.save(suggestion);
        return new VoteResponse(voted, suggestion.getVoteCount());
    }

    private SuggestionResponse toResponse(Suggestion suggestion, UUID currentUserId) {
        boolean votedByCurrentUser = currentUserId != null &&
                voteRepository.existsBySuggestionIdAndUserId(suggestion.getId(), currentUserId);

        return new SuggestionResponse(
                suggestion.getId(),
                suggestion.getTitle(),
                suggestion.getDescription(),
                suggestion.getStatus(),
                suggestion.getVoteCount(),
                suggestion.getAuthor().getName(),
                suggestion.getCreatedAt(),
                votedByCurrentUser
        );
    }
}
