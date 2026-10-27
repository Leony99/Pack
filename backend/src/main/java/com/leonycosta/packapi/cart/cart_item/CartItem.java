package com.leonycosta.packapi.cart.cart_item;

import jakarta.persistence.*;
import lombok.*;
import java.util.UUID;

import com.leonycosta.packapi.cart.cart.Cart;
import com.leonycosta.packapi.product.product_variant.ProductVariant;

@Entity
@Table(name = "cart_items")
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