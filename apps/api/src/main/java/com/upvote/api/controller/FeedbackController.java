package com.upvote.api.controller;

import com.upvote.api.dto.*;
import com.upvote.api.service.FeedbackService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

/**
 * Controller para o fluxo de feedback inteligente
 */
@RestController
@RequiredArgsConstructor
public class FeedbackController {

    private final FeedbackService feedbackService;

    /**
     * Submete um feedback pelo widget (endpoint público, sem auth)
     */
    @PostMapping("/api/widget/{slug}/feedback")
    public ResponseEntity<ApiResponse<FeedbackSubmitResponse>> submitFeedback(
            @PathVariable String slug,
            @Valid @RequestBody FeedbackSubmitRequest request) {

        FeedbackSubmitResponse response = feedbackService.submitFeedback(slug, request);
        return ResponseEntity.ok(ApiResponse.ok(response, "Feedback recebido com sucesso"));
    }

    /**
     * Processa resposta de follow-up do usuário (endpoint público, sem auth)
     */
    @PostMapping("/api/widget/feedback/{feedbackId}/follow-up")
    public ResponseEntity<ApiResponse<FeedbackSubmitResponse>> processFollowUp(
            @PathVariable UUID feedbackId,
            @Valid @RequestBody FollowUpRequest request) {

        FeedbackSubmitResponse response = feedbackService.processFollowUp(feedbackId, request);
        return ResponseEntity.ok(ApiResponse.ok(response, "Resposta processada com sucesso"));
    }

    /**
     * Lista grupos de feedback para o dashboard (endpoint autenticado, dono do produto)
     */
    @GetMapping("/api/products/{slug}/feedback-groups")
    public ResponseEntity<ApiResponse<List<FeedbackGroupResponse>>> getFeedbackGroups(
            @PathVariable String slug,
            @RequestParam(required = false) String status) {

        List<FeedbackGroupResponse> groups = feedbackService.getFeedbackGroups(slug, status);
        return ResponseEntity.ok(ApiResponse.ok(groups));
    }
}
