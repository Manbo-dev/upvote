package com.upvote.api.service;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.stereotype.Service;

@Slf4j
@Service
@RequiredArgsConstructor
public class EmailService {

    private final JavaMailSender mailSender;

    public void sendPasswordResetCode(String toEmail, String code) {
        sendCode(toEmail, "Redefinir senha — Upvote",
                "Seu código para redefinir a senha é: " + code + "\n\nEste código expira em 10 minutos.\n\nSe você não solicitou a redefinição de senha, ignore este email.");
    }

    public void sendPasswordChangeCode(String toEmail, String code) {
        sendCode(toEmail, "Confirmação de troca de senha — Upvote",
                "Seu código de verificação para trocar a senha é: " + code + "\n\nEste código expira em 10 minutos.\n\nSe você não solicitou a troca de senha, ignore este email.");
    }

    private void sendCode(String toEmail, String subject, String body) {
        try {
            SimpleMailMessage message = new SimpleMailMessage();
            message.setTo(toEmail);
            message.setSubject(subject);
            message.setText(body);
            mailSender.send(message);
            log.info("[EMAIL] Código enviado para: email={}", toEmail);
        } catch (Exception e) {
            log.warn("[EMAIL] Falha ao enviar email: email={}, error={}", toEmail, e.getMessage());
            // Don't rethrow — email failure should not break the API response
            // When credentials are configured in a later step, this will work
        }
    }
}
