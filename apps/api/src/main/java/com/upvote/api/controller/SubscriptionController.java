package com.upvote.api.controller;

import com.upvote.api.domain.Plano;
import com.upvote.api.dto.*;
import com.upvote.api.repository.OrganizationRepository;
import com.upvote.api.repository.UserRepository;
import com.upvote.api.service.StripeService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;

import java.util.UUID;

/**
 * Controller para gerenciamento de assinaturas
 */
@RestController
@RequestMapping("/api/subscriptions")
@RequiredArgsConstructor
@Slf4j
public class SubscriptionController {

    private final StripeService stripeService;
    private final UserRepository userRepository;
    private final OrganizationRepository organizationRepository;

    /**
     * Retorna informações da assinatura atual
     */
    @GetMapping
    public ResponseEntity<ApiResponse<SubscriptionResponse>> getSubscription(
            @AuthenticationPrincipal UserDetails userDetails) {
        UUID orgId = getOrganizationId(userDetails);
        SubscriptionResponse response = stripeService.obterAssinatura(orgId);
        return ResponseEntity.ok(ApiResponse.ok(response));
    }

    /**
     * Cria sessão de checkout do Stripe
     */
    @PostMapping("/checkout")
    public ResponseEntity<ApiResponse<CheckoutSessionResponse>> createCheckout(
            @Valid @RequestBody CheckoutRequest request,
            @AuthenticationPrincipal UserDetails userDetails) {
        log.info("[CHECKOUT] Início: user={}, plano={}", userDetails.getUsername(), request.plano());
        Plano plano = Plano.valueOf(request.plano().toUpperCase());
        log.info("[CHECKOUT] Plano validado: plano={}", plano);
        UUID orgId = getOrganizationId(userDetails);
        log.info("[CHECKOUT] orgId resolvido: orgId={}, plano={}", orgId, plano);
        CheckoutSessionResponse response = stripeService.criarCheckoutSession(
                orgId, plano, userDetails.getUsername());
        log.info("[CHECKOUT] Sessão criada com sucesso: orgId={}, plano={}", orgId, plano);
        return ResponseEntity.ok(ApiResponse.ok(response));
    }

    /**
     * Cria sessão do Customer Portal do Stripe
     */
    @PostMapping("/portal")
    public ResponseEntity<ApiResponse<PortalSessionResponse>> createPortal(
            @AuthenticationPrincipal UserDetails userDetails) {
        UUID orgId = getOrganizationId(userDetails);
        PortalSessionResponse response = stripeService.criarPortalSession(orgId);
        return ResponseEntity.ok(ApiResponse.ok(response));
    }

    private UUID getOrganizationId(UserDetails userDetails) {
        var user = userRepository.findByEmail(userDetails.getUsername())
                .orElseThrow(() -> new IllegalStateException("Usuário não encontrado"));
        return organizationRepository.findByOwnerId(user.getId())
                .stream().findFirst()
                .orElseThrow(() -> new IllegalStateException("Organização não encontrada"))
                .getId();
    }
}
