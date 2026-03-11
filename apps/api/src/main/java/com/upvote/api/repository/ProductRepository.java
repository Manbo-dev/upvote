package com.upvote.api.repository;

import com.upvote.api.domain.Product;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface ProductRepository extends JpaRepository<Product, UUID> {
    List<Product> findByOrganizationId(UUID organizationId);
    Optional<Product> findBySlug(String slug);
}
