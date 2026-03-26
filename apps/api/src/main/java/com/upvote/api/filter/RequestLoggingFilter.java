package com.upvote.api.filter;

import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.extern.slf4j.Slf4j;
import org.springframework.core.annotation.Order;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;

/**
 * Logs every inbound request (method, URI, query string) and the matching response
 * status + elapsed time. Runs after {@link TransactionFilter} so that
 * {@code transactionId} is already in MDC when the log line is written.
 *
 * <p>Skips {@code /actuator/health} to avoid polling noise.
 */
@Slf4j
@Component
@Order(3)
public class RequestLoggingFilter extends OncePerRequestFilter {

    @Override
    protected boolean shouldNotFilter(HttpServletRequest request) {
        String uri = request.getRequestURI();
        return uri.startsWith("/actuator/health") || uri.startsWith("/actuator/prometheus");
    }

    @Override
    protected void doFilterInternal(HttpServletRequest request,
                                    HttpServletResponse response,
                                    FilterChain chain) throws ServletException, IOException {
        String method = request.getMethod();
        String uri = request.getRequestURI();

        long start = System.currentTimeMillis();
        try {
            chain.doFilter(request, response);
        } finally {
            long elapsed = System.currentTimeMillis() - start;
            log.info("[RESPONSE] {} {} → {} ({}ms)", method, uri, response.getStatus(), elapsed);
        }
    }
}
