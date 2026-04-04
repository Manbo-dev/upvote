package com.upvote.api.repository;

import com.upvote.api.domain.Canal;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface CanalRepository extends JpaRepository<Canal, UUID> {
    List<Canal> findByUserId(UUID userId);

    Optional<Canal> findBySlug(String slug);

    Optional<Canal> findByApiKey(String apiKey);

    long countByUserId(UUID userId);

    @Query("SELECT DISTINCT c.user.id FROM Canal c")
    List<UUID> findDistinctUserIds();
}
