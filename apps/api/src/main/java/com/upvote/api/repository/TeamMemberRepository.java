package com.upvote.api.repository;

import com.upvote.api.domain.TeamMember;
import com.upvote.api.domain.TeamMemberStatus;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface TeamMemberRepository extends JpaRepository<TeamMember, UUID> {

    List<TeamMember> findByOwnerIdOrderByInvitedAtDesc(UUID ownerId);

    Optional<TeamMember> findByMemberUserIdAndStatus(UUID memberUserId, TeamMemberStatus status);

    Optional<TeamMember> findByInviteToken(String token);

    boolean existsByOwnerIdAndInvitedEmailAndStatusIn(UUID ownerId, String email, List<TeamMemberStatus> statuses);

    long countByOwnerIdAndStatus(UUID ownerId, TeamMemberStatus status);
}
