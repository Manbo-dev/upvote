package com.upvote.api.service;

import com.upvote.api.domain.Canal;
import com.upvote.api.domain.FeedbackGroup;
import com.upvote.api.domain.FeedbackGroupStatus;
import com.upvote.api.domain.Subscription;
import com.upvote.api.domain.User;
import com.upvote.api.repository.CanalRepository;
import com.upvote.api.repository.FeedbackGroupRepository;
import com.upvote.api.repository.SubscriptionRepository;
import jakarta.mail.internet.MimeMessage;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.mail.javamail.MimeMessageHelper;
import org.springframework.stereotype.Service;
import org.thymeleaf.context.Context;
import org.thymeleaf.spring6.SpringTemplateEngine;

import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.stream.Collectors;

@Slf4j
@Service
@RequiredArgsConstructor
public class EmailService {

    private final JavaMailSender mailSender;
    private final SpringTemplateEngine templateEngine;
    private final SubscriptionRepository subscriptionRepository;
    private final CanalRepository canalRepository;
    private final FeedbackGroupRepository feedbackGroupRepository;

    @Value("${spring.mail.from}")
    private String fromAddress;

    @Value("${app.base-url:https://app.upvote.pro}")
    private String appBaseUrl;

    // ── Transactional emails ─────────────────────────────────────────────────

    public void sendWelcomeEmail(User user) {
        Context ctx = new Context();
        ctx.setVariable("userName", user.getName());
        ctx.setVariable("dashboardUrl", appBaseUrl + "/dashboard");

        String html = templateEngine.process("emails/welcome", ctx);
        send(user.getEmail(), "Bem-vindo ao Upvote!", html);
    }

    public void sendSubscriptionActivatedEmail(User user) {
        Subscription subscription = subscriptionRepository.findByUserId(user.getId()).orElse(null);
        if (subscription == null) {
            log.warn("[EMAIL] SUBSCRIPTION_ACTIVATED skipped: no subscription found for userId={}", user.getId());
            return;
        }

        Context ctx = new Context();
        ctx.setVariable("userName", user.getName());
        ctx.setVariable("plano", subscription.getPlano().name());
        ctx.setVariable("currentPeriodEnd", subscription.getCurrentPeriodEnd() != null
                ? subscription.getCurrentPeriodEnd().format(DateTimeFormatter.ofPattern("dd/MM/yyyy")) : null);
        ctx.setVariable("dashboardUrl", appBaseUrl + "/dashboard");
        ctx.setVariable("billingUrl", appBaseUrl + "/dashboard/billing");

        String html = templateEngine.process("emails/subscription_activated", ctx);
        log.info("[EMAIL] Sending SUBSCRIPTION_ACTIVATED: userId={}, plano={}", user.getId(), subscription.getPlano());
        send(user.getEmail(), "Sua assinatura " + subscription.getPlano().name() + " está ativa!", html);
    }

    public void sendSubscriptionUpdatedEmail(User user) {
        Subscription subscription = subscriptionRepository.findByUserId(user.getId()).orElse(null);
        if (subscription == null) {
            log.warn("[EMAIL] SUBSCRIPTION_UPDATED skipped: no subscription found for userId={}", user.getId());
            return;
        }

        Context ctx = new Context();
        ctx.setVariable("userName", user.getName());
        ctx.setVariable("plano", subscription.getPlano().name());
        ctx.setVariable("currentPeriodEnd", subscription.getCurrentPeriodEnd() != null
                ? subscription.getCurrentPeriodEnd().format(DateTimeFormatter.ofPattern("dd/MM/yyyy")) : null);
        ctx.setVariable("billingUrl", appBaseUrl + "/dashboard/billing");

        String html = templateEngine.process("emails/subscription_updated", ctx);
        log.info("[EMAIL] Sending SUBSCRIPTION_UPDATED: userId={}, plano={}", user.getId(), subscription.getPlano());
        send(user.getEmail(), "Seu plano foi atualizado para " + subscription.getPlano().name(), html);
    }

    public void sendSubscriptionCanceledEmail(User user) {
        Context ctx = new Context();
        ctx.setVariable("userName", user.getName());
        ctx.setVariable("billingUrl", appBaseUrl + "/dashboard/billing");

        String html = templateEngine.process("emails/subscription_canceled", ctx);
        log.info("[EMAIL] Sending SUBSCRIPTION_CANCELED: userId={}", user.getId());
        send(user.getEmail(), "Sua assinatura foi cancelada", html);
    }

    public void sendSubscriptionPaymentFailedEmail(User user) {
        Context ctx = new Context();
        ctx.setVariable("userName", user.getName());
        ctx.setVariable("billingUrl", appBaseUrl + "/dashboard/billing");

        String html = templateEngine.process("emails/subscription_payment_failed", ctx);
        log.info("[EMAIL] Sending SUBSCRIPTION_PAYMENT_FAILED: userId={}", user.getId());
        send(user.getEmail(), "Falha no pagamento — ação necessária", html);
    }

    public void sendMonthlyDigestEmail(User user) {
        List<Canal> canais = canalRepository.findByUserId(user.getId());
        if (canais.isEmpty()) {
            log.info("[EMAIL] MONTHLY_DIGEST skipped: no canals for userId={}", user.getId());
            return;
        }

        LocalDateTime thirtyDaysAgo = LocalDateTime.now().minusDays(30);
        List<Map<String, Object>> canalSummaries = new ArrayList<>();

        for (Canal canal : canais) {
            List<FeedbackGroup> groups = feedbackGroupRepository
                    .findByCanalIdAndStatusNotInOrderByVoteCountDesc(canal.getId(),
                            List.of(FeedbackGroupStatus.ARCHIVED, FeedbackGroupStatus.CLOSED));

            if (groups.isEmpty()) continue;

            Map<FeedbackGroupStatus, Long> countByStatus = groups.stream()
                    .collect(Collectors.groupingBy(FeedbackGroup::getStatus, Collectors.counting()));

            long newThisMonth = groups.stream()
                    .filter(fg -> fg.getCreatedAt().isAfter(thirtyDaysAgo))
                    .count();

            List<Map<String, Object>> topGroups = groups.stream()
                    .filter(fg -> fg.getStatus() != FeedbackGroupStatus.DONE)
                    .limit(3)
                    .map(fg -> {
                        Map<String, Object> g = new HashMap<>();
                        g.put("title", fg.getTitle());
                        g.put("voteCount", fg.getVoteCount());
                        g.put("status", fg.getStatus().name());
                        g.put("category", fg.getCategory().name());
                        return g;
                    })
                    .collect(Collectors.toList());

            Map<String, Object> summary = new HashMap<>();
            summary.put("name", canal.getName());
            summary.put("countOpen", countByStatus.getOrDefault(FeedbackGroupStatus.OPEN, 0L));
            summary.put("countPlanned", countByStatus.getOrDefault(FeedbackGroupStatus.PLANNED, 0L));
            summary.put("countInProgress", countByStatus.getOrDefault(FeedbackGroupStatus.IN_PROGRESS, 0L));
            summary.put("countDone", countByStatus.getOrDefault(FeedbackGroupStatus.DONE, 0L));
            summary.put("totalActive", (long) groups.size());
            summary.put("newThisMonth", newThisMonth);
            summary.put("topGroups", topGroups);
            canalSummaries.add(summary);
        }

        if (canalSummaries.isEmpty()) {
            log.info("[EMAIL] MONTHLY_DIGEST skipped: no active groups for userId={}", user.getId());
            return;
        }

        String monthLabel = LocalDateTime.now()
                .format(DateTimeFormatter.ofPattern("MMMM yyyy", new Locale("pt", "BR")));

        Context ctx = new Context();
        ctx.setVariable("userName", user.getName());
        ctx.setVariable("month", monthLabel);
        ctx.setVariable("canais", canalSummaries);
        ctx.setVariable("dashboardUrl", appBaseUrl + "/dashboard");

        String html = templateEngine.process("emails/monthly_digest", ctx);
        log.info("[EMAIL] Sending MONTHLY_DIGEST: userId={}, canals={}", user.getId(), canalSummaries.size());
        send(user.getEmail(), "Seu resumo mensal do Upvote — " + monthLabel, html);
    }

    // ── Security / code emails ───────────────────────────────────────────────

    public void sendPasswordResetCode(String toEmail, String code) {
        String body = "<p>Seu código para redefinir a senha é: <strong>" + code + "</strong></p>"
                + "<p>Este código expira em 10 minutos.</p>"
                + "<p>Se você não solicitou a redefinição de senha, ignore este email.</p>";
        send(toEmail, "Redefinir senha — Upvote", body);
    }

    public void sendPasswordChangeCode(String toEmail, String code) {
        String body = "<p>Seu código de verificação para trocar a senha é: <strong>" + code + "</strong></p>"
                + "<p>Este código expira em 10 minutos.</p>"
                + "<p>Se você não solicitou a troca de senha, ignore este email.</p>";
        send(toEmail, "Confirmação de troca de senha — Upvote", body);
    }

    // ── Internal ─────────────────────────────────────────────────────────────

    private void send(String toEmail, String subject, String htmlBody) {
        try {
            MimeMessage message = mailSender.createMimeMessage();
            MimeMessageHelper helper = new MimeMessageHelper(message, true, "UTF-8");
            helper.setFrom(fromAddress);
            helper.setTo(toEmail);
            helper.setSubject(subject);
            helper.setText(htmlBody, true);
            mailSender.send(message);
            log.info("[EMAIL] Sent: to={}, subject={}", toEmail, subject);
        } catch (Exception e) {
            log.warn("[EMAIL] Failed to send: to={}, subject={}, error={}", toEmail, subject, e.getMessage());
            // Don't rethrow — email failure must not break the queue consumer or API response
        }
    }
}
