package com.leonycosta.packapi.product.product;

import jakarta.persistence.*;
import org.hibernate.annotations.ColumnDefault;
import lombok.*;
import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.*;

import com.leonycosta.packapi.product.product_image.ProductImage;
import com.leonycosta.packapi.product.product_tag_link.ProductTagLink;
import com.leonycosta.packapi.product.product_variant.ProductVariant;

@Entity
// Índice em criado_em: a ordem "recentes" do catálogo e a busca do drop em destaque (a peça mais nova)
@Table(name = "products", indexes = @Index(name = "idx_products_criado_em", columnList = "criado_em"))
@Getter @Setter @NoArgsConstructor @AllArgsConstructor
public class Product {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @Column(nullable = false)
    private String nome;

    @Column(length = 2000)
    private String descricao;

    @Column(nullable = false)
    private BigDecimal preco;

    @Column(unique = true)
    private String slug;

    @Column(name = "criado_em", nullable = false)
    private LocalDateTime criadoEm;

    // Só os ativos aparecem na loja (catálogo, busca, destaques, drop) e podem ir para o carrinho. Todo produto
    // nasce inativo: é cadastrado, recebe variantes e fotos, e só aparece quando alguém o ativa.
    // Desativar tira da loja sem perder nada (pedidos, estoque, fotos); é o jeito de "tirar de linha" uma peça
    // que já foi vendida, porque ela não pode ser apagada. O DEFAULT true vale para os produtos que já
    // existiam quando a coluna foi criada: eles continuam na loja
    @Column(nullable = false)
    @ColumnDefault("true")
    private boolean ativo;

    @OneToMany(mappedBy = "product", cascade = CascadeType.ALL, orphanRemoval = true)
    private List<ProductVariant> variantes = new ArrayList<>();

    @OneToMany(mappedBy = "product", cascade = CascadeType.ALL, orphanRemoval = true)
    private List<ProductImage> imagens = new ArrayList<>();

    @OneToMany(mappedBy = "product", cascade = CascadeType.ALL, orphanRemoval = true)
    private List<ProductTagLink> tags = new ArrayList<>();
}