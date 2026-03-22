package com.upvote.api.service;

import com.upvote.api.domain.*;
import com.upvote.api.repository.CanalRepository;
import com.upvote.api.repository.FeedbackGroupRepository;
import com.upvote.api.repository.FeedbackRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.time.format.DateTimeFormatter;
import java.util.List;

@Service
@RequiredArgsConstructor
public class ReportService {

    private static final DateTimeFormatter DATE_FORMATTER = DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm:ss");

    private final CanalRepository canalRepository;
    private final FeedbackGroupRepository feedbackGroupRepository;
    private final FeedbackRepository feedbackRepository;

    public String generateCsv(
            String canalSlug,
            String statusParam,
            String categoryParam,
            String fromParam,
            String toParam,
            boolean includeDetails
    ) {
        Canal canal = canalRepository.findBySlug(canalSlug)
                .orElseThrow(() -> new IllegalArgumentException("Channel not found"));

        boolean hasStatus = statusParam != null && !statusParam.isBlank();
        boolean hasCategory = categoryParam != null && !categoryParam.isBlank();

        LocalDateTime from = (fromParam != null && !fromParam.isBlank())
                ? LocalDate.parse(fromParam).atStartOfDay()
                : null;
        LocalDateTime to = (toParam != null && !toParam.isBlank())
                ? LocalDate.parse(toParam).atTime(LocalTime.MAX)
                : null;

        List<FeedbackGroup> groups;
        if (hasStatus && hasCategory) {
            FeedbackGroupStatus status = FeedbackGroupStatus.valueOf(statusParam.toUpperCase());
            FeedbackGroupCategory category = FeedbackGroupCategory.valueOf(categoryParam.toUpperCase());
            groups = feedbackGroupRepository.findByCanalIdAndStatusAndCategoryOrderByVoteCountDesc(canal.getId(), status, category);
        } else if (hasStatus) {
            FeedbackGroupStatus status = FeedbackGroupStatus.valueOf(statusParam.toUpperCase());
            groups = feedbackGroupRepository.findByCanalIdAndStatusOrderByVoteCountDesc(canal.getId(), status);
        } else if (hasCategory) {
            FeedbackGroupCategory category = FeedbackGroupCategory.valueOf(categoryParam.toUpperCase());
            groups = feedbackGroupRepository.findByCanalIdAndCategoryOrderByVoteCountDesc(canal.getId(), category);
        } else {
            groups = feedbackGroupRepository.findByCanalIdOrderByVoteCountDesc(canal.getId());
        }

        if (from != null || to != null) {
            final LocalDateTime f = from;
            final LocalDateTime t = to;
            groups = groups.stream()
                    .filter(g -> (f == null || !g.getCreatedAt().isBefore(f))
                              && (t == null || !g.getCreatedAt().isAfter(t)))
                    .toList();
        }

        StringBuilder csv = new StringBuilder();

        csv.append("# Groups\n");
        csv.append("id,title,category,status,votes,summary,topContext,tags,createdAt,updatedAt\n");
        for (FeedbackGroup group : groups) {
            String topContext = buildTopContext(group);
            csv.append(escapeCsv(group.getId().toString())).append(',')
               .append(escapeCsv(group.getTitle())).append(',')
               .append(escapeCsv(group.getCategory().name())).append(',')
               .append(escapeCsv(group.getStatus().name())).append(',')
               .append(group.getVoteCount()).append(',')
               .append(escapeCsv(group.getSummary())).append(',')
               .append(escapeCsv(topContext)).append(',')
               .append(escapeCsv(group.getTags())).append(',')
               .append(escapeCsv(group.getCreatedAt() != null ? group.getCreatedAt().format(DATE_FORMATTER) : "")).append(',')
               .append(escapeCsv(group.getUpdatedAt() != null ? group.getUpdatedAt().format(DATE_FORMATTER) : "")).append('\n');
        }

        if (includeDetails) {
            csv.append('\n');
            csv.append("# Feedbacks\n");
            csv.append("groupId,groupTitle,feedbackId,rawMessage,synthesizedMessage,pageUrl,pageTitle,triggerType,lastInteraction,deviceType,createdAt\n");
            for (FeedbackGroup group : groups) {
                List<Feedback> feedbacks = feedbackRepository.findByFeedbackGroupId(group.getId());
                for (Feedback feedback : feedbacks) {
                    csv.append(escapeCsv(group.getId().toString())).append(',')
                       .append(escapeCsv(group.getTitle())).append(',')
                       .append(escapeCsv(feedback.getId().toString())).append(',')
                       .append(escapeCsv(feedback.getRawMessage())).append(',')
                       .append(escapeCsv(feedback.getSynthesizedMessage())).append(',')
                       .append(escapeCsv(feedback.getPageUrl())).append(',')
                       .append(escapeCsv(feedback.getPageTitle())).append(',')
                       .append(escapeCsv(feedback.getTriggerType())).append(',')
                       .append(escapeCsv(feedback.getLastInteraction())).append(',')
                       .append(escapeCsv(feedback.getDeviceType())).append(',')
                       .append(escapeCsv(feedback.getCreatedAt() != null ? feedback.getCreatedAt().format(DATE_FORMATTER) : "")).append('\n');
                }
            }
        }

        return csv.toString();
    }

    private String buildTopContext(FeedbackGroup group) {
        List<Feedback> feedbacks = feedbackRepository.findByFeedbackGroupId(group.getId());
        if (feedbacks.isEmpty()) return "";
        return feedbacks.stream()
                .filter(f -> f.getLastInteraction() != null && !f.getLastInteraction().isBlank())
                .reduce((first, second) -> second)
                .map(f -> {
                    StringBuilder ctx = new StringBuilder();
                    if (f.getLastInteraction() != null) {
                        ctx.append("after '").append(f.getLastInteraction()).append("'");
                    }
                    if (f.getPageTitle() != null) {
                        ctx.append(" on ").append(f.getPageTitle());
                    }
                    return ctx.toString().trim();
                })
                .orElse("");
    }

    private String escapeCsv(String value) {
        if (value == null) return "";
        if (value.contains(",") || value.contains("\"") || value.contains("\n") || value.contains("\r")) {
            return "\"" + value.replace("\"", "\"\"") + "\"";
        }
        return value;
    }
}
