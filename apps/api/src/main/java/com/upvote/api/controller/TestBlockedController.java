package com.upvote.api.controller;

import com.upvote.api.dto.ApiResponse;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

/**
 * Controller para testar bloqueio de segurança (não está no permitAll)
 */
@RestController
@RequestMapping("/api/blocked")
public class TestBlockedController {

    @GetMapping("/ping2")
    public ResponseEntity<ApiResponse<String>> ping2() {
        return ResponseEntity.ok(
                ApiResponse.ok("this route should be blocked by security")
        );
    }
}
