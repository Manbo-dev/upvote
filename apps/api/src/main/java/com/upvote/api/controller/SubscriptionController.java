package com.upvote.api.controller;

import com.upvote.api.domain.Plano;
import com.upvote.api.dto.*;
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
 * Controller for subscription management
 */
@RestController
@RequestMapping("/api/subscriptions")
@RequiredArgsConstructor
@Slf4j
public class SubscriptionController {

    private final StripeService stripeService;
    private final UserRepository userRepository;

    /**
     * Returns current subscription info
     */
    @GetMapping
    public ResponseEntity<ApiResponse<SubscriptionResponse>> getSubscription(
            @AuthenticationPrincipal UserDetails userDetails) {
        UUID userId = getUserId(userDetails);
        SubscriptionResponse response = stripeService.obterAssinatura(userId);
        return ResponseEntity.ok(ApiResponse.ok(response));
    }

    /**
     * Creates a Stripe checkout session
     */
    @PostMapping("/checkout")
    public ResponseEntity<ApiResponse<CheckoutSessionResponse>> createCheckout(
            @Valid @RequestBody CheckoutRequest request,
            @AuthenticationPrincipal UserDetails userDetails) {
        log.info("[CHECKOUT] Início: user={}, plano={}", userDetails.getUsername(), request.plano());
        Plano plano = Plano.valueOf(request.plano().toUpperCase());
        log.info("[CHECKOUT] Plano validado: plano={}", plano);
        UUID userId = getUserId(userDetails);
        log.info("[CHECKOUT] userId resolvido: userId={}, plano={}", userId, plano);
        CheckoutSessionResponse response = stripeService.criarCheckoutSession(
                userId, plano, userDetails.getUsername());
        log.info("[CHECKOUT] Sessão criada com sucesso: userId={}, plano={}", userId, plano);
        return ResponseEntity.ok(ApiResponse.ok(response));
    }

    /**
     * Creates a Stripe Customer Portal session
     */
    @PostMapping("/portal")
    public ResponseEntity<ApiResponse<PortalSessionResponse>> createPortal(
            @AuthenticationPrincipal UserDetails userDetails) {
        UUID userId = getUserId(userDetails);
        PortalSessionResponse response = stripeService.criarPortalSession(userId);
        return ResponseEntity.ok(ApiResponse.ok(response));
    }

    private UUID getUserId(UserDetails userDetails) {
        return userRepository.findByEmail(userDetails.getUsername())
                .orElseThrow(() -> new IllegalStateException("Usuário não encontrado"))
                .getId();
    }
}
