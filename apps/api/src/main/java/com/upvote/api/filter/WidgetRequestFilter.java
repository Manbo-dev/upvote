package com.upvote.api.filter;

import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.slf4j.MDC;
import org.springframework.core.annotation.Order;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;
import java.net.URI;

/**
 * Runs after {@link TransactionFilter} — only for widget requests (/api/widget/**).
 *
 * <p>Adds {@code widgetOrigin} to MDC: the domain of the site where the widget is
 * embedded, extracted from the {@code Origin} header (or the host part of {@code Referer}).
 * Combined with {@code transactionId} (set by TransactionFilter), every widget log line
 * shows exactly which site sent the request.
 */
@Component
@Order(2)
public class WidgetRequestFilter extends OncePerRequestFilter {

    private static final String MDC_WIDGET_ORIGIN = "widgetOrigin";

    @Override
    protected boolean shouldNotFilter(HttpServletRequest request) {
        return !request.getRequestURI().startsWith("/api/widget/");
    }

    @Override
    protected void doFilterInternal(HttpServletRequest request,
                                    HttpServletResponse response,
                                    FilterChain chain) throws ServletException, IOException {
        MDC.put(MDC_WIDGET_ORIGIN, resolveOrigin(request));
        try {
            chain.doFilter(request, response);
        } finally {
            MDC.remove(MDC_WIDGET_ORIGIN);
        }
    }

    /**
     * Prefers Origin header; falls back to the scheme+host of Referer; then "unknown".
     */
    private String resolveOrigin(HttpServletRequest request) {
        String origin = request.getHeader("Origin");
        if (origin != null && !origin.isBlank()) {
            return origin;
        }
        String referer = request.getHeader("Referer");
        if (referer != null && !referer.isBlank()) {
            try {
                URI uri = URI.create(referer);
                return uri.getScheme() + "://" + uri.getHost();
            } catch (Exception e) {
                return referer;
            }
        }
        return "unknown";
    }
}
