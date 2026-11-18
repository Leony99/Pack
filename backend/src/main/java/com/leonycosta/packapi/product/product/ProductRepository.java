package com.leonycosta.packapi.product.product;

import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Page;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import com.leonycosta.packapi.enums.TagFiltro;
import java.util.List;
import org.springframework.data.jpa.repository.Query;

import java.util.Optional;
import java.util.UUID;

// JpaSpecificationExecutor: a listagem do catálogo monta o WHERE com os filtros pedidos (FiltroDoCatalogo)
public interface ProductRepository extends JpaRepository<Product, UUID>, JpaSpecificationExecutor<Product> {
    Optional<Product> findBySlug(String slug);
    boolean existsBySlug(String slug);
    // Busca por nome: ignora maiúsculas e acentos dos dois lados ("basica" encontra "Camiseta Básica").
    // A expressão fica em constantes porque o índice da busca (IndiceDaBuscaPorNome) precisa ser dela,
    // letra por letra: se as duas forem diferentes, o banco ignora o índice sem avisar e lê a tabela inteira.
    // O IndiceDaBuscaPorNomeTest confere que a consulta abaixo usa o índice.
    String SEM_ACENTO_ANTES = "translate(lower(";
    String SEM_ACENTO_DEPOIS = "), 'áàâãäéèêëíìîïóòôõöúùûüç', 'aaaaaeeeeiiiiooooouuuuc')";
    String NOME_SEM_ACENTO = SEM_ACENTO_ANTES + "nome" + SEM_ACENTO_DEPOIS;
    String FILTRO_POR_NOME = " WHERE " + NOME_SEM_ACENTO
            + " LIKE '%' || " + SEM_ACENTO_ANTES + ":nome" + SEM_ACENTO_DEPOIS + " || '%'";
    String BUSCA_POR_NOME = "SELECT * FROM products" + FILTRO_POR_NOME + " ORDER BY nome, id";

    @Query(value = BUSCA_POR_NOME, countQuery = "SELECT count(*) FROM products" + FILTRO_POR_NOME, nativeQuery = true)
    Page<Product> searchByNome(String nome, Pageable pedido);

    @Query("SELECT DISTINCT p FROM Product p JOIN p.tags tl WHERE tl.tag.tag = :tag")
    Page<Product> findByTag(String tag, Pageable pedido);

    // As coleções das peças, da peça mais nova para a mais velha: a primeira é o drop em destaque.
    // Pedida com limite 1, o banco para na primeira linha (índices em products.criado_em e product_tag_link.tag_id)
    @Query("""
            SELECT t.tag FROM ProductTagLink l JOIN l.tag t JOIN l.product p
            WHERE t.filtro = :filtro
            ORDER BY p.criadoEm DESC, p.id, t.tag
            """)
    List<String> colecoesDasPecasMaisNovas(TagFiltro filtro, Pageable limite);
}