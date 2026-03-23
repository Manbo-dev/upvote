package com.upvote.api.controller;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.upvote.api.service.IntegrationService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

/**
 * Public webhook endpoints for receiving status updates from Jira and ClickUp.
 * These endpoints are unauthenticated (validated by provider-specific mechanisms).
 */
@RestController
@RequestMapping("/api/webhooks")
@RequiredArgsConstructor
@Slf4j
public class IntegrationWebhookController {

    private final IntegrationService integrationService;
    private final ObjectMapper objectMapper;

    /**
     * Receives Jira webhook events (issue status transitions).
     * Jira sends webhooks configured via their admin panel or API.
     */
    @PostMapping("/jira")
    public ResponseEntity<Void> jiraWebhook(@RequestBody String payload) {
        try {
            JsonNode root = objectMapper.readTree(payload);
            String webhookEvent = root.path("webhookEvent").asText();

            if ("jira:issue_updated".equals(webhookEvent)) {
                JsonNode issue = root.path("issue");
                String issueKey = issue.path("key").asText();
                String newStatus = issue.path("fields").path("status").path("name").asText();

                if (!issueKey.isBlank() && !newStatus.isBlank()) {
                    integrationService.processJiraWebhook(issueKey, newStatus);
                    log.info("[WEBHOOK] Jira status update processed: issueKey={}, status={}", issueKey, newStatus);
                }
            }
        } catch (Exception e) {
            log.error("[WEBHOOK] Failed to process Jira webhook", e);
        }

        return ResponseEntity.ok().build();
    }

    /**
     * Receives ClickUp webhook events (task status changes).
     * ClickUp webhooks are registered programmatically via the API.
     */
    @PostMapping("/clickup")
    public ResponseEntity<Void> clickUpWebhook(@RequestBody String payload) {
        try {
            JsonNode root = objectMapper.readTree(payload);
            String event = root.path("event").asText();

            if ("taskStatusUpdated".equals(event)) {
                String taskId = root.path("task_id").asText();
                JsonNode historyItems = root.path("history_items");

                if (historyItems.isArray() && !historyItems.isEmpty()) {
                    String newStatus = historyItems.get(0).path("after").path("status").asText();
                    if (!taskId.isBlank() && !newStatus.isBlank()) {
                        integrationService.processClickUpWebhook(taskId, newStatus);
                        log.info("[WEBHOOK] ClickUp status update processed: taskId={}, status={}", taskId, newStatus);
                    }
                }
            }
        } catch (Exception e) {
            log.error("[WEBHOOK] Failed to process ClickUp webhook", e);
        }

        return ResponseEntity.ok().build();
    }
}
