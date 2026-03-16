package com.upvote.api.controller;

import com.upvote.api.domain.Plano;
import com.upvote.api.dto.*;
import com.upvote.api.repository.OrganizationRepository;
import com.upvote.api.repository.UserRepository;
import com.upvote.api.service.StripeService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
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
        UUID orgId = getOrganizationId(userDetails);
        Plano plano = Plano.valueOf(request.plano().toUpperCase());
        CheckoutSessionResponse response = stripeService.criarCheckoutSession(
                orgId, plano, userDetails.getUsername());
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
