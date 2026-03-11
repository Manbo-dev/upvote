package com.upvote.api.repository;

import com.upvote.api.domain.Organization;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface OrganizationRepository extends JpaRepository<Organization, UUID> {
    List<Organization> findByOwnerId(UUID ownerId);
    Optional<Organization> findBySlug(String slug);
}
