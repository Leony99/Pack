package com.leonycosta.packapi.product.product_tag;

import com.leonycosta.packapi.enums.TagFiltro;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface ProductTagRepository extends JpaRepository<ProductTag, UUID> {
    Optional<ProductTag> findByTag(String tag);
    boolean existsByTag(String tag);
    boolean existsByFiltro(TagFiltro filtro);

    // As tags de um filtro em ordem de lançamento: primeiro a que tem a peça mais nova; as que ainda
    // não têm peças na loja vão para o fim, em ordem alfabética. Uma consulta só, agrupada pelo banco
    @Query("""
            SELECT t FROM ProductTag t LEFT JOIN ProductTagLink l ON l.tag = t LEFT JOIN l.product p
            WHERE t.filtro = :filtro
            GROUP BY t
            ORDER BY MAX(p.criadoEm) DESC NULLS LAST, t.tag
            """)
    List<ProductTag> emOrdemDeLancamento(TagFiltro filtro);
}