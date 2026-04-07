package com.upvote.api.controller;

import com.upvote.api.dto.AcceptInviteRequest;
import com.upvote.api.dto.ApiResponse;
import com.upvote.api.dto.AuthResponse;
import com.upvote.api.dto.InvitePreviewResponse;
import com.upvote.api.dto.InviteRequest;
import com.upvote.api.dto.TeamMemberResponse;
import com.upvote.api.exception.BusinessException;
import com.upvote.api.security.JwtTokenProvider;
import com.upvote.api.service.AuthService;
import com.upvote.api.service.TeamService;
import com.upvote.api.service.UserContextResolver;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

/**
 * Team membership management endpoints.
 * Invite, list, and revoke team members for a workspace.
 */
@RestController
@RequestMapping("/api/team")
@RequiredArgsConstructor
@Slf4j
public class TeamController {

    private final TeamService teamService;
    private final UserContextResolver userContextResolver;
    private final AuthService authService;
    private final JwtTokenProvider jwtTokenProvider;

    /**
     * Invites a new member to the authenticated owner's workspace.
     * Blocked for users who are themselves members (not owners).
     */
    @PostMapping("/invite")
    public ResponseEntity<ApiResponse<TeamMemberResponse>> inviteMember(
            @Valid @RequestBody InviteRequest request,
            @AuthenticationPrincipal UserDetails userDetails) {
        guardOwnerOnly(userDetails);
        log.info("[TEAM] POST /api/team/invite: user={}, invitedEmail={}", userDetails.getUsername(), request.email());
        UUID ownerUserId = userContextResolver.resolveAuthenticatedUser(userDetails.getUsername()).getId();
        TeamMemberResponse response = teamService.inviteMember(ownerUserId, request.email());
        return ResponseEntity.ok(ApiResponse.ok(response, "Convite enviado com sucesso"));
    }

    /**
     * Lists all team members for the authenticated owner's workspace.
     */
    @GetMapping("/members")
    public ResponseEntity<ApiResponse<List<TeamMemberResponse>>> listMembers(
            @AuthenticationPrincipal UserDetails userDetails) {
        guardOwnerOnly(userDetails);
        UUID ownerUserId = userContextResolver.resolveAuthenticatedUser(userDetails.getUsername()).getId();
        List<TeamMemberResponse> members = teamService.listMembers(ownerUserId);
        return ResponseEntity.ok(ApiResponse.ok(members));
    }

    /**
     * Revokes a member's access to the workspace.
     */
    @DeleteMapping("/members/{id}")
    public ResponseEntity<ApiResponse<Void>> removeMember(
            @PathVariable UUID id,
            @AuthenticationPrincipal UserDetails userDetails) {
        guardOwnerOnly(userDetails);
        UUID ownerUserId = userContextResolver.resolveAuthenticatedUser(userDetails.getUsername()).getId();
        teamService.removeMember(ownerUserId, id);
        return ResponseEntity.ok(ApiResponse.ok(null, "Membro removido com sucesso"));
    }

    /**
     * Accepts a pending invite. Returns a refreshed AuthResponse so the frontend can
     * update the auth store with the new membership context without requiring re-login.
     */
    @PostMapping("/accept")
    public ResponseEntity<ApiResponse<AuthResponse>> acceptInvite(
            @Valid @RequestBody AcceptInviteRequest request,
            @AuthenticationPrincipal UserDetails userDetails) {
        log.info("[TEAM] POST /api/team/accept: user={}", userDetails.getUsername());
        var acceptingUser = userContextResolver.resolveAuthenticatedUser(userDetails.getUsername());
        teamService.acceptInvite(request.token(), acceptingUser);
        String newToken = jwtTokenProvider.generateToken(acceptingUser.getEmail());
        AuthResponse authResponse = authService.buildAuthResponseForUser(newToken, acceptingUser);
        return ResponseEntity.ok(ApiResponse.ok(authResponse, "Convite aceito com sucesso"));
    }

    /**
     * Public endpoint — returns invite preview info (owner name, invited email)
     * so the /invite/:token page can display context before the user authenticates.
     */
    @GetMapping("/invite/{token}")
    public ResponseEntity<ApiResponse<InvitePreviewResponse>> getInvitePreview(
            @PathVariable String token) {
        InvitePreviewResponse response = teamService.getInvitePreviewByToken(token);
        return ResponseEntity.ok(ApiResponse.ok(response));
    }

    private void guardOwnerOnly(UserDetails userDetails) {
        if (userContextResolver.isMember(userDetails.getUsername())) {
            throw new BusinessException("Membros não podem gerenciar a equipe. Apenas o dono do workspace pode.");
        }
    }
}
