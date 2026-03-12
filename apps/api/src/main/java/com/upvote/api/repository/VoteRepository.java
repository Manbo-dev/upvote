package com.upvote.api.repository;

import com.upvote.api.domain.Vote;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;
import java.util.UUID;

public interface VoteRepository extends JpaRepository<Vote, UUID> {
    Optional<Vote> findBySuggestionIdAndUserId(UUID suggestionId, UUID userId);

    boolean existsBySuggestionIdAndUserId(UUID suggestionId, UUID userId);

    long countBySuggestionId(UUID suggestionId);
}
