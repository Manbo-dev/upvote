package com.upvote.api.repository;

import com.upvote.api.domain.Canal;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface CanalRepository extends JpaRepository<Canal, UUID> {
    List<Canal> findByOrganizationId(UUID organizationId);

    Optional<Canal> findBySlug(String slug);

    Optional<Canal> findByApiKey(String apiKey);
}
