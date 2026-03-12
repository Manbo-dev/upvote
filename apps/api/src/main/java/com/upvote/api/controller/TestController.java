package com.upvote.api.controller;

import com.upvote.api.dto.ApiResponse;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

/**
 * Controller para testes de conectividade e saúde da aplicação
 */
@RestController
@RequestMapping("/api/test")
public class TestController {

    @GetMapping("/ping")
    public ResponseEntity<ApiResponse<String>> ping() {
        return ResponseEntity.ok(
                ApiResponse.ok("hi joao, i hope you are having a good time, here will be a great project")
        );
    }

}
