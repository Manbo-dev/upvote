package com.upvote.api.service;

import com.upvote.api.domain.Canal;
import com.upvote.api.domain.Subscription;
import com.upvote.api.domain.User;
import com.upvote.api.dto.CanalRequest;
import com.upvote.api.dto.CanalResponse;
import com.upvote.api.exception.BusinessException;
import com.upvote.api.repository.CanalRepository;
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
     * Finds a channel by slug (public)
     */
    public CanalResponse getCanalBySlug(String slug) {
        Canal canal = canalRepository.findBySlug(slug)
                .orElseThrow(() -> new IllegalArgumentException("Canal não encontrado"));
        return toResponse(canal);
    }

    private CanalResponse toResponse(Canal canal) {
        return new CanalResponse(
                canal.getId(),
                canal.getName(),
                canal.getSlug(),
                canal.getApiKey(),
                canal.getWidgetColor(),
                canal.getCreatedAt()
        );
    }
}
