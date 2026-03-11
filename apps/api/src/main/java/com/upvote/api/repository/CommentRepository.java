package com.upvote.api.repository;

import com.upvote.api.domain.Comment;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.UUID;

public interface CommentRepository extends JpaRepository<Comment, UUID> {
    List<Comment> findBySuggestionIdOrderByCreatedAtAsc(UUID suggestionId);
}
