package com.upvote.api.service;

import com.upvote.api.domain.PasswordResetCode;
import com.upvote.api.domain.PasswordResetCode.CodeType;
import com.upvote.api.domain.Plano;
import com.upvote.api.domain.User;
import com.upvote.api.dto.UpdateProfileRequest;
import com.upvote.api.dto.UserProfileResponse;
import com.upvote.api.exception.BusinessException;
import com.upvote.api.repository.PasswordResetCodeRepository;
import com.upvote.api.repository.SubscriptionRepository;
import com.upvote.api.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.security.SecureRandom;
import java.time.LocalDateTime;
import java.util.UUID;

@Slf4j
@Service
@RequiredArgsConstructor
public class UserService {

    private final UserRepository userRepository;
    private final SubscriptionRepository subscriptionRepository;
    private final PasswordResetCodeRepository codeRepository;
    private final PasswordEncoder passwordEncoder;
    private final EmailService emailService;

    public UserProfileResponse getProfile(UUID userId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new IllegalStateException("User not found"));
        String plano = subscriptionRepository.findByUserId(userId)
                .map(s -> s.getPlano().name())
                .orElse(Plano.FREE.name());
        return new UserProfileResponse(user.getName(), user.getEmail(), user.getAvatar(), plano);
    }

    @Transactional
    public UserProfileResponse updateProfile(UUID userId, UpdateProfileRequest request) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new IllegalStateException("User not found"));

        if (request.name() != null && !request.name().isBlank()) {
            user.setName(request.name().trim());
        }
        if (request.avatar() != null) {
            user.setAvatar(request.avatar().isBlank() ? null : request.avatar());
        }
        userRepository.save(user);
        log.info("Profile updated: userId={}", userId);

        String plano = subscriptionRepository.findByUserId(userId)
                .map(s -> s.getPlano().name())
                .orElse(Plano.FREE.name());
        return new UserProfileResponse(user.getName(), user.getEmail(), user.getAvatar(), plano);
    }

    @Transactional
    public void requestPasswordChange(UUID userId, String currentPassword, String newPassword) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new IllegalStateException("User not found"));

        if (user.getPasswordHash() == null) {
            throw new BusinessException("Conta social não possui senha para alterar");
        }
        if (!passwordEncoder.matches(currentPassword, user.getPasswordHash())) {
            throw new BusinessException("Senha atual incorreta");
        }

        // Invalidate any previous change codes
        codeRepository.invalidatePreviousCodes(userId, CodeType.PASSWORD_CHANGE);

        String code = generateCode();
        String newHash = passwordEncoder.encode(newPassword);

        PasswordResetCode record = PasswordResetCode.builder()
                .user(user)
                .code(code)
                .type(CodeType.PASSWORD_CHANGE)
                .newPasswordHash(newHash)
                .expiresAt(LocalDateTime.now().plusMinutes(10))
                .used(false)
                .build();
        codeRepository.save(record);

        emailService.sendPasswordChangeCode(user.getEmail(), code);
        log.info("Password change code sent: userId={}", userId);
    }

    @Transactional
    public void confirmPasswordChange(UUID userId, String code) {
        PasswordResetCode record = codeRepository.findByCodeAndUsedFalse(code)
                .orElseThrow(() -> new BusinessException("Código inválido ou já utilizado"));

        if (!record.getUser().getId().equals(userId)) {
            throw new BusinessException("Código inválido");
        }
        if (record.getType() != CodeType.PASSWORD_CHANGE) {
            throw new BusinessException("Código inválido");
        }
        if (record.getExpiresAt().isBefore(LocalDateTime.now())) {
            throw new BusinessException("Código expirado. Solicite um novo código.");
        }

        User user = record.getUser();
        user.setPasswordHash(record.getNewPasswordHash());
        userRepository.save(user);

        record.setUsed(true);
        codeRepository.save(record);
        log.info("Password changed via settings: userId={}", userId);
    }

    private String generateCode() {
        SecureRandom random = new SecureRandom();
        return String.format("%06d", random.nextInt(1_000_000));
    }
}
