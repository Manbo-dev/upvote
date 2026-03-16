package com.upvote.api.service;

import com.upvote.api.domain.Organization;
import com.upvote.api.domain.Canal;
import com.upvote.api.domain.Subscription;
import com.upvote.api.dto.CanalRequest;
import com.upvote.api.dto.CanalResponse;
import com.upvote.api.exception.BusinessException;
import com.upvote.api.repository.OrganizationRepository;
import com.upvote.api.repository.CanalRepository;
import com.upvote.api.repository.SubscriptionRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.security.SecureRandom;
import java.util.HexFormat;
import java.util.List;
import java.util.UUID;

/**
 * Serviço para gerenciamento de canais de feedback
 */
@Service
@RequiredArgsConstructor
public class CanalService {

    private final CanalRepository canalRepository;
    private final OrganizationRepository organizationRepository;
    private final SubscriptionRepository subscriptionRepository;

    /**
     * Lista todos os canais das organizações do usuário
     */
    public List<CanalResponse> getCanaisByOwner(UUID userId) {
        List<Organization> orgs = organizationRepository.findByOwnerId(userId);
        return orgs.stream()
                .flatMap(org -> canalRepository.findByOrganizationId(org.getId()).stream())
                .map(this::toResponse)
                .toList();
    }

    /**
     * Cria um novo canal na primeira organização do usuário
     */
    @Transactional
    public CanalResponse createCanal(CanalRequest request, UUID userId) {
        Organization org = organizationRepository.findByOwnerId(userId)
                .stream().findFirst()
                .orElseThrow(() -> new IllegalStateException("Usuário não possui organização"));

        // Verifica limite de canais do plano
        Subscription subscription = subscriptionRepository.findByOrganizationId(org.getId())
                .orElseThrow(() -> new IllegalStateException("Assinatura não encontrada"));
        long canaisAtivos = canalRepository.countByOrganizationId(org.getId());
        if (canaisAtivos >= subscription.getPlano().getLimiteCanais()) {
            throw new BusinessException("Limite de canais do plano " + subscription.getPlano().name()
                    + " atingido (" + subscription.getPlano().getLimiteCanais() + "). Faça upgrade para criar mais canais.");
        }

        if (canalRepository.findBySlug(request.slug()).isPresent()) {
            throw new IllegalArgumentException("Slug já está em uso");
        }

        // Gera API key unica: prefixo "upv_" + 48 hex (24 bytes aleatorios)
        byte[] randomBytes = new byte[24];
        new SecureRandom().nextBytes(randomBytes);
        String apiKey = "upv_" + HexFormat.of().formatHex(randomBytes);

        Canal canal = Canal.builder()
                .name(request.name())
                .slug(request.slug())
                .apiKey(apiKey)
                .organization(org)
                .build();
        canal = canalRepository.save(canal);

        return toResponse(canal);
    }

    /**
     * Busca canal pelo slug (público)
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
