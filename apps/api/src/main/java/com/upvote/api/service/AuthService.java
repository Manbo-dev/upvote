package com.upvote.api.service;

import com.upvote.api.domain.Canal;
import com.upvote.api.domain.Organization;
import com.upvote.api.domain.Plano;
import com.upvote.api.domain.Subscription;
import com.upvote.api.domain.User;
import com.upvote.api.dto.AuthResponse;
import com.upvote.api.dto.LoginRequest;
import com.upvote.api.dto.RegisterRequest;
import com.upvote.api.repository.OrganizationRepository;
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
 * Serviço de autenticação: registro e login
 */
@Service
@RequiredArgsConstructor
public class AuthService {

    private final UserRepository userRepository;
    private final OrganizationRepository organizationRepository;
    private final CanalRepository canalRepository;
    private final SubscriptionRepository subscriptionRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtTokenProvider jwtTokenProvider;

    /**
     * Registra um novo usuário, cria organização e produto padrão
     */
    @Transactional
    public AuthResponse register(RegisterRequest request) {
        if (userRepository.existsByEmail(request.email())) {
            throw new IllegalArgumentException("Email já está em uso");
        }

        // Cria o usuário
        User user = User.builder()
                .name(request.name())
                .email(request.email())
                .passwordHash(passwordEncoder.encode(request.password()))
                .build();
        user = userRepository.save(user);

        // Cria organização padrão
        String orgSlug = request.name().toLowerCase()
                .replaceAll("[^a-z0-9]+", "-")
                .replaceAll("^-|-$", "");
        Organization org = Organization.builder()
                .name("Org de " + request.name())
                .slug(orgSlug + "-org")
                .owner(user)
                .build();
        organizationRepository.save(org);

        // Cria assinatura FREE padrão
        Subscription subscription = Subscription.builder()
                .organization(org)
                .plano(Plano.FREE)
                .build();
        subscriptionRepository.save(subscription);

        // Gera API key única para o canal padrão
        byte[] randomBytes = new byte[24];
        new SecureRandom().nextBytes(randomBytes);
        String apiKey = "upv_" + HexFormat.of().formatHex(randomBytes);

        // Cria canal padrão
        Canal canal = Canal.builder()
                .name("Meu Canal")
                .slug(orgSlug + "-canal")
                .apiKey(apiKey)
                .organization(org)
                .build();
        canalRepository.save(canal);

        String token = jwtTokenProvider.generateToken(user.getEmail());
        return new AuthResponse(token, user.getName(), user.getEmail(), Plano.FREE.name());
    }

    /**
     * Realiza login e retorna token JWT
     */
    public AuthResponse login(LoginRequest request) {
        User user = userRepository.findByEmail(request.email())
                .orElseThrow(() -> new IllegalArgumentException("Credenciais inválidas"));

        if (!passwordEncoder.matches(request.password(), user.getPasswordHash())) {
            throw new IllegalArgumentException("Credenciais inválidas");
        }

        // Busca o plano da organização do usuário
        String plano = organizationRepository.findByOwnerId(user.getId()).stream()
                .findFirst()
                .flatMap(org -> subscriptionRepository.findByOrganizationId(org.getId()))
                .map(sub -> sub.getPlano().name())
                .orElse(Plano.FREE.name());

        String token = jwtTokenProvider.generateToken(user.getEmail());
        return new AuthResponse(token, user.getName(), user.getEmail(), plano);
    }
}
