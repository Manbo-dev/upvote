package com.upvote.api.dto;

import jakarta.validation.constraints.NotBlank;

public record ConfirmPasswordChangeRequest(@NotBlank String code) {}
