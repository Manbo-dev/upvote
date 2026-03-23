package com.upvote.api.domain;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.time.LocalDateTime;
import java.util.UUID;

/**
 * Links a FeedbackGroup to an issue/task in an external tool (Jira, ClickUp).
 * One external issue per provider per feedback group.
 */
@Entity
@Table(name = "external_issues")
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ExternalIssue {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "feedback_group_id", nullable = false)
    private FeedbackGroup feedbackGroup;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "integration_id", nullable = false)
    private Integration integration;

    /**
     * External identifier (e.g. "PROJ-42" for Jira, task ID for ClickUp).
     */
    @Column(name = "external_id", nullable = false, columnDefinition = "TEXT")
    private String externalId;

    /**
     * Direct URL to the issue in the external tool.
     */
    @Column(name = "external_url", nullable = false, columnDefinition = "TEXT")
    private String externalUrl;

    /**
     * Last known status from the provider (e.g. "To Do", "In Progress", "Done").
     */
    @Column(name = "external_status", columnDefinition = "TEXT")
    private String externalStatus;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    private IntegrationProvider provider;

    @CreationTimestamp
    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @UpdateTimestamp
    @Column(name = "updated_at", nullable = false)
    private LocalDateTime updatedAt;
}
