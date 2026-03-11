package com.upvote.api.service;

import com.upvote.api.domain.Organization;
import com.upvote.api.domain.Product;
import com.upvote.api.domain.User;
import com.upvote.api.dto.AuthResponse;
import com.upvote.api.dto.LoginRequest;
import com.upvote.api.dto.RegisterRequest;
import com.upvote.api.repository.OrganizationRepository;
import com.upvote.api.repository.ProductRepository;
import com.upvote.api.repository.UserRepository;
import com.upvote.api.security.JwtTokenProvider;
import lombok.RequiredArgsConstructor;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

/**
 * Serviço de autenticação: registro e login
 */
@Service
@RequiredArgsConstructor
public class AuthService {

    private final UserRepository userRepository;
    private final OrganizationRepository organizationRepository;
    private final ProductRepository productRepository;
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

        // Cria produto padrão
        Product product = Product.builder()
                .name("Meu Produto")
                .slug(orgSlug + "-produto")
                .organization(org)
                .build();
        productRepository.save(product);

        String token = jwtTokenProvider.generateToken(user.getEmail());
        return new AuthResponse(token, user.getName(), user.getEmail());
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

        String token = jwtTokenProvider.generateToken(user.getEmail());
        return new AuthResponse(token, user.getName(), user.getEmail());
    }
}
