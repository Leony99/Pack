package com.leonycosta.packapi.product.product;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface ProductRepository extends JpaRepository<Product, UUID> {
    Optional<Product> findBySlug(String slug);
    boolean existsBySlug(String slug);
    // Ignora maiúsculas e acentos dos dois lados: "basica" encontra "Camiseta Básica"
    @Query(value = """
            SELECT * FROM products
            WHERE translate(lower(nome), 'áàâãäéèêëíìîïóòôõöúùûüç', 'aaaaaeeeeiiiiooooouuuuc')
                  LIKE '%' || translate(lower(:nome), 'áàâãäéèêëíìîïóòôõöúùûüç', 'aaaaaeeeeiiiiooooouuuuc') || '%'
            """, nativeQuery = true)
    List<Product> searchByNome(String nome);

    @Query("SELECT DISTINCT p FROM Product p JOIN p.tags tl WHERE tl.tag.tag = :tag")
    List<Product> findByTag(String tag);
}