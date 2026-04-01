package com.upvote.api.service;

import com.nimbusds.jose.JWSAlgorithm;
import com.nimbusds.jose.jwk.source.JWKSource;
import com.nimbusds.jose.jwk.source.RemoteJWKSet;
import com.nimbusds.jose.proc.JWSVerificationKeySelector;
import com.nimbusds.jose.proc.SecurityContext;
import com.nimbusds.jwt.JWTClaimsSet;
import com.nimbusds.jwt.SignedJWT;
import com.nimbusds.jwt.proc.ConfigurableJWTProcessor;
import com.nimbusds.jwt.proc.DefaultJWTProcessor;
import com.upvote.api.dto.AppleTokenInfo;
import com.upvote.api.exception.BusinessException;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import java.net.URL;
import java.util.Date;

/**
 * Validates Apple ID tokens by fetching Apple's JWKS and verifying the token locally.
 * Uses nimbus-jose-jwt RemoteJWKSet which caches keys and refreshes automatically on kid miss.
 */
@Service
@Slf4j
public class AppleAuthService {

    private static final String APPLE_JWKS_URL = "https://appleid.apple.com/auth/keys";
    private static final String APPLE_ISSUER = "https://appleid.apple.com";

    @Value("${app.apple.client-id:}")
    private String clientId;

    private final JWKSource<SecurityContext> jwkSource;

    public AppleAuthService() throws Exception {
        this.jwkSource = new RemoteJWKSet<>(new URL(APPLE_JWKS_URL));
    }

    /**
     * Verifies an Apple ID token and returns the parsed claims.
     *
     * @param idToken the ID token from Apple Sign In JS SDK
     * @return parsed token info with sub, email (may be null on repeat sign-ins)
     * @throws BusinessException if the token is invalid, expired, or from a different app
     */
    public AppleTokenInfo verifyIdToken(String idToken) {
        try {
            SignedJWT jwt = SignedJWT.parse(idToken);

            JWSVerificationKeySelector<SecurityContext> keySelector =
                    new JWSVerificationKeySelector<>(JWSAlgorithm.RS256, jwkSource);

            ConfigurableJWTProcessor<SecurityContext> processor = new DefaultJWTProcessor<>();
            processor.setJWSKeySelector(keySelector);

            JWTClaimsSet claims = processor.process(jwt, null);

            if (!APPLE_ISSUER.equals(claims.getIssuer())) {
                log.warn("[APPLE] Token issuer mismatch: expected={}, got={}", APPLE_ISSUER, claims.getIssuer());
                throw new BusinessException("Invalid Apple token issuer");
            }

            if (!claims.getAudience().contains(clientId)) {
                log.warn("[APPLE] Token audience mismatch: expected={}, got={}", clientId, claims.getAudience());
                throw new BusinessException("Invalid Apple token");
            }

            if (claims.getExpirationTime() == null || claims.getExpirationTime().before(new Date())) {
                throw new BusinessException("Apple token expired");
            }

            String email = claims.getStringClaim("email");
            boolean emailVerified = Boolean.parseBoolean(
                    String.valueOf(claims.getClaim("email_verified")));

            log.info("[APPLE] Token verified successfully: sub={}", claims.getSubject());
            return new AppleTokenInfo(claims.getSubject(), email, clientId, emailVerified);

        } catch (BusinessException e) {
            throw e;
        } catch (Exception e) {
            log.error("[APPLE] Token verification error: {}", e.getMessage(), e);
            throw new BusinessException("Apple authentication failed", e);
        }
    }
}
