package com.leonycosta.packapi.product.product;

import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Page;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;

import java.util.Optional;
import java.util.UUID;

public interface ProductRepository extends JpaRepository<Product, UUID> {
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
}