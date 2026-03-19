package com.upvote.api.repository;

import com.upvote.api.domain.FeedbackGroup;
import com.upvote.api.domain.FeedbackGroupCategory;
import com.upvote.api.domain.FeedbackGroupStatus;
import jakarta.persistence.LockModeType;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface FeedbackGroupRepository extends JpaRepository<FeedbackGroup, UUID> {

    List<FeedbackGroup> findByCanalIdOrderByVoteCountDesc(UUID canalId);

    List<FeedbackGroup> findByCanalIdAndStatusOrderByVoteCountDesc(UUID canalId, FeedbackGroupStatus status);

    List<FeedbackGroup> findByCanalIdAndCategoryOrderByVoteCountDesc(UUID canalId, FeedbackGroupCategory category);

    List<FeedbackGroup> findByCanalIdAndStatusAndCategoryOrderByVoteCountDesc(UUID canalId, FeedbackGroupStatus status, FeedbackGroupCategory category);

    /**
     * Finds feedback groups similar to the given text using PostgreSQL trigram similarity (pg_trgm).
     * Requires the pg_trgm extension and GIN indexes on title and summary (see V8 migration).
     *
     * @param canalId   the channel to search within
     * @param text      the synthesized feedback text to compare against
     * @param threshold minimum similarity score (0.0–1.0); recommended value: 0.45
     * @return groups ordered by similarity score descending, limited to 5 results
     */
    @Query(value = """
            SELECT fg.*
            FROM feedback_groups fg
            WHERE fg.canal_id = :canalId
              AND similarity(fg.title || ' ' || COALESCE(fg.summary, ''), :text) > :threshold
            ORDER BY similarity(fg.title || ' ' || COALESCE(fg.summary, ''), :text) DESC
            LIMIT 5
            """, nativeQuery = true)
    List<FeedbackGroup> findSimilarGroups(@Param("canalId") UUID canalId,
                                          @Param("text") String text,
                                          @Param("threshold") double threshold);

    /**
     * Fetches a feedback group by ID with a pessimistic write lock (SELECT FOR UPDATE).
     * Use this before incrementing voteCount to prevent race conditions under concurrent submissions.
     *
     * @param id the feedback group ID
     * @return the locked group, or empty if not found
     */
    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("SELECT fg FROM FeedbackGroup fg WHERE fg.id = :id")
    Optional<FeedbackGroup> findByIdForUpdate(@Param("id") UUID id);
}
