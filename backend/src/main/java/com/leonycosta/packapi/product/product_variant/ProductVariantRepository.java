package com.leonycosta.packapi.product.product_variant;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface ProductVariantRepository extends JpaRepository<ProductVariant, UUID> {
    Optional<ProductVariant> findBySku(String sku);
    boolean existsBySku(String sku);
    List<ProductVariant> findByProductId(UUID productId);
    List<ProductVariant> findByProductIdAndColorId(UUID productId, UUID colorId);
    List<ProductVariant> findByProductIdAndSizeId(UUID productId, UUID sizeId);

    @Query("SELECT v FROM ProductVariant v WHERE v.quant <= :limite")
    List<ProductVariant> findEstoqueBaixo(int limite);
}