package com.leonycosta.packapi.product.product_tag;

import jakarta.persistence.*;
import lombok.*;

import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

import com.leonycosta.packapi.product.product_tag_link.ProductTagLink;

@Entity
@Table(name = "product_tags")
@Getter @Setter @NoArgsConstructor @AllArgsConstructor
public class ProductTag {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @Column(nullable = false, unique = true)
    private String tag;

    @OneToMany(mappedBy = "tag", cascade = CascadeType.ALL, orphanRemoval = true)
    private List<ProductTagLink> links = new ArrayList<>();
}