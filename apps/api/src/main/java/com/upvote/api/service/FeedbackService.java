package com.upvote.api.service;

import com.upvote.api.ai.AiService;
import com.upvote.api.ai.GroupSuggestion;
import com.upvote.api.ai.PageContext;
import com.upvote.api.ai.SynthesisResult;
import com.upvote.api.domain.*;
import static com.upvote.api.domain.FeedbackGroupCategory.*;
import com.upvote.api.dto.FeedbackGroupResponse;
import com.upvote.api.dto.FeedbackSubmitRequest;
import com.upvote.api.dto.FeedbackSubmitResponse;
import com.upvote.api.repository.CanalRepository;
import com.upvote.api.repository.FeedbackGroupRepository;
import com.upvote.api.repository.FeedbackRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

/**
 * Orchestrates the intelligent feedback pipeline:
 * AI synthesis → DB similarity search → group or create.
 */
@Service
@RequiredArgsConstructor
public class FeedbackService {

    private static final double SIMILARITY_THRESHOLD = 0.45;

    private final FeedbackRepository feedbackRepository;
    private final FeedbackGroupRepository feedbackGroupRepository;
    private final CanalRepository canalRepository;
    private final AiService aiService;

    /**
     * Processes a feedback submission from the widget.
     *
     * <p>Flow:
     * <ol>
     *   <li>Identify channel by API key</li>
     *   <li>Build PageContext from request</li>
     *   <li>AI synthesizes the raw message → {@link SynthesisResult}</li>
     *   <li>DB trigram search finds similar existing groups</li>
     *   <li>If a match is found → add feedback to existing group (locked write)</li>
     *   <li>If no match → AI suggests title/summary → create new group</li>
     * </ol>
     *
     * @param apiKey  the channel API key sent in X-API-Key header
     * @param request the feedback payload from the widget
     * @return response with feedback ID and whether it was grouped into an existing cluster
     */
    @Transactional
    public FeedbackSubmitResponse submitFeedback(String apiKey, FeedbackSubmitRequest request) {
        Canal canal = canalRepository.findByApiKey(apiKey)
                .orElseThrow(() -> new IllegalArgumentException("Invalid API key"));

        PageContext pageContext = new PageContext(
                request.pageUrl(),
                request.pageTitle(),
                request.triggerType(),
                request.lastInteraction(),
                request.deviceType()
        );

        SynthesisResult synthesis = aiService.synthesizeFeedback(request.message(), pageContext);

        List<FeedbackGroup> candidates = feedbackGroupRepository.findSimilarGroups(
                canal.getId(), synthesis.synthesizedText(), SIMILARITY_THRESHOLD);

        if (!candidates.isEmpty()) {
            // Lock the top candidate to prevent race conditions on concurrent submissions
            FeedbackGroup matchedGroup = feedbackGroupRepository
                    .findByIdForUpdate(candidates.get(0).getId())
                    .orElseThrow(() -> new IllegalStateException("Feedback group not found"));

            matchedGroup.setVoteCount(matchedGroup.getVoteCount() + 1);
            feedbackGroupRepository.save(matchedGroup);

            Feedback feedback = buildFeedback(canal, request, synthesis, pageContext);
            feedback.setFeedbackGroup(matchedGroup);
            feedback.setStatus(FeedbackStatus.PROCESSED);
            feedbackRepository.save(feedback);

            return new FeedbackSubmitResponse(feedback.getId(), true);
        }

        GroupSuggestion groupSuggestion = aiService.suggestGroup(synthesis.synthesizedText(), pageContext);

        FeedbackGroupCategory category = parseCategory(synthesis.category());

        FeedbackGroup newGroup = FeedbackGroup.builder()
                .canal(canal)
                .title(groupSuggestion.title())
                .summary(groupSuggestion.summary())
                .category(category)
                .build();
        newGroup = feedbackGroupRepository.save(newGroup);

        Feedback feedback = buildFeedback(canal, request, synthesis, pageContext);
        feedback.setFeedbackGroup(newGroup);
        feedback.setStatus(FeedbackStatus.PROCESSED);
        feedbackRepository.save(feedback);

        return new FeedbackSubmitResponse(feedback.getId(), false);
    }

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
            groups = feedbackGroupRepository.findByCanalIdOrderByVoteCountDesc(canal.getId());
        }

        return groups.stream()
                .map(this::toGroupResponse)
                .toList();
    }

    private Feedback buildFeedback(Canal canal, FeedbackSubmitRequest request,
                                   SynthesisResult synthesis, PageContext pageContext) {
        return Feedback.builder()
                .canal(canal)
                .rawMessage(request.message())
                .synthesizedMessage(synthesis.synthesizedText())
                .pageUrl(pageContext.pageUrl())
                .pageTitle(pageContext.pageTitle())
                .triggerType(pageContext.triggerType())
                .lastInteraction(pageContext.lastInteraction())
                .deviceType(pageContext.deviceType())
                .build();
    }

    private FeedbackGroupResponse toGroupResponse(FeedbackGroup group) {
        String topContext = buildTopContext(group);
        return new FeedbackGroupResponse(
                group.getId(),
                group.getTitle(),
                group.getSummary(),
                group.getVoteCount(),
                group.getStatus().name(),
                group.getCategory().name(),
                topContext,
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
