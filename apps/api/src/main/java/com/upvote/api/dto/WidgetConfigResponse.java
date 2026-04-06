package com.upvote.api.dto;

/**
 * Widget configuration returned by the public GET /api/widget/config endpoint.
 * Called by the widget script on initialization to apply dashboard-configured settings.
 * title and placeholder are nullable — widget falls back to its own defaults when null.
 */
public record WidgetConfigResponse(
        String color,
        String position,
        String title,
        String placeholder
) {
}
