package com.upvote.api.controller;

import com.upvote.api.dto.ApiResponse;
import com.upvote.api.dto.PublicBoardResponse;
import com.upvote.api.service.CanalService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

/**
 * Public board endpoints — no authentication required.
 */
@RestController
@RequestMapping("/api/public")
@RequiredArgsConstructor
@Slf4j
public class PublicBoardController {

    private final CanalService canalService;

    /**
     * Returns the public roadmap board for a channel.
     * Returns 404 if the board is disabled or the channel owner's plan doesn't support it.
     */
    @GetMapping("/canais/{slug}/board")
    public ResponseEntity<ApiResponse<PublicBoardResponse>> getPublicBoard(@PathVariable String slug) {
        log.info("GET /api/public/canais/{}/board", slug);
        PublicBoardResponse board = canalService.getPublicBoard(slug);
        return ResponseEntity.ok(ApiResponse.ok(board));
    }
}
