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
 * Entidade que representa um grupo de feedbacks similares (padrão no dashboard)
 */
@Entity
@Table(name = "feedback_groups")
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class FeedbackGroup {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "canal_id", nullable = false)
    private Canal canal;

    @Column(nullable = false)
    private String title;

    @Column(columnDefinition = "TEXT")
    private String summary;

    @Column(name = "vote_count")
    @Builder.Default
    private Integer voteCount = 1;

    /**
     * Comma-separated tags extracted by AI during synthesis (e.g. "icone,desalinhado,computador").
     * Used for tag-overlap matching when trigram similarity alone is insufficient.
     */
    @Column(columnDefinition = "TEXT")
    private String tags;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    @Builder.Default
    private FeedbackGroupStatus status = FeedbackGroupStatus.OPEN;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    @Builder.Default
    private FeedbackGroupCategory category = FeedbackGroupCategory.SUGGESTION;

    @CreationTimestamp
    @Column(name = "created_at", updatable = false)
    private LocalDateTime createdAt;

    @UpdateTimestamp
    @Column(name = "updated_at")
    private LocalDateTime updatedAt;
}
