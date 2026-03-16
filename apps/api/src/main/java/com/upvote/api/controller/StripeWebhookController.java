package com.upvote.api.controller;

import com.upvote.api.service.StripeService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

/**
 * Controller para receber webhooks do Stripe (endpoint público)
 */
@Slf4j
@RestController
@RequestMapping("/api/stripe")
@RequiredArgsConstructor
public class StripeWebhookController {

    private final StripeService stripeService;

    /**
     * Recebe e processa eventos do Stripe via webhook
     */
    @PostMapping("/webhook")
    public ResponseEntity<String> handleWebhook(
            @RequestBody String payload,
            @RequestHeader("Stripe-Signature") String sigHeader) {
        stripeService.processarWebhook(payload, sigHeader);
        return ResponseEntity.ok("OK");
    }
}
