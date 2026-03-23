package com.upvote.api.dto;

import jakarta.validation.constraints.NotNull;

import java.util.UUID;

/**
 * Request to push a feedback group to an external tool.
 */
public record PushToExternalRequest(
        @NotNull UUID integrationId,
        String projectKey,   // Jira: project key (e.g. "PROD")
        String issueType,    // Jira: issue type (e.g. "Story", "Bug") — defaults to "Task"
        String listId        // ClickUp: list ID to create the task in
) {}
