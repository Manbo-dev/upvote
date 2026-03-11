package com.upvote.api.controller;

import com.upvote.api.dto.*;
import com.upvote.api.repository.UserRepository;
import com.upvote.api.service.SuggestionService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

/**
 * Controller para sugestões e votos
 */
@RestController
@RequiredArgsConstructor
public class SuggestionController {

    private final SuggestionService suggestionService;
    private final UserRepository userRepository;

    /**
     * Lista sugestões de um produto (público, mas verifica auth para votedByCurrentUser)
     */
    @GetMapping("/api/products/{slug}/suggestions")
    public ResponseEntity<ApiResponse<List<SuggestionResponse>>> getSuggestions(
            @PathVariable String slug,
            @AuthenticationPrincipal UserDetails userDetails) {
        UUID currentUserId = null;
        if (userDetails != null) {
            currentUserId = userRepository.findByEmail(userDetails.getUsername())
                    .map(u -> u.getId()).orElse(null);
        }
        List<SuggestionResponse> suggestions = suggestionService.getSuggestionsByProduct(slug, currentUserId);
        return ResponseEntity.ok(ApiResponse.ok(suggestions));
    }

    /**
     * Cria uma nova sugestão (requer autenticação)
     */
    @PostMapping("/api/products/{slug}/suggestions")
    public ResponseEntity<ApiResponse<SuggestionResponse>> createSuggestion(
            @PathVariable String slug,
            @Valid @RequestBody SuggestionRequest request,
            @AuthenticationPrincipal UserDetails userDetails) {
        var user = userRepository.findByEmail(userDetails.getUsername())
                .orElseThrow(() -> new IllegalStateException("Usuário não encontrado"));
        SuggestionResponse suggestion = suggestionService.createSuggestion(slug, request, user.getId());
        return ResponseEntity.ok(ApiResponse.ok(suggestion, "Sugestão criada com sucesso"));
    }

    /**
     * Vota ou desvota em uma sugestão (toggle)
     */
    @PostMapping("/api/suggestions/{id}/vote")
    public ResponseEntity<ApiResponse<VoteResponse>> vote(
            @PathVariable UUID id,
            @AuthenticationPrincipal UserDetails userDetails) {
        var user = userRepository.findByEmail(userDetails.getUsername())
                .orElseThrow(() -> new IllegalStateException("Usuário não encontrado"));
        VoteResponse response = suggestionService.vote(id, user.getId());
        return ResponseEntity.ok(ApiResponse.ok(response));
    }

    /**
     * Altera o status de uma sugestão (apenas owner do produto)
     */
    @PatchMapping("/api/suggestions/{id}/status")
    public ResponseEntity<ApiResponse<SuggestionResponse>> updateStatus(
            @PathVariable UUID id,
            @Valid @RequestBody StatusUpdateRequest request,
            @AuthenticationPrincipal UserDetails userDetails) {
        var user = userRepository.findByEmail(userDetails.getUsername())
                .orElseThrow(() -> new IllegalStateException("Usuário não encontrado"));
        SuggestionResponse suggestion = suggestionService.updateStatus(id, request.status(), user.getId());
        return ResponseEntity.ok(ApiResponse.ok(suggestion));
    }
}
