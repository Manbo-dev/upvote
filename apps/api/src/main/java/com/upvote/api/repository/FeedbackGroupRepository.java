package com.upvote.api.repository;

import com.upvote.api.domain.FeedbackGroup;
import com.upvote.api.domain.FeedbackGroupCategory;
import com.upvote.api.domain.FeedbackGroupStatus;
import jakarta.persistence.LockModeType;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.data.jpa.repository.Modifying;
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
     * Finds feedback groups similar to the given text using a hybrid strategy:
     * <ul>
     *   <li><b>word_similarity</b> (pg_trgm): checks if the synthesized text matches any
     *       contiguous word sequence in the group title/summary — more effective than
     *       full-string similarity for sentences vs. short titles.</li>
     *   <li><b>Tag overlap</b>: matches groups that share at least 2 tags with the incoming
     *       feedback, catching semantic matches that trigrams miss (e.g. "notebook" vs "computador").</li>
     * </ul>
     *
     * Requires the pg_trgm extension and GIN indexes on title/summary (see V8 migration).
     *
     * @param canalId   the channel to search within
     * @param text      the synthesized feedback text to compare against
     * @param threshold minimum word_similarity score (0.0–1.0); recommended value: 0.25
     * @param tags      comma-separated tags from AI synthesis (e.g. "icone,desalinhado,computador")
     * @return groups ordered by word_similarity score descending, limited to 5 results
     */
    @Query(value = """
            SELECT fg.*
            FROM feedback_groups fg
            WHERE fg.canal_id = :canalId
              AND (
                word_similarity(:text, fg.title || ' ' || COALESCE(fg.summary, '')) > :threshold
                OR (
                  fg.tags IS NOT NULL
                  AND (
                    SELECT COUNT(*)
                    FROM (
                      SELECT unnest(string_to_array(fg.tags, ','))
                      INTERSECT
                      SELECT unnest(string_to_array(:tags, ','))
                    ) overlap
                  ) >= 2
                )
              )
            ORDER BY word_similarity(:text, fg.title || ' ' || COALESCE(fg.summary, '')) DESC
            LIMIT 5
            """, nativeQuery = true)
    List<FeedbackGroup> findSimilarGroups(@Param("canalId") UUID canalId,
                                          @Param("text") String text,
                                          @Param("threshold") double threshold,
                                          @Param("tags") String tags);

    /**
     * Debug query: returns the top 5 groups with both word_similarity and similarity scores
     * against the given text, regardless of threshold. Use only for diagnostic logging.
     */
    @Query(value = """
            SELECT fg.id, fg.title, fg.summary, fg.tags,
                   word_similarity(:text, fg.title || ' ' || COALESCE(fg.summary, '')) AS word_sim_score,
                   similarity(fg.title || ' ' || COALESCE(fg.summary, ''), :text) AS sim_score
            FROM feedback_groups fg
            WHERE fg.canal_id = :canalId
            ORDER BY word_sim_score DESC
            LIMIT 5
            """, nativeQuery = true)
    List<Object[]> findTopSimilarityScores(@Param("canalId") UUID canalId,
                                           @Param("text") String text);

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

    @Modifying
    @Query("DELETE FROM FeedbackGroup fg WHERE fg.canal.id = :canalId")
    void deleteByCanalId(@Param("canalId") UUID canalId);
}
