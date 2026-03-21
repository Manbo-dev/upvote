package com.upvote.api.messaging;

import com.upvote.api.service.FeedbackService;
import lombok.RequiredArgsConstructor;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.amqp.rabbit.annotation.RabbitListener;
import org.springframework.stereotype.Component;

/**
 * Consumes feedback processing messages and delegates to {@link FeedbackService}.
 *
 * <p>Retry policy (configured in {@link RabbitMQConfig}):
 * <ul>
 *   <li>Up to 3 attempts with exponential backoff (1 s → 2 s → 4 s)</li>
 *   <li>After all attempts fail, the message is routed to {@value RabbitMQConfig#DLQ}</li>
 * </ul>
 */
@Component
@RequiredArgsConstructor
public class FeedbackProcessingConsumer {

    private static final Logger log = LoggerFactory.getLogger(FeedbackProcessingConsumer.class);

    private final FeedbackService feedbackService;

    @RabbitListener(queues = RabbitMQConfig.QUEUE)
    public void handle(FeedbackProcessingMessage message) {
        log.info("Received feedback from queue: feedbackId={}", message.feedbackId());
        feedbackService.processFeedback(message.feedbackId());
    }
}
