package com.leonycosta.packapi.order.order_item;

import jakarta.persistence.*;
import lombok.*;
import java.math.BigDecimal;
import java.util.UUID;

import com.leonycosta.packapi.order.Order;
import com.leonycosta.packapi.product.product_variant.ProductVariant;

@Entity
@Table(name = "order_items")
@Getter @Setter @NoArgsConstructor @AllArgsConstructor
public class OrderItem {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @ManyToOne
    @JoinColumn(name = "order_id", nullable = false)
    private Order order;

    // Nullable — on delete set null
    @ManyToOne
    @JoinColumn(name = "variant_id", nullable = true)
    private ProductVariant variant;

    // Snapshot — preserva histórico mesmo se variante for deletada
    @Column(nullable = false)
    private String variantSku;

    @Column(nullable = false)
    private Integer quantidade;

    @Column(name = "preco_unit", nullable = false)
    private BigDecimal precoUnit;
}