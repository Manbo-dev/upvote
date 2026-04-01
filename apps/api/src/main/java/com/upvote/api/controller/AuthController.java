package com.upvote.api.controller;

import com.upvote.api.dto.ApiResponse;
import com.upvote.api.dto.AppleLoginRequest;
import com.upvote.api.dto.AuthResponse;
import com.upvote.api.dto.GoogleLoginRequest;
import com.upvote.api.dto.LoginRequest;
import com.upvote.api.dto.RegisterRequest;
import com.upvote.api.service.AuthService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

/**
 * Controller de autenticação: registro e login
 */
@Slf4j
@RestController
@RequestMapping("/api/auth")
@RequiredArgsConstructor
public class AuthController {

    private final AuthService authService;

    @PostMapping("/register")
    public ResponseEntity<ApiResponse<AuthResponse>> register(@Valid @RequestBody RegisterRequest request) {
        AuthResponse response = authService.register(request);
        return ResponseEntity.ok(ApiResponse.ok(response, "Usuário registrado com sucesso"));
    }

    @PostMapping("/login")
    public ResponseEntity<ApiResponse<AuthResponse>> login(@Valid @RequestBody LoginRequest request) {
        log.info("Login recebido — email: {}", request.email());
        AuthResponse response = authService.login(request);
        return ResponseEntity.ok(ApiResponse.ok(response));
    }

    @PostMapping("/google")
    public ResponseEntity<ApiResponse<AuthResponse>> googleLogin(@Valid @RequestBody GoogleLoginRequest request) {
        log.info("Google login attempt received");
        AuthResponse response = authService.googleLogin(request.idToken());
        return ResponseEntity.ok(ApiResponse.ok(response));
    }

    @PostMapping("/apple")
    public ResponseEntity<ApiResponse<AuthResponse>> appleLogin(@Valid @RequestBody AppleLoginRequest request) {
        log.info("Apple login attempt received");
        AuthResponse response = authService.appleLogin(request.idToken(), request.name());
        return ResponseEntity.ok(ApiResponse.ok(response));
    }
}
