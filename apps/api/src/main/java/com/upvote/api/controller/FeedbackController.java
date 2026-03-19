package com.upvote.api.controller;

import com.upvote.api.dto.*;
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

    /**
     * Receives a feedback submission from the widget (public endpoint, no auth).
     * Channel is identified via the X-API-Key header.
     */
    @PostMapping("/api/widget/feedback")
    public ResponseEntity<ApiResponse<FeedbackSubmitResponse>> submitFeedback(
            @RequestHeader("X-API-Key") String apiKey,
            @Valid @RequestBody FeedbackSubmitRequest request) {

        FeedbackSubmitResponse response = feedbackService.submitFeedback(apiKey, request);
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
     * Lists individual feedbacks within a group (authenticated, channel owner).
     */
    @GetMapping("/api/feedback-groups/{id}/feedbacks")
    public ResponseEntity<ApiResponse<List<FeedbackDetailResponse>>> getFeedbackGroupDetails(
            @PathVariable UUID id) {

        List<FeedbackDetailResponse> feedbacks = feedbackService.getFeedbackGroupDetails(id);
        return ResponseEntity.ok(ApiResponse.ok(feedbacks));
    }
}
