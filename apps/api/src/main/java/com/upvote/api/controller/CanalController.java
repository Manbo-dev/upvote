package com.upvote.api.controller;

import com.upvote.api.dto.ApiResponse;
import com.upvote.api.dto.CanalRequest;
import com.upvote.api.dto.CanalResponse;
import com.upvote.api.dto.RenameCanelRequest;
import com.upvote.api.repository.UserRepository;
import com.upvote.api.service.CanalService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

/**
 * Controller para gerenciamento de canais de feedback
 */
@RestController
@RequestMapping("/api/canais")
@RequiredArgsConstructor
public class CanalController {

    private final CanalService canalService;
    private final UserRepository userRepository;

    /**
     * Lista canais do usuário autenticado
     */
    @GetMapping
    public ResponseEntity<ApiResponse<List<CanalResponse>>> getCanais(
            @AuthenticationPrincipal UserDetails userDetails) {
        var user = userRepository.findByEmail(userDetails.getUsername())
                .orElseThrow(() -> new IllegalStateException("Usuário não encontrado"));
        List<CanalResponse> canais = canalService.getCanaisByOwner(user.getId());
        return ResponseEntity.ok(ApiResponse.ok(canais));
    }

    /**
     * Cria um novo canal
     */
    @PostMapping
    public ResponseEntity<ApiResponse<CanalResponse>> createCanal(
            @Valid @RequestBody CanalRequest request,
            @AuthenticationPrincipal UserDetails userDetails) {
        var user = userRepository.findByEmail(userDetails.getUsername())
                .orElseThrow(() -> new IllegalStateException("Usuário não encontrado"));
        CanalResponse canal = canalService.createCanal(request, user.getId());
        return ResponseEntity.ok(ApiResponse.ok(canal, "Canal criado com sucesso"));
    }

    /**
     * Busca canal pelo slug (público)
     */
    @GetMapping("/{slug}")
    public ResponseEntity<ApiResponse<CanalResponse>> getCanal(@PathVariable String slug) {
        CanalResponse canal = canalService.getCanalBySlug(slug);
        return ResponseEntity.ok(ApiResponse.ok(canal));
    }

    /**
     * Renames a channel (only the display name, slug is immutable)
     */
    @PatchMapping("/{id}/rename")
    public ResponseEntity<ApiResponse<CanalResponse>> renameCanal(
            @PathVariable UUID id,
            @Valid @RequestBody RenameCanelRequest request,
            @AuthenticationPrincipal UserDetails userDetails) {
        var user = userRepository.findByEmail(userDetails.getUsername())
                .orElseThrow(() -> new IllegalStateException("Usuário não encontrado"));
        CanalResponse canal = canalService.renameCanal(id, request, user.getId());
        return ResponseEntity.ok(ApiResponse.ok(canal, "Canal renomeado com sucesso"));
    }

    /**
     * Deletes a channel and all its associated data
     */
    @DeleteMapping("/{id}")
    public ResponseEntity<ApiResponse<Void>> deleteCanal(
            @PathVariable UUID id,
            @AuthenticationPrincipal UserDetails userDetails) {
        var user = userRepository.findByEmail(userDetails.getUsername())
                .orElseThrow(() -> new IllegalStateException("Usuário não encontrado"));
        canalService.deleteCanal(id, user.getId());
        return ResponseEntity.ok(ApiResponse.ok(null, "Canal deletado com sucesso"));
    }
}
