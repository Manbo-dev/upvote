package com.upvote.api.repository;

import com.upvote.api.domain.ExternalIssue;
import com.upvote.api.domain.IntegrationProvider;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface ExternalIssueRepository extends JpaRepository<ExternalIssue, UUID> {

    List<ExternalIssue> findByFeedbackGroupId(UUID feedbackGroupId);

    Optional<ExternalIssue> findByFeedbackGroupIdAndProvider(UUID feedbackGroupId, IntegrationProvider provider);

    Optional<ExternalIssue> findByExternalIdAndProvider(String externalId, IntegrationProvider provider);

    List<ExternalIssue> findByFeedbackGroupIdIn(List<UUID> feedbackGroupIds);
}
