package com.upvote.api.service;

import com.upvote.api.domain.Canal;
import com.upvote.api.domain.PasswordResetCode;
import com.upvote.api.domain.Plano;
import com.upvote.api.domain.Subscription;
import com.upvote.api.domain.TeamMember;
import com.upvote.api.domain.User;
import com.upvote.api.dto.AuthResponse;
import com.upvote.api.dto.GoogleTokenInfo;
import com.upvote.api.dto.LoginRequest;
import com.upvote.api.dto.RegisterRequest;
import com.upvote.api.messaging.EmailMessage;
import com.upvote.api.messaging.EmailProducer;
import com.upvote.api.messaging.EmailType;
import com.upvote.api.repository.CanalRepository;
import com.upvote.api.repository.PasswordResetCodeRepository;
import com.upvote.api.repository.SubscriptionRepository;
import com.upvote.api.repository.UserRepository;
import com.upvote.api.security.JwtTokenProvider;
import lombok.RequiredArgsConstructor;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.transaction.support.TransactionSynchronization;
import org.springframework.transaction.support.TransactionSynchronizationManager;

import java.security.SecureRandom;
import java.time.LocalDateTime;
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
    private final EmailService emailService;
    private final EmailProducer emailProducer;
    private final PasswordResetCodeRepository codeRepository;
    private final UserContextResolver userContextResolver;
    private final TeamService teamService;

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

        // Accept invite if one was provided (must happen before afterCommit so token is cleared in same tx)
        if (request.inviteToken() != null && !request.inviteToken().isBlank()) {
            teamService.acceptInvite(request.inviteToken(), user);
        }

        // Queue welcome email — published after commit so the consumer finds the user in the DB
        final User savedUser = user;
        TransactionSynchronizationManager.registerSynchronization(new TransactionSynchronization() {
            @Override
            public void afterCommit() {
                emailProducer.send(new EmailMessage(EmailType.WELCOME, savedUser.getId()));
            }
        });

        String token = jwtTokenProvider.generateToken(user.getEmail());
        return buildAuthResponse(token, user);
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

        String token = jwtTokenProvider.generateToken(user.getEmail());
        return buildAuthResponse(token, user);
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

        // Fast path: user already linked this Google account — do NOT override avatar
        Optional<User> byGoogleId = userRepository.findByGoogleId(googleId);
        if (byGoogleId.isPresent()) {
            User user = byGoogleId.get();
            return buildAuthResponse(jwtTokenProvider.generateToken(email), user);
        }

        // Merge case: user registered via email/password, now signing in with same email via Google
        Optional<User> byEmail = userRepository.findByEmail(email);
        if (byEmail.isPresent()) {
            User user = byEmail.get();
            if (user.getGoogleId() == null) {
                user.setGoogleId(googleId);
            }
            // Backfill avatar if not already set
            if (user.getAvatar() == null && tokenInfo.picture() != null) {
                user.setAvatar(tokenInfo.picture());
            }
            userRepository.save(user);
            return buildAuthResponse(jwtTokenProvider.generateToken(email), user);
        }

        // New user: create account without password, set avatar from Google profile
        User user = User.builder()
                .name(name)
                .email(email)
                .googleId(googleId)
                .avatar(tokenInfo.picture())
                .build();
        user = userRepository.save(user);

        Subscription subscription = Subscription.builder()
                .user(user)
                .plano(Plano.FREE)
                .build();
        subscriptionRepository.save(subscription);

        // Queue welcome email for new Google users — same pattern as email/password registration
        final User savedUser = user;
        TransactionSynchronizationManager.registerSynchronization(new TransactionSynchronization() {
            @Override
            public void afterCommit() {
                emailProducer.send(new EmailMessage(EmailType.WELCOME, savedUser.getId()));
            }
        });

        return buildAuthResponse(jwtTokenProvider.generateToken(email), user);
    }

    /**
     * Sends a password reset code to the given email.
     * Silently ignores unknown emails to avoid user enumeration.
     */
    @Transactional
    public void forgotPassword(String email) {
        Optional<User> userOpt = userRepository.findByEmail(email);
        if (userOpt.isEmpty()) {
            // Don't reveal if email exists
            return;
        }
        User user = userOpt.get();
        codeRepository.invalidatePreviousCodes(user.getId(), PasswordResetCode.CodeType.PASSWORD_RESET);

        String code = generateCode();
        PasswordResetCode record = PasswordResetCode.builder()
                .user(user)
                .code(code)
                .type(PasswordResetCode.CodeType.PASSWORD_RESET)
                .expiresAt(LocalDateTime.now().plusMinutes(10))
                .used(false)
                .build();
        codeRepository.save(record);

        emailService.sendPasswordResetCode(email, code);
    }

    /**
     * Validates the reset code and updates the user's password.
     */
    @Transactional
    public void resetPassword(String email, String code, String newPassword) {
        PasswordResetCode record = codeRepository.findByCodeAndUsedFalse(code)
                .orElseThrow(() -> new IllegalArgumentException("Código inválido ou já utilizado"));
        if (!record.getUser().getEmail().equals(email)) {
            throw new IllegalArgumentException("Código inválido");
        }
        if (record.getType() != PasswordResetCode.CodeType.PASSWORD_RESET) {
            throw new IllegalArgumentException("Código inválido");
        }
        if (record.getExpiresAt().isBefore(LocalDateTime.now())) {
            throw new IllegalArgumentException("Código expirado. Solicite um novo.");
        }

        User user = record.getUser();
        user.setPasswordHash(passwordEncoder.encode(newPassword));
        userRepository.save(user);

        record.setUsed(true);
        codeRepository.save(record);
    }

    private String generateCode() {
        SecureRandom random = new SecureRandom();
        return String.format("%06d", random.nextInt(1_000_000));
    }

    /**
     * Builds an AuthResponse enriched with team context.
     * If the user is an ACTIVE member of another account, the response reflects the
     * owner's plan, memberRole="MEMBER", and workspaceName=owner's name.
     * Otherwise memberRole="OWNER" and workspaceName=user's own name.
     */
    private AuthResponse buildAuthResponse(String token, User user) {
        Optional<TeamMember> membership = userContextResolver.findActiveMembership(user.getId());
        if (membership.isPresent()) {
            TeamMember m = membership.get();
            User owner = m.getOwner();
            String ownerPlano = subscriptionRepository.findByUserId(owner.getId())
                    .map(sub -> sub.getPlano().name())
                    .orElse(Plano.FREE.name());
            return new AuthResponse(token, user.getName(), user.getEmail(),
                    ownerPlano, user.getAvatar(), "MEMBER", owner.getName());
        }
        String plano = subscriptionRepository.findByUserId(user.getId())
                .map(sub -> sub.getPlano().name())
                .orElse(Plano.FREE.name());
        return new AuthResponse(token, user.getName(), user.getEmail(),
                plano, user.getAvatar(), "OWNER", user.getName());
    }
}
