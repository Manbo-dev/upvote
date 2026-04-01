package com.upvote.api.dto;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record ResetPasswordRequest(
        @NotBlank @Size(min = 6) String newPassword,
        @NotBlank @Email String email,
        @NotBlank String code
) {}
