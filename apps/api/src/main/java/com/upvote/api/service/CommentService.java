package com.upvote.api.service;

import com.upvote.api.domain.Comment;
import com.upvote.api.domain.Suggestion;
import com.upvote.api.domain.User;
import com.upvote.api.dto.CommentRequest;
import com.upvote.api.dto.CommentResponse;
import com.upvote.api.repository.CommentRepository;
import com.upvote.api.repository.SuggestionRepository;
import com.upvote.api.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.UUID;

/**
 * Serviço para gerenciamento de comentários em sugestões
 */
@Service
@RequiredArgsConstructor
public class CommentService {

    private final CommentRepository commentRepository;
    private final SuggestionRepository suggestionRepository;
    private final UserRepository userRepository;

    /**
     * Lista comentários de uma sugestão ordenados por data
     */
    public List<CommentResponse> getComments(UUID suggestionId) {
        return commentRepository.findBySuggestionIdOrderByCreatedAtAsc(suggestionId)
                .stream()
                .map(this::toResponse)
                .toList();
    }

    /**
     * Adiciona um comentário a uma sugestão
     */
    @Transactional
    public CommentResponse addComment(UUID suggestionId, CommentRequest request, UUID userId) {
        Suggestion suggestion = suggestionRepository.findById(suggestionId)
                .orElseThrow(() -> new IllegalArgumentException("Sugestão não encontrada"));
        User author = userRepository.findById(userId)
                .orElseThrow(() -> new IllegalArgumentException("Usuário não encontrado"));

        Comment comment = Comment.builder()
                .suggestion(suggestion)
                .author(author)
                .content(request.content())
                .build();
        comment = commentRepository.save(comment);

        return toResponse(comment);
    }

    private CommentResponse toResponse(Comment comment) {
        return new CommentResponse(
                comment.getId(),
                comment.getContent(),
                comment.getAuthor().getName(),
                comment.getCreatedAt()
        );
    }
}
