package com.upvote.api.repository;

import com.upvote.api.domain.Integration;
import com.upvote.api.domain.IntegrationProvider;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface IntegrationRepository extends JpaRepository<Integration, UUID> {

    List<Integration> findByUserId(UUID userId);

    Optional<Integration> findByUserIdAndProvider(UUID userId, IntegrationProvider provider);
}
