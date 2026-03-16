package com.upvote.api.controller;

import com.upvote.api.service.StripeService;
import jakarta.servlet.http.HttpServletRequest;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.io.IOException;
import java.nio.charset.StandardCharsets;

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
     * Recebe e processa eventos do Stripe via webhook.
     * Lê o payload bruto via InputStream para garantir verificação de assinatura.
     */
    @PostMapping("/webhook")
    public ResponseEntity<String> handleWebhook(
            HttpServletRequest request,
            @RequestHeader("Stripe-Signature") String sigHeader) throws IOException {
        String payload = new String(request.getInputStream().readAllBytes(), StandardCharsets.UTF_8);
        stripeService.processarWebhook(payload, sigHeader);
        return ResponseEntity.ok("OK");
    }
}
