package com.upvote.api.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;

/**
 * Request body for updating widget customization settings (PRO+ only).
 * Color must be a valid 6-digit hex. Position must be one of the four supported corners.
 */
public record WidgetSettingsRequest(

        @NotBlank
        @Pattern(regexp = "^#[0-9A-Fa-f]{6}$", message = "Color must be a valid hex value (#RRGGBB)")
        String color,

        @NotNull
        @Pattern(
                regexp = "^(BOTTOM_RIGHT|BOTTOM_LEFT|TOP_RIGHT|TOP_LEFT)$",
                message = "Position must be one of: BOTTOM_RIGHT, BOTTOM_LEFT, TOP_RIGHT, TOP_LEFT"
        )
        String position,

        @Size(max = 100)
        String title,

        @Size(max = 200)
        String placeholder
) {
}
