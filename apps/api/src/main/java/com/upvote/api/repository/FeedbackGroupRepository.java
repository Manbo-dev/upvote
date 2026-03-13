package com.upvote.api.repository;

import com.upvote.api.domain.FeedbackGroup;
import com.upvote.api.domain.FeedbackGroupStatus;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.UUID;

public interface FeedbackGroupRepository extends JpaRepository<FeedbackGroup, UUID> {

    List<FeedbackGroup> findByProductIdOrderByVoteCountDesc(UUID productId);

    List<FeedbackGroup> findByProductIdAndStatusOrderByVoteCountDesc(UUID productId, FeedbackGroupStatus status);
}
