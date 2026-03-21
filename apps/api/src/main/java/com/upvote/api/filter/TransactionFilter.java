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
import java.util.UUID;

/**
 * First filter in the chain — runs for every single request.
 *
 * <p>Sets {@code transactionId} in MDC so that every log line produced during the
 * request lifecycle automatically carries it. No manual plumbing required in
 * services or controllers.
 *
 * <p>The ID is accepted from the incoming {@code X-Transaction-Id} header when
 * present (e.g. the widget passes it), otherwise a new UUID is generated.
 * It is also written to the {@code X-Transaction-Id} response header so callers
 * can correlate client-side and server-side logs.
 */
@Component
@Order(1)
public class TransactionFilter extends OncePerRequestFilter {

    static final String MDC_KEY      = "transactionId";
    static final String REQUEST_HDR  = "X-Transaction-Id";
    static final String RESPONSE_HDR = "X-Transaction-Id";

    @Override
    protected void doFilterInternal(HttpServletRequest request,
                                    HttpServletResponse response,
                                    FilterChain chain) throws ServletException, IOException {
        String incoming = request.getHeader(REQUEST_HDR);
        String txId = (incoming != null && !incoming.isBlank())
                ? incoming
                : UUID.randomUUID().toString().replace("-", "").substring(0, 16);

        MDC.put(MDC_KEY, txId);
        response.setHeader(RESPONSE_HDR, txId);

        try {
            chain.doFilter(request, response);
        } finally {
            MDC.remove(MDC_KEY);
        }
    }
}
