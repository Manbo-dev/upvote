package com.upvote.api.repository;

import com.upvote.api.domain.Suggestion;
import com.upvote.api.domain.SuggestionStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

public interface SuggestionRepository extends JpaRepository<Suggestion, UUID> {
    List<Suggestion> findByCanalIdOrderByVoteCountDesc(UUID canalId);

    List<Suggestion> findByCanalIdAndStatusOrderByVoteCountDesc(UUID canalId, SuggestionStatus status);

    @Query("SELECT COUNT(s) FROM Suggestion s WHERE s.canal.user.id = :userId AND s.createdAt >= :inicioMes")
    long countByUserIdAndMesAtual(@Param("userId") UUID userId, @Param("inicioMes") LocalDateTime inicioMes);

    @Modifying
    @Query("DELETE FROM Suggestion s WHERE s.canal.id = :canalId")
    void deleteByCanalId(@Param("canalId") UUID canalId);
}
