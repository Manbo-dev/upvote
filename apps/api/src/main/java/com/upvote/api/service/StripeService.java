package com.upvote.api.service;

import com.stripe.exception.SignatureVerificationException;
import com.stripe.exception.StripeException;
import com.stripe.model.*;
import com.stripe.model.billingportal.Session;
import com.stripe.net.Webhook;
import com.stripe.param.checkout.SessionCreateParams;
import com.upvote.api.domain.Plano;
import com.upvote.api.domain.StripeStatus;
import com.upvote.api.domain.Subscription;
import com.upvote.api.dto.CheckoutSessionResponse;
import com.upvote.api.dto.PortalSessionResponse;
import com.upvote.api.dto.SubscriptionResponse;
import com.upvote.api.exception.BusinessException;
import com.upvote.api.exception.ResourceNotFoundException;
import com.upvote.api.repository.CanalRepository;
import com.upvote.api.repository.SubscriptionRepository;
import com.upvote.api.repository.SuggestionRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.time.LocalDateTime;
import java.time.ZoneId;
import java.time.temporal.TemporalAdjusters;
import java.util.Map;
import java.util.UUID;

/**
 * Serviço para integração com Stripe: checkout, portal e webhooks
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class StripeService {

    private final SubscriptionRepository subscriptionRepository;
    private final CanalRepository canalRepository;
    private final SuggestionRepository suggestionRepository;

    @Value("${app.stripe.webhook-secret}")
    private String webhookSecret;

    @Value("${app.stripe.starter-price-id}")
    private String starterPriceId;

    @Value("${app.stripe.pro-price-id}")
    private String proPriceId;

    @Value("${app.cors.allowed-origins}")
    private String allowedOrigins;

    /**
     * Cria uma sessão de checkout do Stripe para o plano desejado
     */
    public CheckoutSessionResponse criarCheckoutSession(UUID organizationId, Plano planoDesejado, String userEmail) {
        if (planoDesejado != Plano.STARTER && planoDesejado != Plano.PRO) {
            throw new BusinessException("Apenas os planos STARTER e PRO podem ser assinados via checkout");
        }

        Subscription subscription = subscriptionRepository.findByOrganizationId(organizationId)
                .orElseThrow(() -> new ResourceNotFoundException("Assinatura não encontrada"));

        // Se já tem assinatura ativa no Stripe, redireciona para o portal
        if (subscription.getStripeSubscriptionId() != null && subscription.getStripeStatus() == StripeStatus.ACTIVE) {
            throw new BusinessException("Você já possui uma assinatura ativa. Use o portal para gerenciá-la.");
        }

        String priceId = planoDesejado == Plano.STARTER ? starterPriceId : proPriceId;
        String frontendUrl = allowedOrigins.split(",")[0].trim();

        try {
            SessionCreateParams.Builder paramsBuilder = SessionCreateParams.builder()
                    .setMode(SessionCreateParams.Mode.SUBSCRIPTION)
                    .setCustomerEmail(userEmail)
                    .setClientReferenceId(organizationId.toString())
                    .setSuccessUrl(frontendUrl + "/dashboard/billing?success=true")
                    .setCancelUrl(frontendUrl + "/dashboard/billing?canceled=true")
                    .putMetadata("plano", planoDesejado.name())
                    .addLineItem(
                            SessionCreateParams.LineItem.builder()
                                    .setPrice(priceId)
                                    .setQuantity(1L)
                                    .build()
                    );

            com.stripe.model.checkout.Session session = com.stripe.model.checkout.Session.create(paramsBuilder.build());
            log.info("[STRIPE] orgId={} Checkout session created: plan={}, sessionId={}", organizationId, planoDesejado, session.getId());
            return new CheckoutSessionResponse(session.getUrl());
        } catch (StripeException e) {
            log.error("[STRIPE] orgId={} Failed to create checkout session: plan={}", organizationId, planoDesejado, e);
            throw new BusinessException("Erro ao iniciar checkout. Tente novamente.");
        }
    }

    /**
     * Cria uma sessão do Customer Portal do Stripe
     */
    public PortalSessionResponse criarPortalSession(UUID organizationId) {
        Subscription subscription = subscriptionRepository.findByOrganizationId(organizationId)
                .orElseThrow(() -> new ResourceNotFoundException("Assinatura não encontrada"));

        if (subscription.getStripeCustomerId() == null) {
            throw new BusinessException("Nenhuma assinatura Stripe encontrada. Assine um plano primeiro.");
        }

        String frontendUrl = allowedOrigins.split(",")[0].trim();

        try {
            var params = com.stripe.param.billingportal.SessionCreateParams.builder()
                    .setCustomer(subscription.getStripeCustomerId())
                    .setReturnUrl(frontendUrl + "/dashboard/billing")
                    .build();

            Session portalSession = Session.create(params);
            log.info("[STRIPE] orgId={} Portal session created", organizationId);
            return new PortalSessionResponse(portalSession.getUrl());
        } catch (StripeException e) {
            log.error("[STRIPE] orgId={} Failed to create portal session", organizationId, e);
            throw new BusinessException("Erro ao abrir portal de assinatura. Tente novamente.");
        }
    }

    /**
     * Processa webhook do Stripe com verificação de assinatura
     */
    @Transactional
    public void processarWebhook(String payload, String sigHeader) {
        Event event;
        try {
            event = Webhook.constructEvent(payload, sigHeader, webhookSecret);
        } catch (SignatureVerificationException e) {
            log.warn("[STRIPE] Invalid webhook signature: sigHeader={}", sigHeader, e);
            throw new BusinessException("Assinatura de webhook inválida");
        }

        String eventId = event.getId();
        log.info("[STRIPE] eventId={} Processing webhook event: type={}", eventId, event.getType());

        switch (event.getType()) {
            case "checkout.session.completed" -> processarCheckoutCompleto(event, eventId);
            case "invoice.paid" -> processarFaturaPaga(event, eventId);
            case "invoice.payment_failed" -> processarFalhaFatura(event, eventId);
            case "customer.subscription.updated" -> processarAssinaturaAtualizada(event, eventId);
            case "customer.subscription.deleted" -> processarAssinaturaCancelada(event, eventId);
            default -> log.info("[STRIPE] eventId={} Unhandled event type: {}", eventId, event.getType());
        }
    }

    /**
     * Retorna informações da assinatura com uso atual
     */
    public SubscriptionResponse obterAssinatura(UUID organizationId) {
        Subscription subscription = subscriptionRepository.findByOrganizationId(organizationId)
                .orElseThrow(() -> new ResourceNotFoundException("Assinatura não encontrada"));

        long canaisAtivos = canalRepository.countByOrganizationId(organizationId);

        LocalDateTime inicioMes = LocalDateTime.now()
                .with(TemporalAdjusters.firstDayOfMonth())
                .withHour(0).withMinute(0).withSecond(0).withNano(0);
        long sugestoesUsadasMes = suggestionRepository.countByOrganizationIdAndMesAtual(organizationId, inicioMes);

        Plano plano = subscription.getPlano();
        return new SubscriptionResponse(
                plano.name(),
                subscription.getStripeStatus() != null ? subscription.getStripeStatus().name() : null,
                subscription.getCurrentPeriodEnd(),
                plano.getLimiteCanais(),
                canaisAtivos,
                plano.getLimiteSugestoesMes(),
                sugestoesUsadasMes,
                plano.isWidgetHabilitado()
        );
    }

    // --- Handlers de webhook ---

    private void processarCheckoutCompleto(Event event, String eventId) {
        com.stripe.model.checkout.Session session = (com.stripe.model.checkout.Session)
                event.getDataObjectDeserializer().getObject().orElse(null);
        if (session == null) {
            log.warn("[STRIPE] eventId={} Failed to deserialize checkout session data", eventId);
            return;
        }

        String orgIdStr = session.getClientReferenceId();
        if (orgIdStr == null) {
            log.warn("[STRIPE] eventId={} Checkout session has no clientReferenceId", eventId);
            return;
        }

        UUID orgId = UUID.fromString(orgIdStr);
        Subscription subscription = subscriptionRepository.findByOrganizationId(orgId).orElse(null);
        if (subscription == null) {
            log.warn("[STRIPE] eventId={} No subscription found for orgId={}", eventId, orgId);
            return;
        }

        // Determina o plano pela metadata
        Map<String, String> metadata = session.getMetadata();
        String planoStr = metadata != null ? metadata.get("plano") : null;
        Plano plano = planoStr != null ? Plano.valueOf(planoStr) : Plano.STARTER;

        subscription.setStripeCustomerId(session.getCustomer());
        subscription.setStripeSubscriptionId(session.getSubscription());
        subscription.setPlano(plano);
        subscription.setStripeStatus(StripeStatus.ACTIVE);

        // Busca período da assinatura no Stripe
        try {
            com.stripe.model.Subscription stripeSub =
                    com.stripe.model.Subscription.retrieve(session.getSubscription());
            subscription.setCurrentPeriodEnd(
                    LocalDateTime.ofInstant(
                            Instant.ofEpochSecond(stripeSub.getCurrentPeriodEnd()),
                            ZoneId.systemDefault()
                    )
            );
        } catch (StripeException e) {
            log.warn("[STRIPE] eventId={} Failed to retrieve subscription period from Stripe", eventId, e);
        }

        subscriptionRepository.save(subscription);
        log.info("[STRIPE] eventId={} Checkout completed: orgId={}, plan={}, customerId={}", eventId, orgId, plano, session.getCustomer());
    }

    private void processarFaturaPaga(Event event, String eventId) {
        Invoice invoice = (Invoice) event.getDataObjectDeserializer().getObject().orElse(null);
        if (invoice == null || invoice.getSubscription() == null) {
            log.warn("[STRIPE] eventId={} Failed to deserialize invoice data", eventId);
            return;
        }

        subscriptionRepository.findByStripeSubscriptionId(invoice.getSubscription())
                .ifPresent(subscription -> {
                    subscription.setStripeStatus(StripeStatus.ACTIVE);
                    Long periodEnd = invoice.getPeriodEnd();
                    if (periodEnd != null) {
                        subscription.setCurrentPeriodEnd(
                                LocalDateTime.ofInstant(Instant.ofEpochSecond(periodEnd), ZoneId.systemDefault())
                        );
                    }
                    subscriptionRepository.save(subscription);
                    log.info("[STRIPE] eventId={} Invoice paid: subscriptionId={}, periodEnd={}", eventId, invoice.getSubscription(), periodEnd);
                });
    }

    private void processarFalhaFatura(Event event, String eventId) {
        Invoice invoice = (Invoice) event.getDataObjectDeserializer().getObject().orElse(null);
        if (invoice == null || invoice.getSubscription() == null) {
            log.warn("[STRIPE] eventId={} Failed to deserialize invoice data", eventId);
            return;
        }

        subscriptionRepository.findByStripeSubscriptionId(invoice.getSubscription())
                .ifPresent(subscription -> {
                    subscription.setStripeStatus(StripeStatus.PAST_DUE);
                    subscriptionRepository.save(subscription);
                    log.warn("[STRIPE] eventId={} Invoice payment failed: subscriptionId={}", eventId, invoice.getSubscription());
                });
    }

    private void processarAssinaturaAtualizada(Event event, String eventId) {
        com.stripe.model.Subscription stripeSub = (com.stripe.model.Subscription)
                event.getDataObjectDeserializer().getObject().orElse(null);
        if (stripeSub == null) {
            log.warn("[STRIPE] eventId={} Failed to deserialize subscription data", eventId);
            return;
        }

        subscriptionRepository.findByStripeSubscriptionId(stripeSub.getId())
                .ifPresent(subscription -> {
                    subscription.setStripeStatus(mapStripeStatus(stripeSub.getStatus()));

                    Plano newPlano = subscription.getPlano();
                    if (!stripeSub.getItems().getData().isEmpty()) {
                        String priceId = stripeSub.getItems().getData().get(0).getPrice().getId();
                        newPlano = mapPriceIdToPlano(priceId);
                        subscription.setPlano(newPlano);
                    }

                    subscription.setCurrentPeriodEnd(
                            LocalDateTime.ofInstant(
                                    Instant.ofEpochSecond(stripeSub.getCurrentPeriodEnd()),
                                    ZoneId.systemDefault()
                            )
                    );
                    subscriptionRepository.save(subscription);
                    log.info("[STRIPE] eventId={} Subscription updated: stripeSubId={}, status={}, plan={}", eventId, stripeSub.getId(), stripeSub.getStatus(), newPlano);
                });
    }

    private void processarAssinaturaCancelada(Event event, String eventId) {
        com.stripe.model.Subscription stripeSub = (com.stripe.model.Subscription)
                event.getDataObjectDeserializer().getObject().orElse(null);
        if (stripeSub == null) {
            log.warn("[STRIPE] eventId={} Failed to deserialize subscription data", eventId);
            return;
        }

        subscriptionRepository.findByStripeSubscriptionId(stripeSub.getId())
                .ifPresent(subscription -> {
                    subscription.setPlano(Plano.FREE);
                    subscription.setStripeStatus(StripeStatus.CANCELED);
                    subscription.setStripeSubscriptionId(null);
                    subscriptionRepository.save(subscription);
                    log.info("[STRIPE] eventId={} Subscription canceled: stripeSubId={}, reverted to FREE", eventId, stripeSub.getId());
                });
    }

    // --- Utilitários ---

    private StripeStatus mapStripeStatus(String status) {
        return switch (status) {
            case "active" -> StripeStatus.ACTIVE;
            case "past_due" -> StripeStatus.PAST_DUE;
            case "canceled" -> StripeStatus.CANCELED;
            case "incomplete" -> StripeStatus.INCOMPLETE;
            default -> StripeStatus.ACTIVE;
        };
    }

    private Plano mapPriceIdToPlano(String priceId) {
        if (priceId.equals(starterPriceId)) return Plano.STARTER;
        if (priceId.equals(proPriceId)) return Plano.PRO;
        return Plano.FREE;
    }
}
