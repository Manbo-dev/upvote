package com.upvote.api.service;

import com.upvote.api.domain.TeamMember;
import com.upvote.api.domain.TeamMemberRole;
import com.upvote.api.domain.TeamMemberStatus;
import com.upvote.api.domain.User;
import com.upvote.api.dto.InvitePreviewResponse;
import com.upvote.api.dto.TeamMemberResponse;
import com.upvote.api.exception.BusinessException;
import com.upvote.api.exception.ResourceNotFoundException;
import com.upvote.api.repository.SubscriptionRepository;
import com.upvote.api.repository.TeamMemberRepository;
import com.upvote.api.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.security.SecureRandom;
import java.time.LocalDateTime;
import java.util.HexFormat;
import java.util.List;
import java.util.UUID;

/**
 * Business logic for team membership: inviting, accepting, and revoking access.
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class TeamService {

    private final TeamMemberRepository teamMemberRepository;
    private final UserRepository userRepository;
    private final SubscriptionRepository subscriptionRepository;
    private final EmailService emailService;

    /**
     * Invites an email address to join the owner's workspace.
     * Validates plan limits, prevents duplicate invites, and sends the invitation email.
     */
    @Transactional
    public TeamMemberResponse inviteMember(UUID ownerUserId, String invitedEmail) {
        User owner = userRepository.findById(ownerUserId)
                .orElseThrow(() -> new IllegalStateException("Owner not found: " + ownerUserId));

        if (owner.getEmail().equalsIgnoreCase(invitedEmail)) {
            throw new BusinessException("Você não pode convidar a si mesmo");
        }

        // Check plan limit
        int limit = subscriptionRepository.findByUserId(ownerUserId)
                .map(s -> s.getPlano().getLimiteMembrosTimes())
                .orElse(0);

        if (limit == 0) {
            throw new BusinessException("Seu plano não permite membros de equipe. Faça upgrade para STARTER ou superior.");
        }

        long activeCount = teamMemberRepository.countByOwnerIdAndStatus(ownerUserId, TeamMemberStatus.ACTIVE);
        if (limit != Integer.MAX_VALUE && activeCount >= limit) {
            throw new BusinessException("Limite de membros atingido para o seu plano. Faça upgrade para adicionar mais membros.");
        }

        // Prevent duplicate active/pending invite
        boolean alreadyInvited = teamMemberRepository.existsByOwnerIdAndInvitedEmailAndStatusIn(
                ownerUserId, invitedEmail.toLowerCase(),
                List.of(TeamMemberStatus.PENDING, TeamMemberStatus.ACTIVE));
        if (alreadyInvited) {
            throw new BusinessException("Este email já tem um convite ativo ou pendente neste workspace.");
        }

        String token = generateToken();
        TeamMember member = TeamMember.builder()
                .owner(owner)
                .invitedEmail(invitedEmail.toLowerCase())
                .role(TeamMemberRole.MEMBER)
                .status(TeamMemberStatus.PENDING)
                .inviteToken(token)
                .inviteExpiresAt(LocalDateTime.now().plusDays(7))
                .invitedAt(LocalDateTime.now())
                .build();
        member = teamMemberRepository.save(member);

        log.info("[TEAM] Invite sent: owner={}, invitedEmail={}", ownerUserId, invitedEmail);
        emailService.sendTeamInviteEmail(invitedEmail, token, owner.getName());

        return toResponse(member);
    }

    /**
     * Returns all team members (PENDING, ACTIVE, REVOKED) for the owner's workspace.
     */
    public List<TeamMemberResponse> listMembers(UUID ownerUserId) {
        return teamMemberRepository.findByOwnerIdOrderByInvitedAtDesc(ownerUserId)
                .stream()
                .map(this::toResponse)
                .toList();
    }

    /**
     * Revokes an ACTIVE or PENDING member's access. Clears the invite token.
     */
    @Transactional
    public void removeMember(UUID ownerUserId, UUID teamMemberId) {
        TeamMember member = teamMemberRepository.findById(teamMemberId)
                .orElseThrow(() -> new ResourceNotFoundException("Membro não encontrado"));

        if (!member.getOwner().getId().equals(ownerUserId)) {
            throw new SecurityException("Acesso negado");
        }
        if (member.getStatus() == TeamMemberStatus.REVOKED) {
            throw new BusinessException("Este membro já foi revogado");
        }

        member.setStatus(TeamMemberStatus.REVOKED);
        member.setInviteToken(null);
        member.setInviteExpiresAt(null);
        teamMemberRepository.save(member);
        log.info("[TEAM] Member revoked: ownerId={}, memberId={}", ownerUserId, teamMemberId);
    }

    /**
     * Accepts a pending invite for the given user.
     * Validates the token and expiry, then activates the membership.
     */
    @Transactional
    public TeamMemberResponse acceptInvite(String token, User acceptingUser) {
        TeamMember member = teamMemberRepository.findByInviteToken(token)
                .orElseThrow(() -> new BusinessException("Convite inválido ou não encontrado"));

        if (member.getStatus() != TeamMemberStatus.PENDING) {
            throw new BusinessException("Este convite já foi aceito ou revogado");
        }
        if (member.getInviteExpiresAt() != null && member.getInviteExpiresAt().isBefore(LocalDateTime.now())) {
            throw new BusinessException("Este convite expirou. Peça ao dono do workspace um novo convite.");
        }

        // Verify the accepting user's email matches the invite
        if (!member.getInvitedEmail().equalsIgnoreCase(acceptingUser.getEmail())) {
            throw new BusinessException("Este convite foi enviado para outro email.");
        }

        member.setMemberUser(acceptingUser);
        member.setStatus(TeamMemberStatus.ACTIVE);
        member.setAcceptedAt(LocalDateTime.now());
        member.setInviteToken(null);
        member.setInviteExpiresAt(null);
        member = teamMemberRepository.save(member);

        log.info("[TEAM] Invite accepted: ownerId={}, memberId={}", member.getOwner().getId(), acceptingUser.getId());

        // Notify the owner
        emailService.sendTeamInviteAcceptedEmail(member.getOwner(), acceptingUser.getName());

        return toResponse(member);
    }

    /**
     * Returns public preview info for an invite token (no authentication required).
     * Used by the /invite/:token page to display who sent the invite before the user logs in.
     */
    public InvitePreviewResponse getInvitePreview(String token) {
        return teamMemberRepository.findByInviteToken(token)
                .map(m -> new InvitePreviewResponse(
                        m.getOwner().getName(),
                        m.getOwner().getAvatar(),
                        m.getInvitedEmail(),
                        m.getInviteExpiresAt() != null && m.getInviteExpiresAt().isBefore(LocalDateTime.now()),
                        false))
                .orElseGet(() ->
                        // Token not found — could be already accepted (token cleared) or invalid
                        teamMemberRepository.findAll().stream()
                                .filter(m -> m.getStatus() == TeamMemberStatus.ACTIVE && m.getInviteToken() == null)
                                .findFirst()
                                .map(m -> new InvitePreviewResponse(null, null, null, false, true))
                                .orElse(new InvitePreviewResponse(null, null, null, true, false)));
    }

    /**
     * Simplified preview lookup — returns whether the token is valid, expired, or already accepted.
     */
    public InvitePreviewResponse getInvitePreviewByToken(String token) {
        return teamMemberRepository.findByInviteToken(token)
                .map(m -> new InvitePreviewResponse(
                        m.getOwner().getName(),
                        m.getOwner().getAvatar(),
                        m.getInvitedEmail(),
                        m.getInviteExpiresAt() != null && m.getInviteExpiresAt().isBefore(LocalDateTime.now()),
                        false))
                .orElse(new InvitePreviewResponse(null, null, null, true, false));
    }

    private TeamMemberResponse toResponse(TeamMember m) {
        return new TeamMemberResponse(
                m.getId(),
                m.getInvitedEmail(),
                m.getMemberUser() != null ? m.getMemberUser().getName() : null,
                m.getMemberUser() != null ? m.getMemberUser().getAvatar() : null,
                m.getRole().name(),
                m.getStatus().name(),
                m.getInvitedAt(),
                m.getAcceptedAt()
        );
    }

    private String generateToken() {
        byte[] bytes = new byte[32];
        new SecureRandom().nextBytes(bytes);
        return HexFormat.of().formatHex(bytes);
    }
}
