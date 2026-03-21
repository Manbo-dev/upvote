package com.upvote.api.messaging;

import org.springframework.amqp.core.*;
import org.springframework.amqp.rabbit.config.RetryInterceptorBuilder;
import org.springframework.amqp.rabbit.config.SimpleRabbitListenerContainerFactory;
import org.springframework.amqp.rabbit.connection.ConnectionFactory;
import org.springframework.amqp.rabbit.core.RabbitTemplate;
import org.springframework.amqp.support.converter.Jackson2JsonMessageConverter;
import org.springframework.amqp.support.converter.MessageConverter;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.retry.interceptor.RetryOperationsInterceptor;

/**
 * RabbitMQ topology for the async feedback processing pipeline.
 *
 * <p>Flow:
 * <pre>
 *   feedback.exchange  ──routing-key──►  feedback.processing  ──(on failure)──►  feedback.dlq.exchange  ──►  feedback.dlq
 * </pre>
 *
 * <p>Retry strategy (container-level, in-memory):
 * <ul>
 *   <li>3 attempts with exponential backoff (1 s → 2 s → 4 s)</li>
 *   <li>After all attempts fail, the message is nacked and routed to the DLQ</li>
 * </ul>
 */
@Configuration
public class RabbitMQConfig {

    public static final String EXCHANGE          = "feedback.exchange";
    public static final String ROUTING_KEY       = "feedback.process";
    public static final String QUEUE             = "feedback.processing";

    public static final String DLQ_EXCHANGE      = "feedback.dlq.exchange";
    public static final String DLQ               = "feedback.dlq";

    // ── Exchanges ────────────────────────────────────────────────────────────

    @Bean
    DirectExchange feedbackExchange() {
        return new DirectExchange(EXCHANGE);
    }

    @Bean
    DirectExchange dlqExchange() {
        return new DirectExchange(DLQ_EXCHANGE);
    }

    // ── Queues ───────────────────────────────────────────────────────────────

    @Bean
    Queue feedbackQueue() {
        // On reject/nack, broker routes to DLQ exchange instead of dropping the message.
        return QueueBuilder.durable(QUEUE)
                .withArgument("x-dead-letter-exchange", DLQ_EXCHANGE)
                .withArgument("x-dead-letter-routing-key", DLQ)
                .build();
    }

    @Bean
    Queue deadLetterQueue() {
        return QueueBuilder.durable(DLQ).build();
    }

    // ── Bindings ─────────────────────────────────────────────────────────────

    @Bean
    Binding feedbackBinding(Queue feedbackQueue, DirectExchange feedbackExchange) {
        return BindingBuilder.bind(feedbackQueue).to(feedbackExchange).with(ROUTING_KEY);
    }

    @Bean
    Binding dlqBinding(Queue deadLetterQueue, DirectExchange dlqExchange) {
        return BindingBuilder.bind(deadLetterQueue).to(dlqExchange).with(DLQ);
    }

    // ── Message converter (JSON) ──────────────────────────────────────────────

    @Bean
    MessageConverter jsonMessageConverter() {
        return new Jackson2JsonMessageConverter();
    }

    @Bean
    RabbitTemplate rabbitTemplate(ConnectionFactory connectionFactory) {
        RabbitTemplate template = new RabbitTemplate(connectionFactory);
        template.setMessageConverter(jsonMessageConverter());
        return template;
    }

    // ── Listener container factory (with retry + DLQ routing) ────────────────

    @Bean
    SimpleRabbitListenerContainerFactory rabbitListenerContainerFactory(
            ConnectionFactory connectionFactory) {

        RetryOperationsInterceptor retryInterceptor = RetryInterceptorBuilder.stateless()
                .maxAttempts(3)
                .backOffOptions(1_000, 2.0, 10_000) // 1s, x2, max 10s
                .build();

        SimpleRabbitListenerContainerFactory factory = new SimpleRabbitListenerContainerFactory();
        factory.setConnectionFactory(connectionFactory);
        factory.setMessageConverter(jsonMessageConverter());
        // Do NOT requeue on final failure — let it go to DLQ.
        factory.setDefaultRequeueRejected(false);
        factory.setAdviceChain(retryInterceptor);

        return factory;
    }
}
