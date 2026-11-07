package com.leonycosta.packapi.cart.cart_item;

import jakarta.persistence.*;
import lombok.*;
import java.util.UUID;

import com.leonycosta.packapi.cart.cart.Cart;
import com.leonycosta.packapi.product.product_variant.ProductVariant;

@Entity
// Uma linha por produto em cada carrinho: adicionar de novo soma na linha que já existe (ver CartService)
@Table(name = "cart_items", uniqueConstraints = @UniqueConstraint(name = "uk_cart_items_carrinho_variante",
        columnNames = {"cart_id", "variant_id"}))
@Getter @Setter @NoArgsConstructor @AllArgsConstructor
public class CartItem {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @ManyToOne
    @JoinColumn(name = "cart_id", nullable = false)
    private Cart cart;

    @ManyToOne
    @JoinColumn(name = "variant_id", nullable = false)
    private ProductVariant variant;

    @Column(nullable = false)
    private Integer quantidade;
}