package com.leonycosta.packapi.cart.cart_item;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.UUID;

public interface CartItemRepository extends JpaRepository<CartItem, UUID> {
    List<CartItem> findByCartId(UUID cartId);

    // Usado ao apagar uma variante: ela sai de todos os carrinhos (um carrinho não é histórico, um pedido é)
    @Modifying(flushAutomatically = true, clearAutomatically = true)
    @Query("delete from CartItem i where i.variant.id = :variantId")
    int deleteByVariantId(@Param("variantId") UUID variantId);
}
