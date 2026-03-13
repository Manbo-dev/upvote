package com.upvote.api.repository;

import com.upvote.api.domain.Feedback;
import com.upvote.api.domain.FeedbackStatus;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.UUID;

public interface FeedbackRepository extends JpaRepository<Feedback, UUID> {

    List<Feedback> findByProductId(UUID productId);

    List<Feedback> findByFeedbackGroupId(UUID feedbackGroupId);

    List<Feedback> findByStatus(FeedbackStatus status);
}
