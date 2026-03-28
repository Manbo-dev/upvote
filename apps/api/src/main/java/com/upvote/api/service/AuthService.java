package com.upvote.api.service;

import com.upvote.api.domain.Canal;
import com.upvote.api.domain.Plano;
import com.upvote.api.domain.Subscription;
import com.upvote.api.domain.User;
import com.upvote.api.dto.AuthResponse;
import com.upvote.api.dto.GoogleTokenInfo;
import com.upvote.api.dto.LoginRequest;
import com.upvote.api.dto.RegisterRequest;
import com.upvote.api.repository.CanalRepository;
import com.upvote.api.repository.SubscriptionRepository;
import com.upvote.api.repository.UserRepository;
import com.upvote.api.security.JwtTokenProvider;
import lombok.RequiredArgsConstructor;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.security.SecureRandom;
import java.util.HexFormat;
import java.util.Optional;

/**
 * Authentication service: registration and login
 */
@Service
@RequiredArgsConstructor
public class AuthService {

    private final UserRepository userRepository;
    private final CanalRepository canalRepository;
    private final SubscriptionRepository subscriptionRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtTokenProvider jwtTokenProvider;
    private final GoogleAuthService googleAuthService;

    /**
     * Registers a new user, creates default subscription and canal
     */
    @Transactional
    public AuthResponse register(RegisterRequest request) {
        if (userRepository.existsByEmail(request.email())) {
            throw new IllegalArgumentException("Email já está em uso");
        }

        User user = User.builder()
                .name(request.name())
                .email(request.email())
                .passwordHash(passwordEncoder.encode(request.password()))
                .build();
        user = userRepository.save(user);

        // Create default FREE subscription
        Subscription subscription = Subscription.builder()
                .user(user)
                .plano(Plano.FREE)
                .build();
        subscriptionRepository.save(subscription);

        String token = jwtTokenProvider.generateToken(user.getEmail());
        return new AuthResponse(token, user.getName(), user.getEmail(), Plano.FREE.name());
    }

    /**
     * Performs login and returns a JWT token
     */
    public AuthResponse login(LoginRequest request) {
        User user = userRepository.findByEmail(request.email())
                .orElseThrow(() -> new IllegalArgumentException("Credenciais inválidas"));

        if (user.getPasswordHash() == null || !passwordEncoder.matches(request.password(), user.getPasswordHash())) {
            throw new IllegalArgumentException("Credenciais inválidas");
        }

        String plano = subscriptionRepository.findByUserId(user.getId())
                .map(sub -> sub.getPlano().name())
                .orElse(Plano.FREE.name());

        String token = jwtTokenProvider.generateToken(user.getEmail());
        return new AuthResponse(token, user.getName(), user.getEmail(), plano);
    }

    /**
     * Authenticates or registers a user via Google ID token.
     * Handles three cases: existing google_id (fast path), existing email (merge), new user.
     */
    @Transactional
    public AuthResponse googleLogin(String idToken) {
        GoogleTokenInfo tokenInfo = googleAuthService.verifyIdToken(idToken);

        String email = tokenInfo.email();
        String name = tokenInfo.name();
        String googleId = tokenInfo.sub();

        // Fast path: user already linked this Google account
        Optional<User> byGoogleId = userRepository.findByGoogleId(googleId);
        if (byGoogleId.isPresent()) {
            User user = byGoogleId.get();
            String plano = subscriptionRepository.findByUserId(user.getId())
                    .map(sub -> sub.getPlano().name())
                    .orElse(Plano.FREE.name());
            return new AuthResponse(jwtTokenProvider.generateToken(email), user.getName(), email, plano);
        }

        // Merge case: user registered via email/password, now signing in with same email via Google
        Optional<User> byEmail = userRepository.findByEmail(email);
        if (byEmail.isPresent()) {
            User user = byEmail.get();
            if (user.getGoogleId() == null) {
                user.setGoogleId(googleId);
                userRepository.save(user);
            }
            String plano = subscriptionRepository.findByUserId(user.getId())
                    .map(sub -> sub.getPlano().name())
                    .orElse(Plano.FREE.name());
            return new AuthResponse(jwtTokenProvider.generateToken(email), user.getName(), email, plano);
        }

        // New user: create account without password
        User user = User.builder()
                .name(name)
                .email(email)
                .googleId(googleId)
                .build();
        user = userRepository.save(user);

        Subscription subscription = Subscription.builder()
                .user(user)
                .plano(Plano.FREE)
                .build();
        subscriptionRepository.save(subscription);

        return new AuthResponse(jwtTokenProvider.generateToken(email), name, email, Plano.FREE.name());
    }
}
