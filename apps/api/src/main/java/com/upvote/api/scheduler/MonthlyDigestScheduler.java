package com.upvote.api.scheduler;

import com.upvote.api.messaging.EmailMessage;
import com.upvote.api.messaging.EmailProducer;
import com.upvote.api.messaging.EmailType;
import com.upvote.api.repository.CanalRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

import java.util.List;
import java.util.UUID;

/**
 * Sends a monthly dashboard digest email to every user who owns at least one canal.
 * Runs on the first Monday of each month at 08:00.
 *
 * <p>The scheduler only enqueues one {@link EmailMessage} per user; the heavy lifting
 * (data aggregation and rendering) is done by {@link com.upvote.api.service.EmailService}.
 * If a user has no active feedback groups, EmailService silently skips the email.
 */
@Slf4j
@Component
@RequiredArgsConstructor
public class MonthlyDigestScheduler {

    private final EmailProducer emailProducer;
    private final CanalRepository canalRepository;

    @Scheduled(cron = "0 0 8 ? * MON#1")
    public void sendMonthlyDigests() {
        log.info("[DIGEST] Starting monthly digest job");

        List<UUID> userIds = canalRepository.findDistinctUserIds();
        log.info("[DIGEST] Found {} users with canals", userIds.size());

        int queued = 0;
        for (UUID userId : userIds) {
            try {
                emailProducer.send(new EmailMessage(EmailType.MONTHLY_DIGEST, userId));
                queued++;
            } catch (Exception e) {
                log.warn("[DIGEST] Failed to queue digest for userId={}, error={}", userId, e.getMessage());
            }
        }

        log.info("[DIGEST] Monthly digest job complete: queued={}, total={}", queued, userIds.size());
    }
}
