package com.upvote.api.service;

import com.upvote.api.domain.*;
import com.upvote.api.dto.ExternalIssueResponse;
import com.upvote.api.dto.IntegrationResponse;
import com.upvote.api.exception.BusinessException;
import com.upvote.api.exception.ResourceNotFoundException;
import com.upvote.api.repository.ExternalIssueRepository;
import com.upvote.api.repository.FeedbackGroupRepository;
import com.upvote.api.repository.IntegrationRepository;
import com.upvote.api.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;
import java.util.UUID;

/**
 * Orchestrates integration CRUD, OAuth flows, and push-to-external operations.
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class IntegrationService {

    private final IntegrationRepository integrationRepository;
    private final ExternalIssueRepository externalIssueRepository;
    private final FeedbackGroupRepository feedbackGroupRepository;
    private final UserRepository userRepository;
    private final JiraIntegrationService jiraService;
    private final ClickUpIntegrationService clickUpService;

    // ── List / Get ──────────────────────────────────────────────────────────

    public List<IntegrationResponse> getIntegrations(UUID userId) {
        return integrationRepository.findByUserId(userId).stream()
                .map(this::toResponse)
                .toList();
    }

    public List<ExternalIssueResponse> getExternalIssues(UUID feedbackGroupId) {
        return externalIssueRepository.findByFeedbackGroupId(feedbackGroupId).stream()
                .map(this::toExternalIssueResponse)
                .toList();
    }

    /**
     * Batch-fetches external issues for multiple feedback groups (used by the dashboard list endpoint).
     */
    public Map<UUID, List<ExternalIssueResponse>> getExternalIssuesForGroups(List<UUID> groupIds) {
        if (groupIds.isEmpty()) return Map.of();
        List<ExternalIssue> all = externalIssueRepository.findByFeedbackGroupIdIn(groupIds);
        return all.stream()
                .collect(java.util.stream.Collectors.groupingBy(
                        ei -> ei.getFeedbackGroup().getId(),
                        java.util.stream.Collectors.mapping(this::toExternalIssueResponse, java.util.stream.Collectors.toList())
                ));
    }

    // ── OAuth: Jira ─────────────────────────────────────────────────────────

    public String getJiraAuthorizationUrl(UUID userId) {
        return jiraService.buildAuthorizationUrl(userId.toString());
    }

    @Transactional
    public IntegrationResponse completeJiraOAuth(String code, String state) {
        UUID userId = UUID.fromString(state);
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));

        // Exchange code for tokens
        Map<String, Object> tokens = jiraService.exchangeCodeForTokens(code);
        String accessToken = (String) tokens.get("accessToken");
        String refreshToken = (String) tokens.get("refreshToken");
        int expiresIn = (int) tokens.get("expiresIn");

        // Get Jira cloud resource info
        Map<String, String> resources = jiraService.getAccessibleResources(accessToken);

        // Upsert integration
        Integration integration = integrationRepository
                .findByUserIdAndProvider(userId, IntegrationProvider.JIRA)
                .orElse(Integration.builder()
                        .user(user)
                        .provider(IntegrationProvider.JIRA)
                        .build());

        integration.setAccessToken(accessToken);
        integration.setRefreshToken(refreshToken);
        integration.setTokenExpiry(LocalDateTime.now().plusSeconds(expiresIn));
        integration.setCloudId(resources.get("cloudId"));
        integration.setSiteUrl(resources.get("siteUrl"));

        integrationRepository.save(integration);
        log.info("[INTEGRATION] Jira OAuth completed: userId={}, site={}", userId, resources.get("siteName"));

        return toResponse(integration);
    }

    // ── OAuth: ClickUp ──────────────────────────────────────────────────────

    public String getClickUpAuthorizationUrl(UUID userId) {
        return clickUpService.buildAuthorizationUrl(userId.toString());
    }

    @Transactional
    public IntegrationResponse completeClickUpOAuth(String code, String state) {
        UUID userId = UUID.fromString(state);
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));

        // Exchange code for token (ClickUp tokens don't expire)
        Map<String, Object> tokens = clickUpService.exchangeCodeForTokens(code);
        String accessToken = (String) tokens.get("accessToken");

        // Get workspace info
        Map<String, String> teamInfo = clickUpService.getTeamInfo(accessToken);

        // Upsert integration
        Integration integration = integrationRepository
                .findByUserIdAndProvider(userId, IntegrationProvider.CLICKUP)
                .orElse(Integration.builder()
                        .user(user)
                        .provider(IntegrationProvider.CLICKUP)
                        .build());

        integration.setAccessToken(accessToken);
        integration.setTeamId(teamInfo.get("teamId"));
        integration.setSiteUrl("https://app.clickup.com/" + teamInfo.get("teamId"));

        integrationRepository.save(integration);
        log.info("[INTEGRATION] ClickUp OAuth completed: userId={}, team={}", userId, teamInfo.get("teamName"));

        return toResponse(integration);
    }

    // ── Disconnect ──────────────────────────────────────────────────────────

    @Transactional
    public void disconnect(UUID userId, UUID integrationId) {
        Integration integration = integrationRepository.findById(integrationId)
                .orElseThrow(() -> new ResourceNotFoundException("Integration not found"));

        if (!integration.getUser().getId().equals(userId)) {
            throw new BusinessException("Integration does not belong to this user");
        }

        integrationRepository.delete(integration);
        log.info("[INTEGRATION] Disconnected: userId={}, provider={}", userId, integration.getProvider());
    }

    // ── List projects / lists ───────────────────────────────────────────────

    @Transactional
    public List<Map<String, String>> listProjects(UUID userId, UUID integrationId) {
        Integration integration = getIntegrationForUser(userId, integrationId);

        return switch (integration.getProvider()) {
            case JIRA -> jiraService.listProjects(integration);
            case CLICKUP -> clickUpService.listLists(integration);
        };
    }

    // ── Push to external ────────────────────────────────────────────────────

    @Transactional
    public ExternalIssueResponse pushToExternal(UUID userId, UUID feedbackGroupId,
                                                 UUID integrationId, String projectKey,
                                                 String issueType, String listId) {
        Integration integration = getIntegrationForUser(userId, integrationId);

        FeedbackGroup group = feedbackGroupRepository.findById(feedbackGroupId)
                .orElseThrow(() -> new ResourceNotFoundException("Feedback group not found"));

        // Check if already linked to this provider
        externalIssueRepository.findByFeedbackGroupIdAndProvider(feedbackGroupId, integration.getProvider())
                .ifPresent(existing -> {
                    throw new BusinessException("This feedback group is already linked to " + integration.getProvider());
                });

        String description = buildDescription(group);

        ExternalIssue externalIssue;

        switch (integration.getProvider()) {
            case JIRA -> {
                if (projectKey == null || projectKey.isBlank()) {
                    throw new BusinessException("Project key is required for Jira");
                }
                Map<String, String> result = jiraService.createIssue(
                        integration, projectKey, issueType, group.getTitle(), description);
                externalIssue = ExternalIssue.builder()
                        .feedbackGroup(group)
                        .integration(integration)
                        .externalId(result.get("issueKey"))
                        .externalUrl(result.get("issueUrl"))
                        .externalStatus("To Do")
                        .provider(IntegrationProvider.JIRA)
                        .build();
                log.info("[INTEGRATION] Pushed to Jira: groupId={}, issueKey={}", feedbackGroupId, result.get("issueKey"));
            }
            case CLICKUP -> {
                if (listId == null || listId.isBlank()) {
                    throw new BusinessException("List ID is required for ClickUp");
                }
                Map<String, String> result = clickUpService.createTask(
                        integration, listId, group.getTitle(), description);
                externalIssue = ExternalIssue.builder()
                        .feedbackGroup(group)
                        .integration(integration)
                        .externalId(result.get("taskId"))
                        .externalUrl(result.get("taskUrl"))
                        .externalStatus("Open")
                        .provider(IntegrationProvider.CLICKUP)
                        .build();
                log.info("[INTEGRATION] Pushed to ClickUp: groupId={}, taskId={}", feedbackGroupId, result.get("taskId"));
            }
            default -> throw new BusinessException("Unsupported provider: " + integration.getProvider());
        }

        externalIssueRepository.save(externalIssue);
        return toExternalIssueResponse(externalIssue);
    }

    // ── Unlink ──────────────────────────────────────────────────────────────

    @Transactional
    public void unlinkExternalIssue(UUID userId, UUID externalIssueId) {
        ExternalIssue issue = externalIssueRepository.findById(externalIssueId)
                .orElseThrow(() -> new ResourceNotFoundException("External issue not found"));

        if (!issue.getIntegration().getUser().getId().equals(userId)) {
            throw new BusinessException("External issue does not belong to this user");
        }

        externalIssueRepository.delete(issue);
        log.info("[INTEGRATION] Unlinked external issue: id={}, externalId={}", externalIssueId, issue.getExternalId());
    }

    // ── Webhook processing ──────────────────────────────────────────────────

    @Transactional
    public void processJiraWebhook(String issueKey, String newStatus) {
        externalIssueRepository.findByExternalIdAndProvider(issueKey, IntegrationProvider.JIRA)
                .ifPresent(externalIssue -> {
                    externalIssue.setExternalStatus(newStatus);
                    FeedbackGroupStatus mappedStatus = mapJiraStatus(newStatus);
                    if (mappedStatus != null) {
                        FeedbackGroup group = externalIssue.getFeedbackGroup();
                        FeedbackGroupStatus oldStatus = group.getStatus();
                        if (oldStatus != mappedStatus
                                && oldStatus != FeedbackGroupStatus.ARCHIVED
                                && oldStatus != FeedbackGroupStatus.CLOSED) {
                            group.setStatus(mappedStatus);
                            feedbackGroupRepository.save(group);
                            log.info("[INTEGRATION] Jira webhook updated status: issueKey={}, {} → {}",
                                    issueKey, oldStatus, mappedStatus);
                        }
                    }
                    externalIssueRepository.save(externalIssue);
                });
    }

    @Transactional
    public void processClickUpWebhook(String taskId, String newStatus) {
        externalIssueRepository.findByExternalIdAndProvider(taskId, IntegrationProvider.CLICKUP)
                .ifPresent(externalIssue -> {
                    externalIssue.setExternalStatus(newStatus);
                    FeedbackGroupStatus mappedStatus = mapClickUpStatus(newStatus);
                    if (mappedStatus != null) {
                        FeedbackGroup group = externalIssue.getFeedbackGroup();
                        FeedbackGroupStatus oldStatus = group.getStatus();
                        if (oldStatus != mappedStatus
                                && oldStatus != FeedbackGroupStatus.ARCHIVED
                                && oldStatus != FeedbackGroupStatus.CLOSED) {
                            group.setStatus(mappedStatus);
                            feedbackGroupRepository.save(group);
                            log.info("[INTEGRATION] ClickUp webhook updated status: taskId={}, {} → {}",
                                    taskId, oldStatus, mappedStatus);
                        }
                    }
                    externalIssueRepository.save(externalIssue);
                });
    }

    // ── Private helpers ─────────────────────────────────────────────────────

    private Integration getIntegrationForUser(UUID userId, UUID integrationId) {
        Integration integration = integrationRepository.findById(integrationId)
                .orElseThrow(() -> new ResourceNotFoundException("Integration not found"));
        if (!integration.getUser().getId().equals(userId)) {
            throw new BusinessException("Integration does not belong to this user");
        }
        return integration;
    }

    private String buildDescription(FeedbackGroup group) {
        StringBuilder sb = new StringBuilder();
        sb.append(group.getSummary() != null ? group.getSummary() : group.getTitle());
        sb.append("\n\n");
        sb.append("Votes: ").append(group.getVoteCount()).append("\n");
        sb.append("Category: ").append(group.getCategory().name()).append("\n");
        sb.append("Status: ").append(group.getStatus().name()).append("\n");
        sb.append("\n--- Synced from Upvote ---");
        return sb.toString();
    }

    private FeedbackGroupStatus mapJiraStatus(String jiraStatus) {
        if (jiraStatus == null) return null;
        return switch (jiraStatus.toLowerCase()) {
            case "to do", "backlog", "open" -> FeedbackGroupStatus.OPEN;
            case "selected for development", "planned" -> FeedbackGroupStatus.PLANNED;
            case "in progress", "in review" -> FeedbackGroupStatus.IN_PROGRESS;
            case "done", "closed", "resolved" -> FeedbackGroupStatus.DONE;
            default -> {
                log.debug("[INTEGRATION] Unmapped Jira status: {}", jiraStatus);
                yield null;
            }
        };
    }

    private FeedbackGroupStatus mapClickUpStatus(String clickUpStatus) {
        if (clickUpStatus == null) return null;
        return switch (clickUpStatus.toLowerCase()) {
            case "open", "to do" -> FeedbackGroupStatus.OPEN;
            case "planned" -> FeedbackGroupStatus.PLANNED;
            case "in progress" -> FeedbackGroupStatus.IN_PROGRESS;
            case "complete", "done", "closed" -> FeedbackGroupStatus.DONE;
            default -> {
                log.debug("[INTEGRATION] Unmapped ClickUp status: {}", clickUpStatus);
                yield null;
            }
        };
    }

    private IntegrationResponse toResponse(Integration integration) {
        return new IntegrationResponse(
                integration.getId(),
                integration.getProvider().name(),
                integration.getSiteUrl(),
                integration.getCreatedAt()
        );
    }

    private ExternalIssueResponse toExternalIssueResponse(ExternalIssue issue) {
        return new ExternalIssueResponse(
                issue.getId(),
                issue.getProvider().name(),
                issue.getExternalId(),
                issue.getExternalUrl(),
                issue.getExternalStatus()
        );
    }
}
