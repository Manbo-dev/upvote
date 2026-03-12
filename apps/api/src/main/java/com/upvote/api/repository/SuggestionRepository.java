package com.upvote.api.repository;

import com.upvote.api.domain.Suggestion;
import com.upvote.api.domain.SuggestionStatus;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.UUID;

public interface SuggestionRepository extends JpaRepository<Suggestion, UUID> {
    List<Suggestion> findByProductIdOrderByVoteCountDesc(UUID productId);

    List<Suggestion> findByProductIdAndStatusOrderByVoteCountDesc(UUID productId, SuggestionStatus status);
}
