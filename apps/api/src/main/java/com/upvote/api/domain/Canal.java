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
 * Entidade que representa um canal de feedback (ex: checkout, landing page, área de assinatura)
 */
@Entity
@Table(name = "canais")
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class Canal {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @Column(nullable = false)
    private String name;

    @Column(nullable = false, unique = true)
    private String slug;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    @Column(name = "api_key", nullable = false, unique = true, length = 52)
    private String apiKey;

    @Column(name = "widget_color")
    @Builder.Default
    private String widgetColor = "#6366f1";

    @Column(name = "widget_position", length = 20)
    @Builder.Default
    private String widgetPosition = "BOTTOM_RIGHT";

    @Column(name = "widget_title", length = 100)
    private String widgetTitle;

    @Column(name = "widget_placeholder", length = 200)
    private String widgetPlaceholder;

    @Column(name = "widget_mode", length = 20)
    @Builder.Default
    private String widgetMode = "FLOATING";

    @Column(name = "public_board_enabled", nullable = false)
    @Builder.Default
    private boolean publicBoardEnabled = false;

    @CreationTimestamp
    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;
}
