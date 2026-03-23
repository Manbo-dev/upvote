package com.upvote.api.service;

import com.upvote.api.ai.AiService;
import com.upvote.api.ai.GroupSuggestion;
import com.upvote.api.ai.PageContext;
import com.upvote.api.ai.SynthesisResult;
import com.upvote.api.domain.*;
import static com.upvote.api.domain.FeedbackGroupCategory.*;
import com.upvote.api.dto.FeedbackDetailResponse;
import com.upvote.api.dto.FeedbackGroupResponse;
import com.upvote.api.dto.FeedbackSubmitRequest;
import com.upvote.api.dto.FeedbackSubmitResponse;
import com.upvote.api.messaging.FeedbackProducer;
import com.upvote.api.messaging.FeedbackProcessingMessage;
import com.upvote.api.repository.CanalRepository;
import com.upvote.api.repository.FeedbackGroupRepository;
import com.upvote.api.repository.FeedbackRepository;
import lombok.RequiredArgsConstructor;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.slf4j.MDC;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.transaction.support.TransactionSynchronization;
import org.springframework.transaction.support.TransactionSynchronizationManager;

import java.util.List;
import java.util.UUID;

/**
 * Orchestrates the async feedback pipeline.
 *
 * <p>Reception and processing are intentionally decoupled:
 * <ol>
 *   <li>{@link #receiveFeedback} — validates the API key, persists the raw feedback as
 *       {@code PENDING}, and enqueues it for processing. Returns immediately.</li>
 *   <li>{@link #processFeedback} — called by the queue consumer; runs AI synthesis,
 *       similarity search, and grouping. Retried automatically on failure.</li>
 * </ol>
 */
@Service
@RequiredArgsConstructor
public class FeedbackService {

    private static final Logger log = LoggerFactory.getLogger(FeedbackService.class);

    // word_similarity() threshold — lower than full-string similarity() because
    // word_similarity checks partial matches (sentence fragment vs. short title).
    private static final double WORD_SIMILARITY_THRESHOLD = 0.25;

    private final FeedbackRepository feedbackRepository;
    private final FeedbackGroupRepository feedbackGroupRepository;
    private final CanalRepository canalRepository;
    private final AiService aiService;
    private final FeedbackProducer feedbackProducer;
    private final IntegrationService integrationService;

    // ── Public API ────────────────────────────────────────────────────────────

    /**
     * Receives a feedback submission from the widget.
     *
     * <p>Saves the raw feedback as {@code PENDING} and publishes a processing
     * message to RabbitMQ <em>after</em> the DB transaction commits, so the
     * consumer is guaranteed to find the record.
     *
     * @param apiKey  the channel API key from the {@code X-API-Key} header
     * @param request the feedback payload
     * @return response with the new feedback ID (grouped is always {@code false} at this stage)
     */
    @Transactional
    public FeedbackSubmitResponse receiveFeedback(String apiKey, FeedbackSubmitRequest request) {
        Canal canal = canalRepository.findByApiKey(apiKey)
                .orElseThrow(() -> new IllegalArgumentException("Invalid API key"));

        Feedback feedback = Feedback.builder()
                .canal(canal)
                .rawMessage(request.message())
                .pageUrl(request.pageUrl())
                .pageTitle(request.pageTitle())
                .triggerType(request.triggerType())
                .lastInteraction(request.lastInteraction())
                .deviceType(request.deviceType())
                .status(FeedbackStatus.PENDING)
                .build();

        feedback = feedbackRepository.save(feedback);
        final UUID feedbackId = feedback.getId();

        log.info("Feedback persisted as PENDING: feedbackId={}, canal={}", feedbackId, canal.getSlug());

        // Publish AFTER the transaction commits to avoid a race where the consumer
        // loads the record before it is visible in the DB.
        TransactionSynchronizationManager.registerSynchronization(new TransactionSynchronization() {
            @Override
            public void afterCommit() {
                feedbackProducer.send(new FeedbackProcessingMessage(feedbackId));
            }
        });

        return new FeedbackSubmitResponse(feedbackId, false);
    }

    /**
     * Processes a pending feedback message consumed from RabbitMQ.
     *
     * <p>Flow:
     * <ol>
     *   <li>Mark as {@code PROCESSING}</li>
     *   <li>AI synthesis → {@link SynthesisResult}</li>
     *   <li>DB trigram + tag similarity search</li>
     *   <li>If match → add vote to existing group</li>
     *   <li>If no match → AI suggests title/summary → create new group</li>
     *   <li>Mark as {@code PROCESSED}</li>
     * </ol>
     *
     * <p>If this method throws, the container retries up to 3 times (exponential
     * backoff). After all retries are exhausted the message goes to the DLQ and
     * the feedback record stays as {@code PROCESSING} for manual inspection.
     *
     * @param feedbackId the ID of the {@code PENDING} feedback to process
     */
    @Transactional
    public void processFeedback(UUID feedbackId) {
        Feedback feedback = feedbackRepository.findById(feedbackId)
                .orElseThrow(() -> new IllegalStateException("Feedback not found: " + feedbackId));

        Canal canal = feedback.getCanal();

        MDC.put("canalSlug", canal.getSlug());
        MDC.put("canalId", canal.getId().toString());
        MDC.put("feedbackId", feedbackId.toString());
        try {
            feedback.setStatus(FeedbackStatus.PROCESSING);
            feedbackRepository.save(feedback);

            PageContext pageContext = new PageContext(
                    feedback.getPageUrl(),
                    feedback.getPageTitle(),
                    feedback.getTriggerType(),
                    feedback.getLastInteraction(),
                    feedback.getDeviceType()
            );

            log.info("AI synthesis starting: canal={}, page={}", canal.getSlug(), feedback.getPageUrl());
            SynthesisResult synthesis = aiService.synthesizeFeedback(feedback.getRawMessage(), pageContext);
            log.info("AI synthesis complete: category={}, tags={}, text={}",
                    synthesis.category(), synthesis.tags(), synthesis.synthesizedText());

            String tagsString = synthesis.tags() != null ? String.join(",", synthesis.tags()) : "";

            // Debug: log actual similarity scores before applying threshold
            List<Object[]> debugScores = feedbackGroupRepository.findTopSimilarityScores(
                    canal.getId(), synthesis.synthesizedText());
            if (debugScores.isEmpty()) {
                log.info("Similarity debug: no groups found in canal (canal is empty)");
            } else {
                debugScores.forEach(row ->
                        log.info("Similarity debug: groupId={}, title='{}', groupTags='{}', wordSim={}, sim={}",
                                row[0], row[1], row[3], row[4], row[5]));
            }

            List<FeedbackGroup> candidates = feedbackGroupRepository.findSimilarGroups(
                    canal.getId(), synthesis.synthesizedText(), WORD_SIMILARITY_THRESHOLD, tagsString);

            log.info("Similarity search: {} candidate(s) found (threshold={}, tags='{}')",
                    candidates.size(), WORD_SIMILARITY_THRESHOLD, tagsString);

            FeedbackGroup group;
            if (!candidates.isEmpty()) {
                // Lock the top candidate to prevent concurrent vote-count races.
                group = feedbackGroupRepository.findByIdForUpdate(candidates.get(0).getId())
                        .orElseThrow(() -> new IllegalStateException("Feedback group not found"));

                group.setVoteCount(group.getVoteCount() + 1);
                feedbackGroupRepository.save(group);

                log.info("Feedback grouped into existing cluster: groupId={}, title={}, totalVotes={}",
                        group.getId(), group.getTitle(), group.getVoteCount());
            } else {
                GroupSuggestion groupSuggestion = aiService.suggestGroup(synthesis.synthesizedText(), pageContext);
                FeedbackGroupCategory category = parseCategory(synthesis.category());

                group = FeedbackGroup.builder()
                        .canal(canal)
                        .title(groupSuggestion.title())
                        .summary(groupSuggestion.summary())
                        .category(category)
                        .tags(tagsString)
                        .build();
                group = feedbackGroupRepository.save(group);

                log.info("New feedback group created: groupId={}, title={}, category={}",
                        group.getId(), group.getTitle(), group.getCategory());
            }

            feedback.setSynthesizedMessage(synthesis.synthesizedText());
            feedback.setFeedbackGroup(group);
            feedback.setStatus(FeedbackStatus.PROCESSED);
            feedbackRepository.save(feedback);

            log.info("Feedback processed successfully: feedbackId={}, groupId={}", feedbackId, group.getId());
        } finally {
            MDC.remove("canalSlug");
            MDC.remove("canalId");
            MDC.remove("feedbackId");
        }
    }

    // ── Dashboard methods ─────────────────────────────────────────────────────

    /**
     * Lists feedback groups for the dashboard (authenticated, channel owner).
     */
    public List<FeedbackGroupResponse> getFeedbackGroups(String canalSlug, String status, String category) {
        Canal canal = canalRepository.findBySlug(canalSlug)
                .orElseThrow(() -> new IllegalArgumentException("Channel not found"));

        List<FeedbackGroup> groups;

        boolean hasStatus = status != null && !status.isBlank();
        boolean hasCategory = category != null && !category.isBlank();

        if (hasStatus && hasCategory) {
            FeedbackGroupStatus groupStatus = FeedbackGroupStatus.valueOf(status.toUpperCase());
            FeedbackGroupCategory groupCategory = FeedbackGroupCategory.valueOf(category.toUpperCase());
            groups = feedbackGroupRepository.findByCanalIdAndStatusAndCategoryOrderByVoteCountDesc(
                    canal.getId(), groupStatus, groupCategory);
        } else if (hasStatus) {
            FeedbackGroupStatus groupStatus = FeedbackGroupStatus.valueOf(status.toUpperCase());
            groups = feedbackGroupRepository.findByCanalIdAndStatusOrderByVoteCountDesc(canal.getId(), groupStatus);
        } else if (hasCategory) {
            FeedbackGroupCategory groupCategory = FeedbackGroupCategory.valueOf(category.toUpperCase());
            groups = feedbackGroupRepository.findByCanalIdAndCategoryOrderByVoteCountDesc(canal.getId(), groupCategory);
        } else {
            // Exclude ARCHIVED from default listing (kanban board)
            groups = feedbackGroupRepository.findByCanalIdAndStatusNotInOrderByVoteCountDesc(
                    canal.getId(), List.of(FeedbackGroupStatus.ARCHIVED));
        }

        List<UUID> groupIds = groups.stream().map(FeedbackGroup::getId).toList();
        var externalIssuesMap = integrationService.getExternalIssuesForGroups(groupIds);

        return groups.stream()
                .map(g -> toGroupResponse(g, externalIssuesMap.getOrDefault(g.getId(), List.of())))
                .toList();
    }

    /**
     * Updates the status of a feedback group.
     */
    @Transactional
    public FeedbackGroupResponse updateFeedbackGroupStatus(UUID groupId, String status) {
        FeedbackGroup group = feedbackGroupRepository.findById(groupId)
                .orElseThrow(() -> new IllegalArgumentException("Feedback group not found"));
        group.setStatus(FeedbackGroupStatus.valueOf(status.toUpperCase()));
        feedbackGroupRepository.save(group);
        return toGroupResponse(group);
    }

    /**
     * Updates the category of a feedback group.
     */
    @Transactional
    public FeedbackGroupResponse updateFeedbackGroupCategory(UUID groupId, String category) {
        FeedbackGroup group = feedbackGroupRepository.findById(groupId)
                .orElseThrow(() -> new IllegalArgumentException("Feedback group not found"));
        group.setCategory(FeedbackGroupCategory.valueOf(category.toUpperCase()));
        feedbackGroupRepository.save(group);
        return toGroupResponse(group);
    }

    /**
     * Archives all DONE feedback groups for a channel.
     *
     * @return number of groups archived
     */
    @Transactional
    public int archiveAllDone(String canalSlug) {
        Canal canal = canalRepository.findBySlug(canalSlug)
                .orElseThrow(() -> new IllegalArgumentException("Channel not found"));
        int count = feedbackGroupRepository.archiveAllDone(canal.getId());
        log.info("Archived {} DONE feedback groups for canal={}", count, canalSlug);
        return count;
    }

    /**
     * Archives a single feedback group.
     */
    @Transactional
    public FeedbackGroupResponse archiveFeedbackGroup(UUID groupId) {
        FeedbackGroup group = feedbackGroupRepository.findById(groupId)
                .orElseThrow(() -> new IllegalArgumentException("Feedback group not found"));
        group.setStatus(FeedbackGroupStatus.ARCHIVED);
        feedbackGroupRepository.save(group);
        log.info("Archived feedback group: groupId={}, title={}", groupId, group.getTitle());
        return toGroupResponse(group);
    }

    /**
     * Restores an archived feedback group back to DONE status.
     */
    @Transactional
    public FeedbackGroupResponse restoreFeedbackGroup(UUID groupId) {
        FeedbackGroup group = feedbackGroupRepository.findById(groupId)
                .orElseThrow(() -> new IllegalArgumentException("Feedback group not found"));
        if (group.getStatus() != FeedbackGroupStatus.ARCHIVED) {
            throw new IllegalArgumentException("Only archived groups can be restored");
        }
        group.setStatus(FeedbackGroupStatus.DONE);
        feedbackGroupRepository.save(group);
        log.info("Restored feedback group: groupId={}, title={}", groupId, group.getTitle());
        return toGroupResponse(group);
    }

    /**
     * Returns individual feedbacks within a group for the detail modal.
     */
    public List<FeedbackDetailResponse> getFeedbackGroupDetails(UUID groupId) {
        return feedbackRepository.findByFeedbackGroupId(groupId).stream()
                .map(f -> new FeedbackDetailResponse(
                        f.getId(),
                        f.getRawMessage(),
                        f.getSynthesizedMessage(),
                        f.getPageUrl(),
                        f.getPageTitle(),
                        f.getTriggerType(),
                        f.getLastInteraction(),
                        f.getDeviceType(),
                        f.getCreatedAt()
                ))
                .toList();
    }

    // ── Private helpers ───────────────────────────────────────────────────────

    private FeedbackGroupResponse toGroupResponse(FeedbackGroup group) {
        return toGroupResponse(group, List.of());
    }

    private FeedbackGroupResponse toGroupResponse(FeedbackGroup group, List<com.upvote.api.dto.ExternalIssueResponse> externalIssues) {
        String topContext = buildTopContext(group);
        return new FeedbackGroupResponse(
                group.getId(),
                group.getTitle(),
                group.getSummary(),
                group.getVoteCount(),
                group.getStatus().name(),
                group.getCategory().name(),
                topContext,
                externalIssues.isEmpty() ? null : externalIssues,
                group.getCreatedAt(),
                group.getUpdatedAt()
        );
    }

    private FeedbackGroupCategory parseCategory(String category) {
        if (category == null || category.isBlank()) {
            return SUGGESTION;
        }
        try {
            return FeedbackGroupCategory.valueOf(category.toUpperCase());
        } catch (IllegalArgumentException e) {
            return SUGGESTION;
        }
    }

    private String buildTopContext(FeedbackGroup group) {
        List<Feedback> feedbacks = feedbackRepository.findByFeedbackGroupId(group.getId());

        if (feedbacks.isEmpty()) {
            return null;
        }

        return feedbacks.stream()
                .filter(f -> f.getLastInteraction() != null && !f.getLastInteraction().isBlank())
                .reduce((first, second) -> second)
                .map(f -> {
                    StringBuilder ctx = new StringBuilder();
                    if (f.getLastInteraction() != null) {
                        ctx.append("after '").append(f.getLastInteraction()).append("'");
                    }
                    if (f.getPageTitle() != null) {
                        ctx.append(" on ").append(f.getPageTitle());
                    }
                    return ctx.toString().trim();
                })
                .orElse(null);
    }
}
