package com.leonycosta.packapi.product.product_variant;

import jakarta.persistence.*;
import lombok.*;
import java.math.BigDecimal;
import java.util.*;

import com.leonycosta.packapi.product.color.Color;
import com.leonycosta.packapi.product.Product;
import com.leonycosta.packapi.product.size.Size;

@Entity
@Table(name = "product_variants")
@Getter @Setter @NoArgsConstructor @AllArgsConstructor
public class ProductVariant {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @ManyToOne
    @JoinColumn(name = "product_id", nullable = false)
    private Product product;

    @ManyToOne
    @JoinColumn(name = "size_id", nullable = false)
    private Size size;

    @ManyToOne
    @JoinColumn(name = "color_id", nullable = false)
    private Color color;

    @Column(nullable = false, unique = true)
    private String sku;

    // Opcional — se nulo o Service usa o preco do Product
    @Column
    private BigDecimal preco;

    @Column(nullable = false)
    private Integer quant;
}