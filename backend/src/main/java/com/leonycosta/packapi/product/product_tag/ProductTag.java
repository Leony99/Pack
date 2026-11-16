package com.leonycosta.packapi.product.product_tag;

import com.leonycosta.packapi.enums.TagFiltro;
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

    // Em qual filtro da loja a tag aparece (null: em nenhum, só na busca). Escolhido no painel.
    // A própria tag é a opção do filtro: a tag "moletons" com filtro CATEGORIA é a categoria Moletons
    @Enumerated(EnumType.STRING)
    @Column(length = 20)
    private TagFiltro filtro;

    @OneToMany(mappedBy = "tag", cascade = CascadeType.ALL, orphanRemoval = true)
    private List<ProductTagLink> links = new ArrayList<>();
}