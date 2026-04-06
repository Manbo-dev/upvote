package com.upvote.api.controller;

import com.upvote.api.dto.*;
import com.upvote.api.service.CanalService;
import com.upvote.api.service.FeedbackService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.UUID;

import java.util.List;
import java.util.Map;

/**
 * Controller for the intelligent feedback pipeline.
 */
@RestController
@RequiredArgsConstructor
public class FeedbackController {

    private final FeedbackService feedbackService;
    private final CanalService canalService;

    /**
     * Returns widget configuration for a channel (public endpoint, no auth).
     * Called by the widget script on initialization to apply dashboard-configured settings.
     */
    @GetMapping("/api/widget/config")
    public ResponseEntity<ApiResponse<WidgetConfigResponse>> getWidgetConfig(
            @RequestHeader("X-API-Key") String apiKey) {
        WidgetConfigResponse config = canalService.getWidgetConfig(apiKey);
        return ResponseEntity.ok(ApiResponse.ok(config));
    }

    /**
     * Receives a feedback submission from the widget (public endpoint, no auth).
     * Channel is identified via the X-API-Key header.
     */
    @PostMapping("/api/widget/feedback")
    public ResponseEntity<ApiResponse<FeedbackSubmitResponse>> submitFeedback(
            @RequestHeader("X-API-Key") String apiKey,
            @Valid @RequestBody FeedbackSubmitRequest request) {

        FeedbackSubmitResponse response = feedbackService.receiveFeedback(apiKey, request);
        return ResponseEntity.ok(ApiResponse.ok(response, "Feedback received successfully"));
    }

    /**
     * Lists feedback groups for the dashboard (authenticated, channel owner).
     */
    @GetMapping("/api/canais/{slug}/feedback-groups")
    public ResponseEntity<ApiResponse<List<FeedbackGroupResponse>>> getFeedbackGroups(
            @PathVariable String slug,
            @RequestParam(required = false) String status,
            @RequestParam(required = false) String category) {

        List<FeedbackGroupResponse> groups = feedbackService.getFeedbackGroups(slug, status, category);
        return ResponseEntity.ok(ApiResponse.ok(groups));
    }

    /**
     * Updates the status of a feedback group (authenticated, channel owner).
     */
    @PatchMapping("/api/feedback-groups/{id}/status")
    public ResponseEntity<ApiResponse<FeedbackGroupResponse>> updateFeedbackGroupStatus(
            @PathVariable UUID id,
            @RequestBody Map<String, String> body) {

        String status = body.get("status");
        FeedbackGroupResponse updated = feedbackService.updateFeedbackGroupStatus(id, status);
        return ResponseEntity.ok(ApiResponse.ok(updated));
    }

    /**
     * Updates the category of a feedback group (authenticated, channel owner).
     */
    @PatchMapping("/api/feedback-groups/{id}/category")
    public ResponseEntity<ApiResponse<FeedbackGroupResponse>> updateFeedbackGroupCategory(
            @PathVariable UUID id,
            @RequestBody Map<String, String> body) {

        String category = body.get("category");
        FeedbackGroupResponse updated = feedbackService.updateFeedbackGroupCategory(id, category);
        return ResponseEntity.ok(ApiResponse.ok(updated));
    }

    /**
     * Lists individual feedbacks within a group (authenticated, channel owner).
     */
    @GetMapping("/api/feedback-groups/{id}/feedbacks")
    public ResponseEntity<ApiResponse<List<FeedbackDetailResponse>>> getFeedbackGroupDetails(
            @PathVariable UUID id) {

        List<FeedbackDetailResponse> feedbacks = feedbackService.getFeedbackGroupDetails(id);
        return ResponseEntity.ok(ApiResponse.ok(feedbacks));
    }

    /**
     * Archives all DONE feedback groups for a channel (authenticated, channel owner).
     */
    @PostMapping("/api/canais/{slug}/feedback-groups/archive-done")
    public ResponseEntity<ApiResponse<Map<String, Integer>>> archiveAllDone(@PathVariable String slug) {
        int count = feedbackService.archiveAllDone(slug);
        return ResponseEntity.ok(ApiResponse.ok(Map.of("archivedCount", count),
                count + " feedback group(s) archived"));
    }

    /**
     * Archives a single feedback group (authenticated, channel owner).
     */
    @PostMapping("/api/feedback-groups/{id}/archive")
    public ResponseEntity<ApiResponse<FeedbackGroupResponse>> archiveFeedbackGroup(@PathVariable UUID id) {
        FeedbackGroupResponse archived = feedbackService.archiveFeedbackGroup(id);
        return ResponseEntity.ok(ApiResponse.ok(archived, "Feedback group archived"));
    }

    /**
     * Restores an archived feedback group back to DONE (authenticated, channel owner).
     */
    @PostMapping("/api/feedback-groups/{id}/restore")
    public ResponseEntity<ApiResponse<FeedbackGroupResponse>> restoreFeedbackGroup(@PathVariable UUID id) {
        FeedbackGroupResponse restored = feedbackService.restoreFeedbackGroup(id);
        return ResponseEntity.ok(ApiResponse.ok(restored, "Feedback group restored"));
    }
}
