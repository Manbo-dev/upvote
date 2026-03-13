package com.upvote.api.domain;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.hibernate.annotations.CreationTimestamp;

import java.time.LocalDateTime;
import java.util.UUID;

/**
 * Entidade que representa um feedback individual enviado pelo widget
 */
@Entity
@Table(name = "feedbacks")
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class Feedback {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "product_id", nullable = false)
    private Product product;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "feedback_group_id")
    private FeedbackGroup feedbackGroup;

    @Column(name = "raw_message", nullable = false, columnDefinition = "TEXT")
    private String rawMessage;

    @Column(name = "synthesized_message", columnDefinition = "TEXT")
    private String synthesizedMessage;

    @Column(name = "follow_up_question", columnDefinition = "TEXT")
    private String followUpQuestion;

    @Column(name = "follow_up_answer", columnDefinition = "TEXT")
    private String followUpAnswer;

    @Column(name = "page_url", length = 2000)
    private String pageUrl;

    @Column(name = "page_title", length = 500)
    private String pageTitle;

    @Column(name = "trigger_type", length = 50)
    private String triggerType;

    @Column(name = "last_interaction", length = 500)
    private String lastInteraction;

    @Column(name = "device_type", length = 50)
    private String deviceType;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    @Builder.Default
    private FeedbackStatus status = FeedbackStatus.PENDING;

    @CreationTimestamp
    @Column(name = "created_at", updatable = false)
    private LocalDateTime createdAt;
}
