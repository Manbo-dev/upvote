package com.upvote.api.controller;

import com.upvote.api.dto.ApiResponse;
import com.upvote.api.dto.ConfirmPasswordChangeRequest;
import com.upvote.api.dto.RequestPasswordChangeRequest;
import com.upvote.api.dto.UpdateProfileRequest;
import com.upvote.api.dto.UserProfileResponse;
import com.upvote.api.repository.UserRepository;
import com.upvote.api.service.UserService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;

import java.util.UUID;

@Slf4j
@RestController
@RequestMapping("/api/users")
@RequiredArgsConstructor
public class UserController {

    private final UserService userService;
    private final UserRepository userRepository;

    @GetMapping("/me")
    public ResponseEntity<ApiResponse<UserProfileResponse>> getProfile(
            @AuthenticationPrincipal UserDetails userDetails) {
        UUID userId = resolveUserId(userDetails);
        return ResponseEntity.ok(ApiResponse.ok(userService.getProfile(userId)));
    }

    @PutMapping("/me")
    public ResponseEntity<ApiResponse<UserProfileResponse>> updateProfile(
            @RequestBody UpdateProfileRequest request,
            @AuthenticationPrincipal UserDetails userDetails) {
        UUID userId = resolveUserId(userDetails);
        log.info("Profile update request: userId={}", userId);
        return ResponseEntity.ok(ApiResponse.ok(userService.updateProfile(userId, request)));
    }

    @PostMapping("/me/request-password-change")
    public ResponseEntity<ApiResponse<Void>> requestPasswordChange(
            @Valid @RequestBody RequestPasswordChangeRequest request,
            @AuthenticationPrincipal UserDetails userDetails) {
        UUID userId = resolveUserId(userDetails);
        userService.requestPasswordChange(userId, request.currentPassword(), request.newPassword());
        return ResponseEntity.ok(ApiResponse.ok(null, "Código enviado para seu email"));
    }

    @PostMapping("/me/confirm-password-change")
    public ResponseEntity<ApiResponse<Void>> confirmPasswordChange(
            @Valid @RequestBody ConfirmPasswordChangeRequest request,
            @AuthenticationPrincipal UserDetails userDetails) {
        UUID userId = resolveUserId(userDetails);
        userService.confirmPasswordChange(userId, request.code());
        return ResponseEntity.ok(ApiResponse.ok(null, "Senha alterada com sucesso"));
    }

    private UUID resolveUserId(UserDetails userDetails) {
        return userRepository.findByEmail(userDetails.getUsername())
                .orElseThrow(() -> new IllegalStateException("User not found"))
                .getId();
    }
}
