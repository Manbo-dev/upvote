package com.upvote.api.service;

import com.upvote.api.domain.Canal;
import com.upvote.api.domain.Subscription;
import com.upvote.api.domain.User;
import com.upvote.api.dto.CanalRequest;
import com.upvote.api.dto.CanalResponse;
import com.upvote.api.dto.RenameCanelRequest;
import com.upvote.api.dto.WidgetConfigResponse;
import com.upvote.api.dto.WidgetSettingsRequest;
import com.upvote.api.exception.BusinessException;
import com.upvote.api.exception.ResourceNotFoundException;
import com.upvote.api.repository.CanalRepository;
import com.upvote.api.repository.FeedbackGroupRepository;
import com.upvote.api.repository.FeedbackRepository;
import com.upvote.api.repository.SubscriptionRepository;
import com.upvote.api.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.security.SecureRandom;
import java.util.HexFormat;
import java.util.List;
import java.util.UUID;

/**
 * Service for managing feedback channels
 */
@Service
@RequiredArgsConstructor
public class CanalService {

    private final CanalRepository canalRepository;
    private final SubscriptionRepository subscriptionRepository;
    private final UserRepository userRepository;
    private final FeedbackRepository feedbackRepository;
    private final FeedbackGroupRepository feedbackGroupRepository;

    /**
     * Lists all channels belonging to the user
     */
    public List<CanalResponse> getCanaisByOwner(UUID userId) {
        return canalRepository.findByUserId(userId).stream()
                .map(this::toResponse)
                .toList();
    }

    /**
     * Creates a new channel for the user
     */
    @Transactional
    public CanalResponse createCanal(CanalRequest request, UUID userId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new IllegalStateException("Usuário não encontrado"));

        Subscription subscription = subscriptionRepository.findByUserId(userId)
                .orElseThrow(() -> new IllegalStateException("Assinatura não encontrada"));

        long canaisAtivos = canalRepository.countByUserId(userId);
        if (canaisAtivos >= subscription.getPlano().getLimiteCanais()) {
            throw new BusinessException("Limite de canais do plano " + subscription.getPlano().name()
                    + " atingido (" + subscription.getPlano().getLimiteCanais() + "). Faça upgrade para criar mais canais.");
        }

        if (canalRepository.findBySlug(request.slug()).isPresent()) {
            throw new IllegalArgumentException("Slug já está em uso");
        }

        byte[] randomBytes = new byte[24];
        new SecureRandom().nextBytes(randomBytes);
        String apiKey = "upv_" + HexFormat.of().formatHex(randomBytes);

        Canal canal = Canal.builder()
                .name(request.name())
                .slug(request.slug())
                .apiKey(apiKey)
                .user(user)
                .build();
        canal = canalRepository.save(canal);

        return toResponse(canal);
    }

    /**
     * Renames a channel, updating both name and slug
     */
    @Transactional
    public CanalResponse renameCanal(UUID canalId, RenameCanelRequest request, UUID userId) {
        Canal canal = canalRepository.findById(canalId)
                .orElseThrow(() -> new ResourceNotFoundException("Canal não encontrado"));

        if (!canal.getUser().getId().equals(userId)) {
            throw new SecurityException("Você não tem permissão para renomear este canal");
        }

        if (!canal.getSlug().equals(request.slug()) && canalRepository.findBySlug(request.slug()).isPresent()) {
            throw new BusinessException("Slug já está em uso");
        }

        canal.setName(request.name());
        canal.setSlug(request.slug());
        canal = canalRepository.save(canal);
        return toResponse(canal);
    }

    /**
     * Deletes a channel and all associated data
     */
    @Transactional
    public void deleteCanal(UUID canalId, UUID userId) {
        Canal canal = canalRepository.findById(canalId)
                .orElseThrow(() -> new ResourceNotFoundException("Canal não encontrado"));

        if (!canal.getUser().getId().equals(userId)) {
            throw new SecurityException("Você não tem permissão para deletar este canal");
        }

        feedbackRepository.deleteByCanalId(canalId);
        feedbackGroupRepository.deleteByCanalId(canalId);
        canalRepository.delete(canal);
    }

    /**
     * Finds a channel by slug (public)
     */
    public CanalResponse getCanalBySlug(String slug) {
        Canal canal = canalRepository.findBySlug(slug)
                .orElseThrow(() -> new IllegalArgumentException("Canal não encontrado"));
        return toResponse(canal);
    }

    /**
     * Updates widget customization settings for a channel. Requires PRO or BUSINESS plan.
     */
    @Transactional
    public CanalResponse updateWidgetSettings(UUID canalId, WidgetSettingsRequest request, UUID userId) {
        Canal canal = canalRepository.findById(canalId)
                .orElseThrow(() -> new ResourceNotFoundException("Canal não encontrado"));

        if (!canal.getUser().getId().equals(userId)) {
            throw new SecurityException("Você não tem permissão para editar este canal");
        }

        Subscription subscription = subscriptionRepository.findByUserId(userId)
                .orElseThrow(() -> new IllegalStateException("Assinatura não encontrada"));

        if (!subscription.getPlano().isWidgetCustomizationEnabled()) {
            throw new BusinessException(
                    "Widget customization requires PRO or BUSINESS plan. Upgrade to access this feature.");
        }

        canal.setWidgetColor(request.color());
        canal.setWidgetPosition(request.position());
        canal.setWidgetTitle(request.title());
        canal.setWidgetPlaceholder(request.placeholder());
        canal = canalRepository.save(canal);
        return toResponse(canal);
    }

    /**
     * Returns widget configuration for a channel by API key (public, no plan check).
     * Called by the widget script on initialization.
     */
    public WidgetConfigResponse getWidgetConfig(String apiKey) {
        Canal canal = canalRepository.findByApiKey(apiKey)
                .orElseThrow(() -> new ResourceNotFoundException("Canal não encontrado"));
        return new WidgetConfigResponse(
                canal.getWidgetColor(),
                canal.getWidgetPosition(),
                canal.getWidgetTitle(),
                canal.getWidgetPlaceholder()
        );
    }

    private CanalResponse toResponse(Canal canal) {
        return new CanalResponse(
                canal.getId(),
                canal.getName(),
                canal.getSlug(),
                canal.getApiKey(),
                canal.getWidgetColor(),
                canal.getWidgetPosition(),
                canal.getWidgetTitle(),
                canal.getWidgetPlaceholder(),
                canal.getCreatedAt()
        );
    }
}
