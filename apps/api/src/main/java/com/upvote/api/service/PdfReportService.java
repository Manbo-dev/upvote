package com.upvote.api.service;

import com.openhtmltopdf.pdfboxout.PdfRendererBuilder;
import com.upvote.api.domain.*;
import com.upvote.api.repository.CanalRepository;
import com.upvote.api.repository.FeedbackGroupRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.thymeleaf.TemplateEngine;
import org.thymeleaf.context.Context;

import java.io.ByteArrayOutputStream;
import java.io.IOException;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.time.format.DateTimeFormatter;
import java.util.*;
import java.util.stream.Collectors;

/**
 * Generates professional PDF reports for a feedback channel.
 * Uses Thymeleaf to render an HTML template and OpenHTMLToPDF to convert it to PDF bytes.
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class PdfReportService {

    private static final DateTimeFormatter DATE_DISPLAY = DateTimeFormatter.ofPattern("dd/MM/yyyy");
    private static final DateTimeFormatter DATE_PARSE = DateTimeFormatter.ofPattern("yyyy-MM-dd");

    private final CanalRepository canalRepository;
    private final FeedbackGroupRepository feedbackGroupRepository;
    private final TemplateEngine templateEngine;

    public record TagFrequency(String tag, int count, int fontSizeHundredths) {}

    public byte[] generatePdf(
            String canalSlug,
            String statusParam,
            String categoryParam,
            String fromParam,
            String toParam
    ) {
        log.info("[REPORT] PDF generation: slug={}, status={}, category={}, from={}, to={}",
                canalSlug, statusParam, categoryParam, fromParam, toParam);

        Canal canal = canalRepository.findBySlug(canalSlug)
                .orElseThrow(() -> new IllegalArgumentException("Channel not found: " + canalSlug));

        List<FeedbackGroup> groups = fetchGroups(canal, statusParam, categoryParam);

        LocalDateTime from = parseDate(fromParam, true);
        LocalDateTime to = parseDate(toParam, false);
        if (from != null || to != null) {
            final LocalDateTime f = from;
            final LocalDateTime t = to;
            groups = groups.stream()
                    .filter(g -> (f == null || !g.getCreatedAt().isBefore(f))
                              && (t == null || !g.getCreatedAt().isAfter(t)))
                    .toList();
        }

        Map<String, Long> statusCounts = buildStatusCounts(groups);
        List<FeedbackGroup> topActive = buildTopActive(groups);
        List<FeedbackGroup> completed = buildCompleted(groups);
        List<TagFrequency> wordMap = buildWordMap(groups);
        String period = buildPeriodLabel(fromParam, toParam);
        String generatedAt = LocalDateTime.now()
                .format(DateTimeFormatter.ofPattern("dd/MM/yyyy 'às' HH:mm"));

        Context ctx = new Context();
        ctx.setVariable("canal", canal);
        ctx.setVariable("period", period);
        ctx.setVariable("generatedAt", generatedAt);
        ctx.setVariable("statusCounts", statusCounts);
        ctx.setVariable("topActive", topActive);
        ctx.setVariable("completed", completed);
        ctx.setVariable("wordMap", wordMap);

        String html = templateEngine.process("report", ctx);

        try (ByteArrayOutputStream out = new ByteArrayOutputStream()) {
            PdfRendererBuilder builder = new PdfRendererBuilder();
            builder.useFastMode();
            builder.withHtmlContent(html, null);
            builder.toStream(out);
            builder.run();
            log.info("[REPORT] PDF generated successfully: slug={}, groups={}, completed={}, tags={}",
                    canalSlug, groups.size(), completed.size(), wordMap.size());
            return out.toByteArray();
        } catch (IOException e) {
            log.error("[REPORT] PDF generation failed: slug={}", canalSlug, e);
            throw new RuntimeException("PDF generation failed", e);
        }
    }

    private List<FeedbackGroup> fetchGroups(Canal canal, String statusParam, String categoryParam) {
        boolean hasStatus = statusParam != null && !statusParam.isBlank();
        boolean hasCategory = categoryParam != null && !categoryParam.isBlank();

        if (hasStatus && hasCategory) {
            FeedbackGroupStatus status = FeedbackGroupStatus.valueOf(statusParam.toUpperCase());
            FeedbackGroupCategory category = FeedbackGroupCategory.valueOf(categoryParam.toUpperCase());
            return feedbackGroupRepository.findByCanalIdAndStatusAndCategoryOrderByVoteCountDesc(canal.getId(), status, category);
        } else if (hasStatus) {
            FeedbackGroupStatus status = FeedbackGroupStatus.valueOf(statusParam.toUpperCase());
            return feedbackGroupRepository.findByCanalIdAndStatusOrderByVoteCountDesc(canal.getId(), status);
        } else if (hasCategory) {
            FeedbackGroupCategory category = FeedbackGroupCategory.valueOf(categoryParam.toUpperCase());
            return feedbackGroupRepository.findByCanalIdAndCategoryOrderByVoteCountDesc(canal.getId(), category);
        } else {
            return feedbackGroupRepository.findByCanalIdOrderByVoteCountDesc(canal.getId());
        }
    }

    private Map<String, Long> buildStatusCounts(List<FeedbackGroup> groups) {
        Map<String, Long> counts = new LinkedHashMap<>();
        // Fixed order for display
        for (FeedbackGroupStatus s : new FeedbackGroupStatus[]{
                FeedbackGroupStatus.OPEN,
                FeedbackGroupStatus.PLANNED,
                FeedbackGroupStatus.IN_PROGRESS,
                FeedbackGroupStatus.DONE,
                FeedbackGroupStatus.CLOSED,
                FeedbackGroupStatus.ARCHIVED
        }) {
            counts.put(s.name(), groups.stream().filter(g -> g.getStatus() == s).count());
        }
        return counts;
    }

    private List<FeedbackGroup> buildTopActive(List<FeedbackGroup> groups) {
        Set<FeedbackGroupStatus> excluded = Set.of(
                FeedbackGroupStatus.DONE,
                FeedbackGroupStatus.ARCHIVED,
                FeedbackGroupStatus.CLOSED
        );
        return groups.stream()
                .filter(g -> !excluded.contains(g.getStatus()))
                .sorted(Comparator.comparingInt(FeedbackGroup::getVoteCount).reversed())
                .limit(5)
                .toList();
    }

    private List<FeedbackGroup> buildCompleted(List<FeedbackGroup> groups) {
        return groups.stream()
                .filter(g -> g.getStatus() == FeedbackGroupStatus.DONE
                          || g.getStatus() == FeedbackGroupStatus.ARCHIVED)
                .sorted(Comparator.comparingInt(FeedbackGroup::getVoteCount).reversed())
                .toList();
    }

    private List<TagFrequency> buildWordMap(List<FeedbackGroup> groups) {
        Map<String, Long> freq = groups.stream()
                .filter(g -> g.getTags() != null && !g.getTags().isBlank())
                .flatMap(g -> Arrays.stream(g.getTags().split(",")))
                .map(String::trim)
                .filter(t -> !t.isEmpty())
                .collect(Collectors.groupingBy(t -> t.toLowerCase(Locale.ROOT), Collectors.counting()));

        if (freq.isEmpty()) return List.of();

        long maxFreq = freq.values().stream().mapToLong(Long::longValue).max().orElse(1);

        return freq.entrySet().stream()
                .sorted(Map.Entry.<String, Long>comparingByValue().reversed())
                .limit(50)
                .map(e -> new TagFrequency(
                        e.getKey(),
                        e.getValue().intValue(),
                        computeFontSizeHundredths(e.getValue(), maxFreq)))
                .toList();
    }

    /** Maps frequency [1, maxFreq] → fontSizeHundredths [100, 300] (i.e. 1.0rem – 3.0rem) */
    private int computeFontSizeHundredths(long count, long maxFreq) {
        double ratio = (double) count / maxFreq;
        return (int) (100 + ratio * 200);
    }

    private LocalDateTime parseDate(String param, boolean startOfDay) {
        if (param == null || param.isBlank()) return null;
        LocalDate date = LocalDate.parse(param, DATE_PARSE);
        return startOfDay ? date.atStartOfDay() : date.atTime(LocalTime.MAX);
    }

    private String buildPeriodLabel(String fromParam, String toParam) {
        if ((fromParam == null || fromParam.isBlank()) && (toParam == null || toParam.isBlank())) {
            return "Todo o período";
        }
        String from = (fromParam != null && !fromParam.isBlank())
                ? LocalDate.parse(fromParam, DATE_PARSE).format(DATE_DISPLAY) : "–";
        String to = (toParam != null && !toParam.isBlank())
                ? LocalDate.parse(toParam, DATE_PARSE).format(DATE_DISPLAY) : "–";
        return from + " – " + to;
    }
}
