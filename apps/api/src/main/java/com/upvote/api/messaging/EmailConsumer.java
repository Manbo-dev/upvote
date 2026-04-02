package com.upvote.api.messaging;

import com.upvote.api.domain.User;
import com.upvote.api.repository.UserRepository;
import com.upvote.api.service.EmailService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.amqp.rabbit.annotation.RabbitListener;
import org.springframework.stereotype.Component;

/**
 * Consumes transactional email messages from the email.send queue.
 * Loads the full User from the database (minimal-payload pattern) and
 * delegates to EmailService for rendering and sending.
 *
 * <p>Retry is handled by the shared {@code SimpleRabbitListenerContainerFactory}:
 * 3 attempts with exponential backoff (1 s → 2 s → 4 s). After exhaustion the
 * message is routed to {@code email.dlq}.
 */
@Slf4j
@Component
@RequiredArgsConstructor
public class EmailConsumer {

    private final EmailService emailService;
    private final UserRepository userRepository;

    @RabbitListener(queues = RabbitMQConfig.EMAIL_QUEUE)
    public void handle(EmailMessage message) {
        log.info("Received email from queue: type={}, userId={}", message.type(), message.userId());

        User user = userRepository.findById(message.userId())
                .orElseThrow(() -> new IllegalStateException(
                        "User not found for email delivery: userId=" + message.userId()));

        switch (message.type()) {
            case WELCOME -> emailService.sendWelcomeEmail(user);
            default -> log.warn("Unknown email type, skipping: type={}", message.type());
        }
    }
}
