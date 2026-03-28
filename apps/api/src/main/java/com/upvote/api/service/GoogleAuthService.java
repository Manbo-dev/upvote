package com.upvote.api.service;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.upvote.api.dto.GoogleTokenInfo;
import com.upvote.api.exception.BusinessException;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.web.client.HttpStatusCodeException;
import org.springframework.web.client.RestClient;

/**
 * Validates Google ID tokens by calling the Google tokeninfo endpoint.
 * Follows the same RestClient + ObjectMapper pattern as JiraIntegrationService.
 */
@Service
@Slf4j
public class GoogleAuthService {

    private static final String TOKENINFO_URL = "https://oauth2.googleapis.com/tokeninfo";

    private final RestClient restClient;
    private final ObjectMapper objectMapper;

    @Value("${app.google.client-id:}")
    private String clientId;

    public GoogleAuthService(ObjectMapper objectMapper) {
        this.objectMapper = objectMapper;
        this.restClient = RestClient.create();
    }

    /**
     * Verifies a Google ID token and returns the parsed token info.
     *
     * @param idToken the ID token from Google Identity Services
     * @return parsed token info with sub, email, name
     * @throws BusinessException if the token is invalid, expired, or from a different app
     */
    public GoogleTokenInfo verifyIdToken(String idToken) {
        try {
            String responseBody = restClient.get()
                    .uri(TOKENINFO_URL + "?id_token=" + idToken)
                    .retrieve()
                    .body(String.class);

            GoogleTokenInfo tokenInfo = objectMapper.readValue(responseBody, GoogleTokenInfo.class);

            if (!clientId.equals(tokenInfo.aud())) {
                log.warn("[GOOGLE] Token audience mismatch: expected={}, got={}", clientId, tokenInfo.aud());
                throw new BusinessException("Invalid Google token");
            }

            if (!"true".equals(tokenInfo.emailVerified())) {
                log.warn("[GOOGLE] Token has unverified email: email={}", tokenInfo.email());
                throw new BusinessException("Google email not verified");
            }

            log.info("[GOOGLE] Token verified successfully: email={}", tokenInfo.email());
            return tokenInfo;

        } catch (HttpStatusCodeException e) {
            log.error("[GOOGLE] Token verification failed: status={}, body={}", e.getStatusCode(), e.getResponseBodyAsString(), e);
            throw new BusinessException("Invalid Google token", e);
        } catch (BusinessException e) {
            throw e;
        } catch (Exception e) {
            log.error("[GOOGLE] Token verification error: {}", e.getMessage(), e);
            throw new BusinessException("Google authentication failed", e);
        }
    }
}
