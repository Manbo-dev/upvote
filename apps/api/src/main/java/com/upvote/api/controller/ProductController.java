package com.upvote.api.controller;

import com.upvote.api.dto.*;
import com.upvote.api.repository.UserRepository;
import com.upvote.api.service.ProductService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;

import java.util.List;

/**
 * Controller para gerenciamento de produtos
 */
@RestController
@RequestMapping("/api/products")
@RequiredArgsConstructor
public class ProductController {

    private final ProductService productService;
    private final UserRepository userRepository;

    /**
     * Lista produtos do usuário autenticado
     */
    @GetMapping
    public ResponseEntity<ApiResponse<List<ProductResponse>>> getProducts(
            @AuthenticationPrincipal UserDetails userDetails) {
        var user = userRepository.findByEmail(userDetails.getUsername())
                .orElseThrow(() -> new IllegalStateException("Usuário não encontrado"));
        List<ProductResponse> products = productService.getProductsByOwner(user.getId());
        return ResponseEntity.ok(ApiResponse.ok(products));
    }

    /**
     * Cria um novo produto
     */
    @PostMapping
    public ResponseEntity<ApiResponse<ProductResponse>> createProduct(
            @Valid @RequestBody ProductRequest request,
            @AuthenticationPrincipal UserDetails userDetails) {
        var user = userRepository.findByEmail(userDetails.getUsername())
                .orElseThrow(() -> new IllegalStateException("Usuário não encontrado"));
        ProductResponse product = productService.createProduct(request, user.getId());
        return ResponseEntity.ok(ApiResponse.ok(product, "Produto criado com sucesso"));
    }

    /**
     * Busca produto pelo slug (público)
     */
    @GetMapping("/{slug}")
    public ResponseEntity<ApiResponse<ProductResponse>> getProduct(@PathVariable String slug) {
        ProductResponse product = productService.getProductBySlug(slug);
        return ResponseEntity.ok(ApiResponse.ok(product));
    }
}
