package com.upvote.api.repository;

import com.upvote.api.domain.Comment;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.UUID;

public interface CommentRepository extends JpaRepository<Comment, UUID> {
    List<Comment> findBySuggestionIdOrderByCreatedAtAsc(UUID suggestionId);

    @Modifying
    @Query("DELETE FROM Comment c WHERE c.suggestion.canal.id = :canalId")
    void deleteBySuggestionCanalId(@Param("canalId") UUID canalId);
}
