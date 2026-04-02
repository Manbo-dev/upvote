package com.upvote.api.service;

import com.upvote.api.domain.User;
import jakarta.mail.MessagingException;
import jakarta.mail.internet.MimeMessage;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.mail.javamail.MimeMessageHelper;
import org.springframework.stereotype.Service;
import org.thymeleaf.context.Context;
import org.thymeleaf.spring6.SpringTemplateEngine;

@Slf4j
@Service
@RequiredArgsConstructor
public class EmailService {

    private final JavaMailSender mailSender;
    private final SpringTemplateEngine templateEngine;

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
        } catch (MessagingException e) {
            log.warn("[EMAIL] Failed to send: to={}, subject={}, error={}", toEmail, subject, e.getMessage());
            // Don't rethrow — email failure must not break the API response
        }
    }
}
