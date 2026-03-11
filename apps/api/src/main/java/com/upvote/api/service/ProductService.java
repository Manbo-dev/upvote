package com.upvote.api.service;

import com.upvote.api.domain.Organization;
import com.upvote.api.domain.Product;
import com.upvote.api.dto.ProductRequest;
import com.upvote.api.dto.ProductResponse;
import com.upvote.api.repository.OrganizationRepository;
import com.upvote.api.repository.ProductRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.UUID;

/**
 * Serviço para gerenciamento de produtos
 */
@Service
@RequiredArgsConstructor
public class ProductService {

    private final ProductRepository productRepository;
    private final OrganizationRepository organizationRepository;

    /**
     * Lista todos os produtos das organizações do usuário
     */
    public List<ProductResponse> getProductsByOwner(UUID userId) {
        List<Organization> orgs = organizationRepository.findByOwnerId(userId);
        return orgs.stream()
                .flatMap(org -> productRepository.findByOrganizationId(org.getId()).stream())
                .map(this::toResponse)
                .toList();
    }

    /**
     * Cria um novo produto na primeira organização do usuário
     */
    @Transactional
    public ProductResponse createProduct(ProductRequest request, UUID userId) {
        Organization org = organizationRepository.findByOwnerId(userId)
                .stream().findFirst()
                .orElseThrow(() -> new IllegalStateException("Usuário não possui organização"));

        if (productRepository.findBySlug(request.slug()).isPresent()) {
            throw new IllegalArgumentException("Slug já está em uso");
        }

        Product product = Product.builder()
                .name(request.name())
                .slug(request.slug())
                .organization(org)
                .build();
        product = productRepository.save(product);

        return toResponse(product);
    }

    /**
     * Busca produto pelo slug (público)
     */
    public ProductResponse getProductBySlug(String slug) {
        Product product = productRepository.findBySlug(slug)
                .orElseThrow(() -> new IllegalArgumentException("Produto não encontrado"));
        return toResponse(product);
    }

    private ProductResponse toResponse(Product product) {
        return new ProductResponse(
                product.getId(),
                product.getName(),
                product.getSlug(),
                product.getWidgetColor(),
                product.getCreatedAt()
        );
    }
}
