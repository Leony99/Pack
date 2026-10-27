package com.leonycosta.packapi.product.product_tag_link;

import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface ProductTagLinkRepository extends JpaRepository<ProductTagLink, UUID> {
    List<ProductTagLink> findByProductId(UUID productId);
    List<ProductTagLink> findByTagId(UUID tagId);
    Optional<ProductTagLink> findByProductIdAndTagId(UUID productId, UUID tagId);
    boolean existsByProductIdAndTagId(UUID productId, UUID tagId);
}