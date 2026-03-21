package com.upvote.api.messaging;

import lombok.RequiredArgsConstructor;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.amqp.rabbit.core.RabbitTemplate;
import org.springframework.stereotype.Component;

/**
 * Publishes feedback processing messages to RabbitMQ.
 */
@Component
@RequiredArgsConstructor
public class FeedbackProducer {

    private static final Logger log = LoggerFactory.getLogger(FeedbackProducer.class);

    private final RabbitTemplate rabbitTemplate;

    public void send(FeedbackProcessingMessage message) {
        log.info("Publishing feedback to processing queue: feedbackId={}", message.feedbackId());
        rabbitTemplate.convertAndSend(RabbitMQConfig.EXCHANGE, RabbitMQConfig.ROUTING_KEY, message);
    }
}
