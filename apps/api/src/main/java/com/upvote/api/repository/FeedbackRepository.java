package com.upvote.api.repository;

import com.upvote.api.domain.Feedback;
import com.upvote.api.domain.FeedbackStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

public interface FeedbackRepository extends JpaRepository<Feedback, UUID> {

    @Query("SELECT COUNT(f) FROM Feedback f WHERE f.canal.user.id = :userId AND f.createdAt >= :since")
    long countByUserIdAndCreatedAtAfter(@Param("userId") UUID userId, @Param("since") LocalDateTime since);

    List<Feedback> findByCanalId(UUID canalId);

    List<Feedback> findByFeedbackGroupId(UUID feedbackGroupId);

    List<Feedback> findTop50ByFeedbackGroupIdOrderByCreatedAtDesc(UUID feedbackGroupId);

    List<Feedback> findByStatus(FeedbackStatus status);

    @Modifying
    @Query("DELETE FROM Feedback f WHERE f.canal.id = :canalId")
    void deleteByCanalId(@Param("canalId") UUID canalId);
}
