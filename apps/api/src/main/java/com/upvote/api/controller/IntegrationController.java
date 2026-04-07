package com.upvote.api.controller;

import com.upvote.api.dto.*;
import com.upvote.api.service.IntegrationService;
import com.upvote.api.service.UserContextResolver;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;
import java.util.UUID;

/**
 * Controller for managing external integrations (Jira, ClickUp).
 * Handles OAuth flows, integration CRUD, and push-to-external operations.
 */
@RestController
@RequestMapping("/api/integrations")
@RequiredArgsConstructor
@Slf4j
public class IntegrationController {

    private final IntegrationService integrationService;
    private final UserContextResolver userContextResolver;

    /**
     * Lists all connected integrations for the authenticated user.
     */
    @GetMapping
    public ResponseEntity<ApiResponse<List<IntegrationResponse>>> listIntegrations(
            @AuthenticationPrincipal UserDetails userDetails) {
        UUID userId = getUserId(userDetails);
        List<IntegrationResponse> integrations = integrationService.getIntegrations(userId);
        return ResponseEntity.ok(ApiResponse.ok(integrations));
    }

    /**
     * Returns the Jira OAuth authorization URL. Frontend redirects the user to this URL.
     */
    @GetMapping("/jira/authorize")
    public ResponseEntity<ApiResponse<Map<String, String>>> jiraAuthorize(
            @AuthenticationPrincipal UserDetails userDetails) {
        UUID userId = getUserId(userDetails);
        String url = integrationService.getJiraAuthorizationUrl(userId);
        return ResponseEntity.ok(ApiResponse.ok(Map.of("authorizationUrl", url)));
    }

    /**
     * Returns the ClickUp OAuth authorization URL. Frontend redirects the user to this URL.
     */
    @GetMapping("/clickup/authorize")
    public ResponseEntity<ApiResponse<Map<String, String>>> clickUpAuthorize(
            @AuthenticationPrincipal UserDetails userDetails) {
        UUID userId = getUserId(userDetails);
        String url = integrationService.getClickUpAuthorizationUrl(userId);
        return ResponseEntity.ok(ApiResponse.ok(Map.of("authorizationUrl", url)));
    }

    /**
     * OAuth callback for Jira — exchanges code for tokens and saves integration.
     */
    @GetMapping("/jira/callback")
    public ResponseEntity<ApiResponse<IntegrationResponse>> jiraCallback(
            @RequestParam String code,
            @RequestParam String state) {
        IntegrationResponse response = integrationService.completeJiraOAuth(code, state);
        return ResponseEntity.ok(ApiResponse.ok(response, "Jira connected successfully"));
    }

    /**
     * OAuth callback for ClickUp — exchanges code for tokens and saves integration.
     */
    @GetMapping("/clickup/callback")
    public ResponseEntity<ApiResponse<IntegrationResponse>> clickUpCallback(
            @RequestParam String code,
            @RequestParam String state) {
        IntegrationResponse response = integrationService.completeClickUpOAuth(code, state);
        return ResponseEntity.ok(ApiResponse.ok(response, "ClickUp connected successfully"));
    }

    /**
     * Disconnects an integration (deletes OAuth credentials).
     */
    @DeleteMapping("/{id}")
    public ResponseEntity<ApiResponse<Void>> disconnect(
            @PathVariable UUID id,
            @AuthenticationPrincipal UserDetails userDetails) {
        UUID userId = getUserId(userDetails);
        integrationService.disconnect(userId, id);
        return ResponseEntity.ok(ApiResponse.ok(null, "Integration disconnected"));
    }

    /**
     * Lists projects (Jira) or lists (ClickUp) for a given integration.
     */
    @GetMapping("/{id}/projects")
    public ResponseEntity<ApiResponse<List<Map<String, String>>>> listProjects(
            @PathVariable UUID id,
            @AuthenticationPrincipal UserDetails userDetails) {
        UUID userId = getUserId(userDetails);
        List<Map<String, String>> projects = integrationService.listProjects(userId, id);
        return ResponseEntity.ok(ApiResponse.ok(projects));
    }

    /**
     * Lists issue types for a specific Jira project.
     */
    @GetMapping("/{id}/projects/{projectKey}/issue-types")
    public ResponseEntity<ApiResponse<List<Map<String, String>>>> listIssueTypes(
            @PathVariable UUID id,
            @PathVariable String projectKey,
            @AuthenticationPrincipal UserDetails userDetails) {
        UUID userId = getUserId(userDetails);
        List<Map<String, String>> issueTypes = integrationService.listIssueTypes(userId, id, projectKey);
        return ResponseEntity.ok(ApiResponse.ok(issueTypes));
    }

    /**
     * Pushes a feedback group to an external tool as an issue/task.
     */
    @PostMapping("/push/{feedbackGroupId}")
    public ResponseEntity<ApiResponse<ExternalIssueResponse>> pushToExternal(
            @PathVariable UUID feedbackGroupId,
            @Valid @RequestBody PushToExternalRequest request,
            @AuthenticationPrincipal UserDetails userDetails) {
        UUID userId = getUserId(userDetails);
        ExternalIssueResponse response = integrationService.pushToExternal(
                userId, feedbackGroupId,
                request.integrationId(), request.projectKey(),
                request.issueType(), request.listId());
        return ResponseEntity.ok(ApiResponse.ok(response, "Issue created successfully"));
    }

    /**
     * Lists external issues linked to a feedback group.
     */
    @GetMapping("/external-issues/{feedbackGroupId}")
    public ResponseEntity<ApiResponse<List<ExternalIssueResponse>>> getExternalIssues(
            @PathVariable UUID feedbackGroupId) {
        List<ExternalIssueResponse> issues = integrationService.getExternalIssues(feedbackGroupId);
        return ResponseEntity.ok(ApiResponse.ok(issues));
    }

    /**
     * Unlinks an external issue from a feedback group.
     */
    @DeleteMapping("/external-issues/{externalIssueId}")
    public ResponseEntity<ApiResponse<Void>> unlinkExternalIssue(
            @PathVariable UUID externalIssueId,
            @AuthenticationPrincipal UserDetails userDetails) {
        UUID userId = getUserId(userDetails);
        integrationService.unlinkExternalIssue(userId, externalIssueId);
        return ResponseEntity.ok(ApiResponse.ok(null, "External issue unlinked"));
    }

    private UUID getUserId(UserDetails userDetails) {
        return userContextResolver.resolveOwnerId(userDetails.getUsername());
    }
}
