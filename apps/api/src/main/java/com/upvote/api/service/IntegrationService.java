package com.upvote.api.service;

import com.upvote.api.domain.*;
import com.upvote.api.dto.ExternalIssueResponse;
import com.upvote.api.dto.IntegrationResponse;
import com.upvote.api.exception.BusinessException;
import com.upvote.api.exception.ResourceNotFoundException;
import com.upvote.api.repository.ExternalIssueRepository;
import com.upvote.api.repository.FeedbackGroupRepository;
import com.upvote.api.repository.FeedbackRepository;
import com.upvote.api.repository.IntegrationRepository;
import com.upvote.api.repository.SubscriptionRepository;
import com.upvote.api.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.*;
import java.util.stream.Collectors;

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
    private final FeedbackRepository feedbackRepository;
    private final UserRepository userRepository;
    private final SubscriptionRepository subscriptionRepository;
    private final JiraIntegrationService jiraService;
    private final ClickUpIntegrationService clickUpService;

    private static final int MAX_FEEDBACKS_FOR_DESCRIPTION = 50;
    private static final int MAX_RECENT_REPORTS = 20;
    private static final int MAX_INTERACTIONS = 5;
    private static final DateTimeFormatter DATE_FMT = DateTimeFormatter.ofPattern("yyyy-MM-dd");

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

    // ── Plan enforcement ────────────────────────────────────────────────────

    /**
     * Ensures the user's plan allows integrations (STARTER+).
     * FREE plan users cannot connect or use Jira/ClickUp integrations.
     */
    private void requireIntegrationAccess(UUID userId) {
        Subscription subscription = subscriptionRepository.findByUserId(userId)
                .orElseThrow(() -> new IllegalStateException("Assinatura não encontrada"));
        if (!subscription.getPlano().isIntegrationsEnabled()) {
            throw new BusinessException(
                    "Integrations with Jira and ClickUp require STARTER plan or above. Upgrade to access this feature.");
        }
    }

    // ── OAuth: Jira ─────────────────────────────────────────────────────────

    public String getJiraAuthorizationUrl(UUID userId) {
        requireIntegrationAccess(userId);
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
        requireIntegrationAccess(userId);
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

    // ── List issue types (Jira only) ────────────────────────────────────────

    @Transactional
    public List<Map<String, String>> listIssueTypes(UUID userId, UUID integrationId, String projectKey) {
        Integration integration = getIntegrationForUser(userId, integrationId);

        if (integration.getProvider() != IntegrationProvider.JIRA) {
            throw new BusinessException("Issue types are only available for Jira integrations");
        }

        return jiraService.listIssueTypes(integration, projectKey);
    }

    // ── Push to external ────────────────────────────────────────────────────

    @Transactional
    public ExternalIssueResponse pushToExternal(UUID userId, UUID feedbackGroupId,
                                                 UUID integrationId, String projectKey,
                                                 String issueType, String listId) {
        requireIntegrationAccess(userId);
        Integration integration = getIntegrationForUser(userId, integrationId);

        FeedbackGroup group = feedbackGroupRepository.findById(feedbackGroupId)
                .orElseThrow(() -> new ResourceNotFoundException("Feedback group not found"));

        // Check if already linked to this provider
        externalIssueRepository.findByFeedbackGroupIdAndProvider(feedbackGroupId, integration.getProvider())
                .ifPresent(existing -> {
                    throw new BusinessException("This feedback group is already linked to " + integration.getProvider());
                });

        List<Feedback> feedbacks = feedbackRepository.findTop50ByFeedbackGroupIdOrderByCreatedAtDesc(feedbackGroupId);

        ExternalIssue externalIssue;

        switch (integration.getProvider()) {
            case JIRA -> {
                if (projectKey == null || projectKey.isBlank()) {
                    throw new BusinessException("Project key is required for Jira");
                }
                Map<String, Object> adfDescription = buildAdfDescription(group, feedbacks);
                Map<String, String> result = jiraService.createIssue(
                        integration, projectKey, issueType, group.getTitle(), adfDescription);
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
                String markdownDescription = buildMarkdownDescription(group, feedbacks);
                Map<String, String> result = clickUpService.createTask(
                        integration, listId, group.getTitle(), markdownDescription);
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

    // ── Description builders ───────────────────────────────────────────────

    private record AggregatedContext(
            LinkedHashMap<String, String> pagesByUrl,
            LinkedHashMap<String, Integer> pageCounts,
            LinkedHashMap<String, Integer> deviceCounts,
            LinkedHashMap<String, Integer> interactionCounts,
            List<Feedback> recentFeedbacks,
            int totalVotes
    ) {}

    private AggregatedContext aggregateContext(List<Feedback> feedbacks, int totalVotes) {
        LinkedHashMap<String, String> pagesByUrl = new LinkedHashMap<>();
        LinkedHashMap<String, Integer> pageCounts = new LinkedHashMap<>();
        LinkedHashMap<String, Integer> deviceCounts = new LinkedHashMap<>();
        Map<String, Integer> interactionRaw = new LinkedHashMap<>();

        for (Feedback f : feedbacks) {
            if (f.getPageUrl() != null && !f.getPageUrl().isBlank()) {
                pagesByUrl.putIfAbsent(f.getPageUrl(), f.getPageTitle() != null ? f.getPageTitle() : f.getPageUrl());
                pageCounts.merge(f.getPageUrl(), 1, Integer::sum);
            }
            if (f.getDeviceType() != null && !f.getDeviceType().isBlank()) {
                deviceCounts.merge(f.getDeviceType(), 1, Integer::sum);
            }
            if (f.getLastInteraction() != null && !f.getLastInteraction().isBlank()) {
                interactionRaw.merge(f.getLastInteraction(), 1, Integer::sum);
            }
        }

        LinkedHashMap<String, Integer> topInteractions = interactionRaw.entrySet().stream()
                .sorted(Map.Entry.<String, Integer>comparingByValue().reversed())
                .limit(MAX_INTERACTIONS)
                .collect(Collectors.toMap(Map.Entry::getKey, Map.Entry::getValue, (a, b) -> a, LinkedHashMap::new));

        List<Feedback> recent = feedbacks.stream()
                .limit(MAX_RECENT_REPORTS)
                .toList();

        return new AggregatedContext(pagesByUrl, pageCounts, deviceCounts, topInteractions, recent, totalVotes);
    }

    // ── Markdown (ClickUp) ──────────────────────────────────────────────────

    private String buildMarkdownDescription(FeedbackGroup group, List<Feedback> feedbacks) {
        StringBuilder sb = new StringBuilder();
        sb.append(group.getSummary() != null ? group.getSummary() : group.getTitle());
        sb.append("\n\n");
        sb.append("**Votes:** ").append(group.getVoteCount());
        sb.append(" | **Category:** ").append(group.getCategory().name());
        sb.append(" | **Status:** ").append(group.getStatus().name());
        if (group.getTags() != null && !group.getTags().isBlank()) {
            sb.append("\n**Tags:** ").append(group.getTags());
        }

        if (feedbacks.isEmpty()) {
            sb.append("\n\n---\n*Synced from Upvote*");
            return sb.toString();
        }

        AggregatedContext ctx = aggregateContext(feedbacks, group.getVoteCount());

        if (!ctx.pageCounts().isEmpty()) {
            sb.append("\n\n---\n\n### Affected Pages\n");
            ctx.pageCounts().forEach((url, count) -> {
                String title = ctx.pagesByUrl().get(url);
                sb.append("- **").append(title).append("** (`").append(url).append("`) — ").append(count)
                        .append(count == 1 ? " report" : " reports").append("\n");
            });
        }

        if (!ctx.deviceCounts().isEmpty()) {
            sb.append("\n### Devices\n");
            ctx.deviceCounts().forEach((device, count) ->
                    sb.append("- ").append(device).append(" — ").append(count)
                            .append(count == 1 ? " report" : " reports").append("\n"));
        }

        if (!ctx.interactionCounts().isEmpty()) {
            sb.append("\n### Common Interactions\n");
            ctx.interactionCounts().forEach((interaction, count) ->
                    sb.append("- \"").append(interaction).append("\" — ").append(count)
                            .append(count == 1 ? " report" : " reports").append("\n"));
        }

        if (!ctx.recentFeedbacks().isEmpty()) {
            sb.append("\n### Recent Reports");
            if (ctx.totalVotes() > ctx.recentFeedbacks().size()) {
                sb.append(" (").append(ctx.totalVotes()).append(" total, showing latest ").append(ctx.recentFeedbacks().size()).append(")");
            }
            sb.append("\n");
            int i = 1;
            for (Feedback f : ctx.recentFeedbacks()) {
                String message = f.getSynthesizedMessage() != null ? f.getSynthesizedMessage() : f.getRawMessage();
                String date = f.getCreatedAt() != null ? f.getCreatedAt().format(DATE_FMT) : "—";
                sb.append(i++).append(". **").append(date).append("** — ").append(message).append("\n");
            }
        }

        sb.append("\n---\n*Synced from Upvote*");
        return sb.toString();
    }

    // ── ADF (Jira) ──────────────────────────────────────────────────────────

    private Map<String, Object> buildAdfDescription(FeedbackGroup group, List<Feedback> feedbacks) {
        List<Map<String, Object>> content = new ArrayList<>();

        // Summary paragraph
        content.add(adfParagraph(group.getSummary() != null ? group.getSummary() : group.getTitle()));

        // Overview paragraph
        String overview = "Votes: " + group.getVoteCount()
                + " | Category: " + group.getCategory().name()
                + " | Status: " + group.getStatus().name();
        if (group.getTags() != null && !group.getTags().isBlank()) {
            overview += "\nTags: " + group.getTags();
        }
        content.add(adfParagraph(overview));

        if (feedbacks.isEmpty()) {
            content.add(adfRule());
            content.add(adfParagraph("— Synced from Upvote —"));
            return Map.of("type", "doc", "version", 1, "content", content);
        }

        AggregatedContext ctx = aggregateContext(feedbacks, group.getVoteCount());

        content.add(adfRule());

        if (!ctx.pageCounts().isEmpty()) {
            content.add(adfHeading(3, "Affected Pages"));
            List<String> items = new ArrayList<>();
            ctx.pageCounts().forEach((url, count) -> {
                String title = ctx.pagesByUrl().get(url);
                items.add(title + " (" + url + ") — " + count + (count == 1 ? " report" : " reports"));
            });
            content.add(adfBulletList(items));
        }

        if (!ctx.deviceCounts().isEmpty()) {
            content.add(adfHeading(3, "Devices"));
            List<String> items = new ArrayList<>();
            ctx.deviceCounts().forEach((device, count) ->
                    items.add(device + " — " + count + (count == 1 ? " report" : " reports")));
            content.add(adfBulletList(items));
        }

        if (!ctx.interactionCounts().isEmpty()) {
            content.add(adfHeading(3, "Common Interactions"));
            List<String> items = new ArrayList<>();
            ctx.interactionCounts().forEach((interaction, count) ->
                    items.add("\"" + interaction + "\" — " + count + (count == 1 ? " report" : " reports")));
            content.add(adfBulletList(items));
        }

        if (!ctx.recentFeedbacks().isEmpty()) {
            String heading = "Recent Reports";
            if (ctx.totalVotes() > ctx.recentFeedbacks().size()) {
                heading += " (" + ctx.totalVotes() + " total, showing latest " + ctx.recentFeedbacks().size() + ")";
            }
            content.add(adfHeading(3, heading));
            List<String> items = new ArrayList<>();
            for (Feedback f : ctx.recentFeedbacks()) {
                String message = f.getSynthesizedMessage() != null ? f.getSynthesizedMessage() : f.getRawMessage();
                String date = f.getCreatedAt() != null ? f.getCreatedAt().format(DATE_FMT) : "—";
                items.add("[" + date + "] " + message);
            }
            content.add(adfBulletList(items));
        }

        content.add(adfRule());
        content.add(adfParagraph("— Synced from Upvote —"));

        return Map.of("type", "doc", "version", 1, "content", content);
    }

    // ── ADF node helpers ────────────────────────────────────────────────────

    private static Map<String, Object> adfParagraph(String text) {
        return Map.of("type", "paragraph",
                "content", List.of(Map.of("type", "text", "text", text)));
    }

    private static Map<String, Object> adfHeading(int level, String text) {
        return Map.of("type", "heading",
                "attrs", Map.of("level", level),
                "content", List.of(Map.of("type", "text", "text", text)));
    }

    private static Map<String, Object> adfBulletList(List<String> items) {
        List<Map<String, Object>> listItems = items.stream()
                .map(item -> Map.<String, Object>of("type", "listItem",
                        "content", List.of(adfParagraph(item))))
                .toList();
        return Map.of("type", "bulletList", "content", listItems);
    }

    private static Map<String, Object> adfRule() {
        return Map.of("type", "rule");
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
