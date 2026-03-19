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
        log.info("[STRIPE] Validação ok: orgId={}, plano={}", organizationId, planoDesejado);

        Subscription subscription = subscriptionRepository.findByOrganizationId(organizationId)
                .orElseThrow(() -> new ResourceNotFoundException("Assinatura não encontrada"));
        log.info("[STRIPE] Subscription encontrada: orgId={}, stripeStatus={}, stripeSubId={}",
                organizationId, subscription.getStripeStatus(), subscription.getStripeSubscriptionId());

        // Se já tem assinatura ativa no Stripe, redireciona para o portal
        if (subscription.getStripeSubscriptionId() != null && subscription.getStripeStatus() == StripeStatus.ACTIVE) {
            throw new BusinessException("Você já possui uma assinatura ativa. Use o portal para gerenciá-la.");
        }

        String priceId = planoDesejado == Plano.STARTER ? starterPriceId : proPriceId;
        log.info("[STRIPE] priceId selecionado: orgId={}, plano={}, priceId={}", organizationId, planoDesejado, priceId);

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

            log.info("[STRIPE] Chamando API Stripe: orgId={}, plano={}", organizationId, planoDesejado);
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
        log.info("[STRIPE] eventId={} Processando webhook: type={}", eventId, event.getType());

        switch (event.getType()) {
            case "checkout.session.completed" -> processarCheckoutCompleto(event, eventId);
            case "invoice.paid" -> processarFaturaPaga(event, eventId);
            case "invoice.payment_failed" -> processarFalhaFatura(event, eventId);
            case "customer.subscription.updated" -> processarAssinaturaAtualizada(event, eventId);
            case "customer.subscription.deleted" -> processarAssinaturaCancelada(event, eventId);

            default -> log.info("[STRIPE] eventId={} Evento não tratado: type={}", eventId, event.getType());
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

    // --- Utilitários ---

    /**
     * Extrai o subscription ID de um Invoice.
     * No SDK v31+, o campo migrou de invoice.subscription para invoice.parent.subscriptionDetails.subscription
     */
    private String extrairSubscriptionIdDaFatura(Invoice invoice) {
        if (invoice.getParent() != null
                && invoice.getParent().getSubscriptionDetails() != null) {
            return invoice.getParent().getSubscriptionDetails().getSubscription();
        }
        return null;
    }

    // --- Utilitários de deserialização ---

    /**
     * Extrai o objeto do evento Stripe. Tenta getObject() primeiro (seguro, requer mesma versão de API),
     * e faz fallback para deserializeUnsafe() quando as versões de API divergem.
     */
    private StripeObject extrairObjetoEvento(Event event, String eventId) {
        var deserializer = event.getDataObjectDeserializer();
        if (deserializer.getObject().isPresent()) {
            return deserializer.getObject().get();
        }
        // API version mismatch — tenta deserializar mesmo assim
        log.warn("[STRIPE] eventId={} Versão de API divergente, usando deserializeUnsafe()", eventId);
        try {
            return deserializer.deserializeUnsafe();
        } catch (Exception e) {
            log.error("[STRIPE] eventId={} Falha ao deserializar objeto do evento", eventId, e);
            return null;
        }
    }

    // --- Handlers de webhook ---

    private void processarCheckoutCompleto(Event event, String eventId) {
        com.stripe.model.checkout.Session session = (com.stripe.model.checkout.Session)
                extrairObjetoEvento(event, eventId);
        if (session == null) {
            log.warn("[STRIPE] eventId={} Falha ao deserializar dados da checkout session", eventId);
            return;
        }

        String orgIdStr = session.getClientReferenceId();
        if (orgIdStr == null) {
            log.warn("[STRIPE] eventId={} Checkout session sem clientReferenceId", eventId);
            return;
        }

        UUID orgId = UUID.fromString(orgIdStr);
        Subscription subscription = subscriptionRepository.findByOrganizationId(orgId).orElse(null);
        if (subscription == null) {
            log.warn("[STRIPE] eventId={} Nenhuma subscription encontrada para orgId={}", eventId, orgId);
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

        // Busca item ID e período da assinatura no Stripe (SDK v31+: current_period_end é item-level)
        try {
            com.stripe.model.Subscription stripeSub =
                    com.stripe.model.Subscription.retrieve(session.getSubscription());
            if (!stripeSub.getItems().getData().isEmpty()) {
                var item = stripeSub.getItems().getData().get(0);
                subscription.setStripeItemId(item.getId());
                if (item.getCurrentPeriodEnd() != null) {
                    subscription.setCurrentPeriodEnd(
                            LocalDateTime.ofInstant(Instant.ofEpochSecond(item.getCurrentPeriodEnd()), ZoneId.systemDefault())
                    );
                }
            }
        } catch (StripeException e) {
            log.warn("[STRIPE] eventId={} Falha ao buscar item da assinatura no Stripe", eventId, e);
        }

        subscriptionRepository.save(subscription);
        log.info("[STRIPE] eventId={} Checkout completo: orgId={}, plano={}, customerId={}, stripeSubId={}",
                eventId, orgId, plano, session.getCustomer(), session.getSubscription());
    }

    private void processarFaturaPaga(Event event, String eventId) {
        Invoice invoice = (Invoice) extrairObjetoEvento(event, eventId);
        String subId = invoice != null ? extrairSubscriptionIdDaFatura(invoice) : null;
        if (invoice == null || subId == null) {
            log.warn("[STRIPE] eventId={} Falha ao deserializar dados da fatura", eventId);
            return;
        }

        subscriptionRepository.findByStripeSubscriptionId(subId)
                .ifPresent(subscription -> {
                    subscription.setStripeStatus(StripeStatus.ACTIVE);
                    Long periodEnd = invoice.getPeriodEnd();
                    if (periodEnd != null) {
                        subscription.setCurrentPeriodEnd(
                                LocalDateTime.ofInstant(Instant.ofEpochSecond(periodEnd), ZoneId.systemDefault())
                        );
                    }

                    // Safety net: se o plano ainda é FREE após o pagamento, tenta corrigir
                    // buscando o plano diretamente no Stripe (indica falha no fluxo checkout.session.completed)
                    if (subscription.getPlano() == Plano.FREE) {
                        try {
                            com.stripe.model.Subscription stripeSub =
                                    com.stripe.model.Subscription.retrieve(subId);
                            if (!stripeSub.getItems().getData().isEmpty()) {
                                String priceId = stripeSub.getItems().getData().get(0).getPrice().getId();
                                Plano planoRecuperado = mapPriceIdToPlano(priceId);
                                if (planoRecuperado != null) {
                                    subscription.setPlano(planoRecuperado);
                                    log.warn("[STRIPE] eventId={} Safety net ativado: plano corrigido via invoice.paid: subId={}, plano={}",
                                            eventId, subId, planoRecuperado);
                                }
                            }
                        } catch (StripeException e) {
                            log.warn("[STRIPE] eventId={} Safety net falhou: erro ao buscar subscription no Stripe", eventId, e);
                        }
                    }

                    subscriptionRepository.save(subscription);
                    log.info("[STRIPE] eventId={} Fatura paga: subscriptionId={}, periodEnd={}, plano={}",
                            eventId, subId, periodEnd, subscription.getPlano());
                });
    }

    private void processarFalhaFatura(Event event, String eventId) {
        Invoice invoice = (Invoice) extrairObjetoEvento(event, eventId);
        String subId = invoice != null ? extrairSubscriptionIdDaFatura(invoice) : null;
        if (invoice == null || subId == null) {
            log.warn("[STRIPE] eventId={} Falha ao deserializar dados da fatura", eventId);
            return;
        }

        subscriptionRepository.findByStripeSubscriptionId(subId)
                .ifPresent(subscription -> {
                    subscription.setStripeStatus(StripeStatus.PAST_DUE);
                    subscriptionRepository.save(subscription);
                    log.warn("[STRIPE] eventId={} Falha no pagamento da fatura: subscriptionId={}", eventId, subId);
                });
    }

    private void processarAssinaturaAtualizada(Event event, String eventId) {
        com.stripe.model.Subscription stripeSub = (com.stripe.model.Subscription)
                extrairObjetoEvento(event, eventId);
        if (stripeSub == null) {
            log.warn("[STRIPE] eventId={} Falha ao deserializar dados da assinatura", eventId);
            return;
        }

        subscriptionRepository.findByStripeSubscriptionId(stripeSub.getId())
                .ifPresent(subscription -> {
                    subscription.setStripeStatus(mapStripeStatus(stripeSub.getStatus()));

                    Plano newPlano = subscription.getPlano();
                    if (!stripeSub.getItems().getData().isEmpty()) {
                        var item = stripeSub.getItems().getData().get(0);
                        subscription.setStripeItemId(item.getId());

                        Plano planoPorPriceId = mapPriceIdToPlano(item.getPrice().getId());
                        if (planoPorPriceId != null) {
                            newPlano = planoPorPriceId;
                            subscription.setPlano(newPlano);
                        } else {
                            log.warn("[STRIPE] eventId={} Plano mantido: priceId={} não mapeado, plano atual={}",
                                    eventId, item.getPrice().getId(), subscription.getPlano());
                        }

                        // current_period_end migrou para item level no SDK v31+
                        if (item.getCurrentPeriodEnd() != null) {
                            subscription.setCurrentPeriodEnd(
                                    LocalDateTime.ofInstant(Instant.ofEpochSecond(item.getCurrentPeriodEnd()), ZoneId.systemDefault())
                            );
                        }
                    }
                    subscriptionRepository.save(subscription);
                    log.info("[STRIPE] eventId={} Assinatura atualizada: stripeSubId={}, status={}, plano={}",
                            eventId, stripeSub.getId(), stripeSub.getStatus(), newPlano);
                });
    }

    private void processarAssinaturaCancelada(Event event, String eventId) {
        com.stripe.model.Subscription stripeSub = (com.stripe.model.Subscription)
                extrairObjetoEvento(event, eventId);
        if (stripeSub == null) {
            log.warn("[STRIPE] eventId={} Falha ao deserializar dados da assinatura", eventId);
            return;
        }

        subscriptionRepository.findByStripeSubscriptionId(stripeSub.getId())
                .ifPresent(subscription -> {
                    subscription.setPlano(Plano.FREE);
                    subscription.setStripeStatus(StripeStatus.CANCELED);
                    subscription.setStripeSubscriptionId(null);
                    subscriptionRepository.save(subscription);
                    log.info("[STRIPE] eventId={} Assinatura cancelada: stripeSubId={}, revertido para FREE", eventId, stripeSub.getId());
                });
    }

    // --- Utilitários ---

    private StripeStatus mapStripeStatus(String status) {
        return switch (status) {
            case "active" -> StripeStatus.ACTIVE;
            case "past_due" -> StripeStatus.PAST_DUE;
            case "canceled" -> StripeStatus.CANCELED;
            case "incomplete" -> StripeStatus.INCOMPLETE;
            case "incomplete_expired" -> StripeStatus.INCOMPLETE_EXPIRED;
            case "paused" -> StripeStatus.PAUSED;
            case "trialing" -> StripeStatus.TRIALING;
            case "unpaid" -> StripeStatus.UNPAID;
            default -> {
                log.warn("[STRIPE] Status desconhecido recebido do Stripe: {}", status);
                yield StripeStatus.ACTIVE;
            }
        };
    }

    private Plano mapPriceIdToPlano(String priceId) {
        if (priceId.equals(starterPriceId)) return Plano.STARTER;
        if (priceId.equals(proPriceId)) return Plano.PRO;
        // Retorna null em vez de FREE para evitar reset silencioso do plano
        // quando as env vars não batem com o priceId real do Stripe
        log.warn("[STRIPE] priceId não reconhecido: priceId={}, starterPriceId={}, proPriceId={}",
                priceId, starterPriceId, proPriceId);
        return null;
    }
}
