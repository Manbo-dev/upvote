package com.upvote.api.controller;

import com.upvote.api.exception.BusinessException;
import com.upvote.api.repository.SubscriptionRepository;
import com.upvote.api.service.PdfReportService;
import com.upvote.api.service.ReportService;
import com.upvote.api.service.UserContextResolver;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.time.format.DateTimeFormatter;
import java.util.UUID;

/**
 * Provides CSV and PDF export for feedback groups.
 * PDF export requires STARTER plan or above.
 */
@RestController
@RequiredArgsConstructor
@Slf4j
public class ReportController {

    private final ReportService reportService;
    private final PdfReportService pdfReportService;
    private final UserContextResolver userContextResolver;
    private final SubscriptionRepository subscriptionRepository;

    /**
     * Exports feedback groups for a channel as a CSV file.
     *
     * @param slug           the channel slug
     * @param status         optional status filter (e.g. DONE, OPEN)
     * @param category       optional category filter (e.g. BUG, SUGGESTION)
     * @param from           optional start date (yyyy-MM-dd, inclusive)
     * @param to             optional end date (yyyy-MM-dd, inclusive)
     * @param includeDetails if true, appends a second section with individual feedbacks
     */
    @GetMapping("/api/canais/{slug}/report.csv")
    public ResponseEntity<String> exportCsv(
            @PathVariable String slug,
            @RequestParam(required = false) String status,
            @RequestParam(required = false) String category,
            @RequestParam(required = false) String from,
            @RequestParam(required = false) String to,
            @RequestParam(defaultValue = "false") boolean includeDetails
    ) {
        String csv = reportService.generateCsv(slug, status, category, from, to, includeDetails);

        String filename = "feedback-" + slug + "-"
                + LocalDate.now().format(DateTimeFormatter.ofPattern("yyyyMMdd")) + ".csv";

        HttpHeaders headers = new HttpHeaders();
        headers.add(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=\"" + filename + "\"");

        return ResponseEntity.ok()
                .headers(headers)
                .contentType(org.springframework.http.MediaType.parseMediaType("text/csv; charset=UTF-8"))
                .body(csv);
    }

    /**
     * Exports a professional PDF report for a channel. Requires STARTER plan or above.
     *
     * @param slug     the channel slug
     * @param status   optional status filter
     * @param category optional category filter
     * @param from     optional start date (yyyy-MM-dd, inclusive)
     * @param to       optional end date (yyyy-MM-dd, inclusive)
     */
    @GetMapping("/api/canais/{slug}/report.pdf")
    public ResponseEntity<byte[]> exportPdf(
            @PathVariable String slug,
            @RequestParam(required = false) String status,
            @RequestParam(required = false) String category,
            @RequestParam(required = false) String from,
            @RequestParam(required = false) String to,
            @AuthenticationPrincipal UserDetails userDetails
    ) {
        log.info("GET /api/canais/{}/report.pdf: user={}", slug, userDetails.getUsername());
        requirePdfAccess(userDetails);

        byte[] pdf = pdfReportService.generatePdf(slug, status, category, from, to);

        String filename = "feedback-" + slug + "-"
                + LocalDate.now().format(DateTimeFormatter.ofPattern("yyyyMMdd")) + ".pdf";

        HttpHeaders headers = new HttpHeaders();
        headers.add(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=\"" + filename + "\"");

        return ResponseEntity.ok()
                .headers(headers)
                .contentType(MediaType.APPLICATION_PDF)
                .body(pdf);
    }

    private void requirePdfAccess(UserDetails userDetails) {
        UUID ownerId = userContextResolver.resolveOwnerId(userDetails.getUsername());
        boolean allowed = subscriptionRepository.findByUserId(ownerId)
                .map(s -> s.getPlano().isPdfReportEnabled())
                .orElse(false);
        if (!allowed) {
            throw new BusinessException("PDF export requires STARTER plan or above. Upgrade to access this feature.");
        }
    }
}
