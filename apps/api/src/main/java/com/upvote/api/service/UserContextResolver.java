package com.upvote.api.service;

import com.upvote.api.domain.TeamMember;
import com.upvote.api.domain.TeamMemberStatus;
import com.upvote.api.domain.User;
import com.upvote.api.repository.TeamMemberRepository;
import com.upvote.api.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.Optional;
import java.util.UUID;

/**
 * Resolves the effective workspace owner for an authenticated user.
 *
 * <p>When a user is an ACTIVE member of another user's team, all data queries
 * (canals, subscription, feedback groups) must run against the owner's userId, not
 * the member's own userId. This component centralises that resolution so controllers
 * stay thin and the proxy behaviour is applied consistently.
 */
@Service
@RequiredArgsConstructor
public class UserContextResolver {

    private final UserRepository userRepository;
    private final TeamMemberRepository teamMemberRepository;

    /**
     * Returns the effective owner UUID for data queries.
     * If the authenticated user is an ACTIVE member of another account,
     * returns that account owner's id. Otherwise returns the user's own id.
     */
    public UUID resolveOwnerId(String email) {
        User user = loadUser(email);
        return teamMemberRepository.findByMemberUserIdAndStatus(user.getId(), TeamMemberStatus.ACTIVE)
                .map(m -> m.getOwner().getId())
                .orElse(user.getId());
    }

    /**
     * Returns the authenticated User entity. Always the actual person making
     * the request — not the workspace owner proxy. Use this for personal
     * operations: profile updates, password changes.
     */
    public User resolveAuthenticatedUser(String email) {
        return loadUser(email);
    }

    /**
     * Returns true when the authenticated user is currently operating as a
     * MEMBER inside another account's workspace.
     * Use this to block owner-only operations (billing, team management).
     */
    public boolean isMember(String email) {
        User user = loadUser(email);
        return teamMemberRepository.findByMemberUserIdAndStatus(user.getId(), TeamMemberStatus.ACTIVE).isPresent();
    }

    /**
     * Builds the team context for an auth response.
     * Returns an Optional containing the active TeamMember if the user is a member.
     */
    public Optional<TeamMember> findActiveMembership(UUID userId) {
        return teamMemberRepository.findByMemberUserIdAndStatus(userId, TeamMemberStatus.ACTIVE);
    }

    private User loadUser(String email) {
        return userRepository.findByEmail(email)
                .orElseThrow(() -> new IllegalStateException("User not found: " + email));
    }
}
