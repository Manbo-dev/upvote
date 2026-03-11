package com.upvote.api.service;

import com.upvote.api.domain.*;
import com.upvote.api.dto.SuggestionRequest;
import com.upvote.api.dto.SuggestionResponse;
import com.upvote.api.dto.VoteResponse;
import com.upvote.api.repository.*;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.UUID;

/**
 * Serviço para gerenciamento de sugestões e votos
 */
@Service
@RequiredArgsConstructor
public class SuggestionService {

    private final SuggestionRepository suggestionRepository;
    private final ProductRepository productRepository;
    private final UserRepository userRepository;
    private final VoteRepository voteRepository;
    private final OrganizationRepository organizationRepository;

    /**
     * Lista sugestões de um produto, indicando se o usuário atual votou
     */
    public List<SuggestionResponse> getSuggestionsByProduct(String slug, UUID currentUserId) {
        Product product = productRepository.findBySlug(slug)
                .orElseThrow(() -> new IllegalArgumentException("Produto não encontrado"));

        List<Suggestion> suggestions = suggestionRepository.findByProductIdOrderByVoteCountDesc(product.getId());

        return suggestions.stream()
                .map(s -> toResponse(s, currentUserId))
                .toList();
    }

    /**
     * Cria uma nova sugestão para um produto
     */
    @Transactional
    public SuggestionResponse createSuggestion(String productSlug, SuggestionRequest request, UUID userId) {
        Product product = productRepository.findBySlug(productSlug)
                .orElseThrow(() -> new IllegalArgumentException("Produto não encontrado"));
        User author = userRepository.findById(userId)
                .orElseThrow(() -> new IllegalArgumentException("Usuário não encontrado"));

        Suggestion suggestion = Suggestion.builder()
                .title(request.title())
                .description(request.description())
                .product(product)
                .author(author)
                .build();
        suggestion = suggestionRepository.save(suggestion);

        return toResponse(suggestion, userId);
    }

    /**
     * Altera o status de uma sugestão (apenas o owner do produto pode alterar)
     */
    @Transactional
    public SuggestionResponse updateStatus(UUID suggestionId, SuggestionStatus status, UUID userId) {
        Suggestion suggestion = suggestionRepository.findById(suggestionId)
                .orElseThrow(() -> new IllegalArgumentException("Sugestão não encontrada"));

        // Verifica se o usuário é owner da organização do produto
        UUID orgId = suggestion.getProduct().getOrganization().getId();
        Organization org = organizationRepository.findById(orgId)
                .orElseThrow(() -> new IllegalStateException("Organização não encontrada"));

        if (!org.getOwner().getId().equals(userId)) {
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
