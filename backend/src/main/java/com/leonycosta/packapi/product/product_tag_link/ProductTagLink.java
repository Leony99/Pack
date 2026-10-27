package com.leonycosta.packapi.product.product_tag_link;

import jakarta.persistence.*;
import lombok.*;
import java.util.UUID;

import com.leonycosta.packapi.product.product.Product;
import com.leonycosta.packapi.product.product_tag.ProductTag;

@Entity
@Table(
    name = "product_tag_link",
    uniqueConstraints = @UniqueConstraint(columnNames = {"product_id", "tag_id"})
)
@Getter @Setter @NoArgsConstructor @AllArgsConstructor
public class ProductTagLink {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @ManyToOne
    @JoinColumn(name = "product_id", nullable = false)
    private Product product;

    @ManyToOne
    @JoinColumn(name = "tag_id", nullable = false)
    private ProductTag tag;
}