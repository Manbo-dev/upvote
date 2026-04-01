package com.upvote.api.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record RequestPasswordChangeRequest(
        @NotBlank String currentPassword,
        @NotBlank @Size(min = 6) String newPassword
) {}
