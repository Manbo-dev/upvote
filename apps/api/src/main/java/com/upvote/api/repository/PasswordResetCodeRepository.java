package com.upvote.api.repository;

import com.upvote.api.domain.PasswordResetCode;
import com.upvote.api.domain.PasswordResetCode.CodeType;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface PasswordResetCodeRepository extends JpaRepository<PasswordResetCode, UUID> {

    Optional<PasswordResetCode> findByCodeAndUsedFalse(String code);

    List<PasswordResetCode> findByUserIdAndTypeAndUsedFalse(UUID userId, CodeType type);

    @Modifying
    @Query("UPDATE PasswordResetCode c SET c.used = true WHERE c.user.id = :userId AND c.type = :type AND c.used = false")
    void invalidatePreviousCodes(UUID userId, CodeType type);
}
