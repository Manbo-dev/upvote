package com.upvote.api.controller;

import com.upvote.api.dto.ApiResponse;
import com.upvote.api.dto.CanalRequest;
import com.upvote.api.dto.CanalResponse;
import com.upvote.api.dto.RenameCanelRequest;
import com.upvote.api.dto.WidgetSettingsRequest;
import com.upvote.api.service.CanalService;
import com.upvote.api.service.UserContextResolver;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;
import java.util.UUID;

/**
 * Controller para gerenciamento de canais de feedback
 */
@RestController
@RequestMapping("/api/canais")
@RequiredArgsConstructor
@Slf4j
public class CanalController {

    private final CanalService canalService;
    private final UserContextResolver userContextResolver;

    /**
     * Lista canais do usuário autenticado (ou do workspace do owner se for membro)
     */
    @GetMapping
    public ResponseEntity<ApiResponse<List<CanalResponse>>> getCanais(
            @AuthenticationPrincipal UserDetails userDetails) {
        UUID ownerId = userContextResolver.resolveOwnerId(userDetails.getUsername());
        List<CanalResponse> canais = canalService.getCanaisByOwner(ownerId);
        return ResponseEntity.ok(ApiResponse.ok(canais));
    }

    /**
     * Cria um novo canal
     */
    @PostMapping
    public ResponseEntity<ApiResponse<CanalResponse>> createCanal(
            @Valid @RequestBody CanalRequest request,
            @AuthenticationPrincipal UserDetails userDetails) {
        UUID ownerId = userContextResolver.resolveOwnerId(userDetails.getUsername());
        CanalResponse canal = canalService.createCanal(request, ownerId);
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
        UUID ownerId = userContextResolver.resolveOwnerId(userDetails.getUsername());
        CanalResponse canal = canalService.renameCanal(id, request, ownerId);
        return ResponseEntity.ok(ApiResponse.ok(canal, "Canal renomeado com sucesso"));
    }

    /**
     * Updates widget customization settings for a channel (PRO+ only).
     */
    @PatchMapping("/{id}/widget")
    public ResponseEntity<ApiResponse<CanalResponse>> updateWidgetSettings(
            @PathVariable UUID id,
            @Valid @RequestBody WidgetSettingsRequest request,
            @AuthenticationPrincipal UserDetails userDetails) {
        log.info("PATCH /api/canais/{}/widget: user={}", id, userDetails.getUsername());
        UUID ownerId = userContextResolver.resolveOwnerId(userDetails.getUsername());
        CanalResponse canal = canalService.updateWidgetSettings(id, request, ownerId);
        return ResponseEntity.ok(ApiResponse.ok(canal, "Widget settings updated successfully"));
    }

    /**
     * Enables or disables the public board for a channel (STARTER+ only).
     */
    @PatchMapping("/{id}/public-board")
    public ResponseEntity<ApiResponse<CanalResponse>> togglePublicBoard(
            @PathVariable UUID id,
            @RequestBody Map<String, Boolean> body,
            @AuthenticationPrincipal UserDetails userDetails) {
        boolean enabled = Boolean.TRUE.equals(body.get("enabled"));
        log.info("PATCH /api/canais/{}/public-board: enabled={}, user={}", id, enabled, userDetails.getUsername());
        UUID ownerId = userContextResolver.resolveOwnerId(userDetails.getUsername());
        CanalResponse canal = canalService.togglePublicBoard(id, enabled, ownerId);
        return ResponseEntity.ok(ApiResponse.ok(canal, "Public board updated successfully"));
    }

    /**
     * Deletes a channel and all its associated data
     */
    @DeleteMapping("/{id}")
    public ResponseEntity<ApiResponse<Void>> deleteCanal(
            @PathVariable UUID id,
            @AuthenticationPrincipal UserDetails userDetails) {
        UUID ownerId = userContextResolver.resolveOwnerId(userDetails.getUsername());
        canalService.deleteCanal(id, ownerId);
        return ResponseEntity.ok(ApiResponse.ok(null, "Canal deletado com sucesso"));
    }
}
