package com.upvote.api.controller;

import com.upvote.api.dto.*;
import com.upvote.api.repository.UserRepository;
import com.upvote.api.service.CommentService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

/**
 * Controller para comentários em sugestões
 */
@RestController
@RequiredArgsConstructor
public class CommentController {

    private final CommentService commentService;
    private final UserRepository userRepository;

    /**
     * Lista comentários de uma sugestão (público)
     */
    @GetMapping("/api/suggestions/{id}/comments")
    public ResponseEntity<ApiResponse<List<CommentResponse>>> getComments(@PathVariable UUID id) {
        List<CommentResponse> comments = commentService.getComments(id);
        return ResponseEntity.ok(ApiResponse.ok(comments));
    }

    /**
     * Adiciona um comentário a uma sugestão (requer autenticação)
     */
    @PostMapping("/api/suggestions/{id}/comments")
    public ResponseEntity<ApiResponse<CommentResponse>> addComment(
            @PathVariable UUID id,
            @Valid @RequestBody CommentRequest request,
            @AuthenticationPrincipal UserDetails userDetails) {
        var user = userRepository.findByEmail(userDetails.getUsername())
                .orElseThrow(() -> new IllegalStateException("Usuário não encontrado"));
        CommentResponse comment = commentService.addComment(id, request, user.getId());
        return ResponseEntity.ok(ApiResponse.ok(comment, "Comentário adicionado"));
    }
}
