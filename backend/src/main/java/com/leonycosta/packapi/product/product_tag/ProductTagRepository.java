package com.leonycosta.packapi.product.product_tag;

import org.springframework.data.jpa.repository.JpaRepository;
import java.util.Optional;
import java.util.UUID;

public interface ProductTagRepository extends JpaRepository<ProductTag, UUID> {
    Optional<ProductTag> findByTag(String tag);
    boolean existsByTag(String tag);
}