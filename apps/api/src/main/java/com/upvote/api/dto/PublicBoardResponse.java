package com.upvote.api.dto;

import java.util.List;

public record PublicBoardResponse(
        String canalName,
        String slug,
        List<PublicBoardGroupResponse> groups
) {
}
