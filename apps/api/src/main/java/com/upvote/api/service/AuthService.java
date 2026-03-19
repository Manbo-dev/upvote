package com.upvote.api.service;

import com.upvote.api.domain.Canal;
import com.upvote.api.domain.Plano;
import com.upvote.api.domain.Subscription;
import com.upvote.api.domain.User;
import com.upvote.api.dto.AuthResponse;
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

        // Generate unique API key for the default canal
        byte[] randomBytes = new byte[24];
        new SecureRandom().nextBytes(randomBytes);
        String apiKey = "upv_" + HexFormat.of().formatHex(randomBytes);

        String slug = request.name().toLowerCase()
                .replaceAll("[^a-z0-9]+", "-")
                .replaceAll("^-|-$", "");

        Canal canal = Canal.builder()
                .name("Meu Canal")
                .slug(slug + "-canal")
                .apiKey(apiKey)
                .user(user)
                .build();
        canalRepository.save(canal);

        String token = jwtTokenProvider.generateToken(user.getEmail());
        return new AuthResponse(token, user.getName(), user.getEmail(), Plano.FREE.name());
    }

    /**
     * Performs login and returns a JWT token
     */
    public AuthResponse login(LoginRequest request) {
        User user = userRepository.findByEmail(request.email())
                .orElseThrow(() -> new IllegalArgumentException("Credenciais inválidas"));

        if (!passwordEncoder.matches(request.password(), user.getPasswordHash())) {
            throw new IllegalArgumentException("Credenciais inválidas");
        }

        String plano = subscriptionRepository.findByUserId(user.getId())
                .map(sub -> sub.getPlano().name())
                .orElse(Plano.FREE.name());

        String token = jwtTokenProvider.generateToken(user.getEmail());
        return new AuthResponse(token, user.getName(), user.getEmail(), plano);
    }
}
