package com.leonycosta.packapi.product.product;

import com.leonycosta.packapi.enums.TagFiltro;
import com.leonycosta.packapi.exception.ParametroInvalidoException;
import com.leonycosta.packapi.product.product_tag.ProductTag;
import com.leonycosta.packapi.product.product_tag_link.ProductTagLink;
import com.leonycosta.packapi.product.product_variant.ProductVariant;
import jakarta.persistence.criteria.Join;
import jakarta.persistence.criteria.Root;
import jakarta.persistence.criteria.Subquery;
import org.springframework.data.jpa.domain.Specification;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.Locale;

// Os filtros do catálogo (GET /products?estilo=treino&categoria=camisa&colecao=...&novidades=true&disponiveis=true).
// Cada filtro vira uma condição no WHERE da consulta: quem filtra é o banco, e só a página pedida volta.
//   - estilo, categoria e coleção: o produto tem uma ligação com uma tag daquele filtro e com aquele nome
//     (EXISTS na product_tag_link). Vários valores no mesmo filtro valem como "ou" (treino ou casual);
//   - novidades: o produto, ou uma variante dele, foi cadastrado nos últimos 3 meses (o selo NOVO da loja);
//   - disponiveis: alguma variante tem estoque.
// Filtros diferentes valem juntos ("e"): treino E camisa.
public record FiltroDoCatalogo(List<String> estilos, List<String> categorias, List<String> colecoes,
                               boolean novidades, boolean disponiveis) {

    static final int MESES_DE_NOVIDADE = 3;
    // Limites do que vem na URL: uma loja não tem tantas opções num filtro só
    static final int MAXIMO_DE_VALORES = 10;
    static final int MAXIMO_DO_NOME = 60;

    public FiltroDoCatalogo {
        estilos = limpar(estilos);
        categorias = limpar(categorias);
        colecoes = limpar(colecoes);
    }

    public static FiltroDoCatalogo nenhum() {
        return new FiltroDoCatalogo(List.of(), List.of(), List.of(), false, false);
    }

    // As tags são gravadas em minúsculas: o filtro também
    private static List<String> limpar(List<String> valores) {
        if (valores == null) return List.of();
        List<String> limpos = valores.stream()
                .filter(v -> v != null && !v.isBlank())
                .map(v -> v.strip().toLowerCase(Locale.ROOT))
                .distinct()
                .toList();
        if (limpos.size() > MAXIMO_DE_VALORES || limpos.stream().anyMatch(v -> v.length() > MAXIMO_DO_NOME)) {
            throw new ParametroInvalidoException("Filtro do catálogo grande demais (até " + MAXIMO_DE_VALORES
                    + " valores de até " + MAXIMO_DO_NOME + " letras)");
        }
        return limpos;
    }

    Specification<Product> paraConsulta() {
        List<Specification<Product>> condicoes = new ArrayList<>();
        if (!estilos.isEmpty()) condicoes.add(comTag(TagFiltro.ESTILO, estilos));
        if (!categorias.isEmpty()) condicoes.add(comTag(TagFiltro.CATEGORIA, categorias));
        if (!colecoes.isEmpty()) condicoes.add(comTag(TagFiltro.COLECAO, colecoes));
        if (novidades) condicoes.add(novidade(LocalDateTime.now().minusMonths(MESES_DE_NOVIDADE)));
        if (disponiveis) condicoes.add(comEstoque());
        return Specification.allOf(condicoes);
    }

    // EXISTS (SELECT 1 FROM product_tag_link l JOIN product_tags t ... WHERE l.product_id = p.id AND t.filtro = ? AND t.tag IN (?))
    static Specification<Product> comTag(TagFiltro filtro, List<String> tags) {
        return (produto, consulta, cb) -> {
            Subquery<Integer> sub = consulta.subquery(Integer.class);
            Root<ProductTagLink> link = sub.from(ProductTagLink.class);
            Join<ProductTagLink, ProductTag> tag = link.join("tag");
            sub.select(cb.literal(1)).where(
                    cb.equal(link.get("product"), produto),
                    cb.equal(tag.get("filtro"), filtro),
                    tag.get("tag").in(tags));
            return cb.exists(sub);
        };
    }

    // criado_em >= limite OU existe variante com criado_em >= limite
    private static Specification<Product> novidade(LocalDateTime limite) {
        return (produto, consulta, cb) -> {
            Subquery<Integer> sub = consulta.subquery(Integer.class);
            Root<ProductVariant> variante = sub.from(ProductVariant.class);
            sub.select(cb.literal(1)).where(
                    cb.equal(variante.get("product"), produto),
                    cb.greaterThanOrEqualTo(variante.get("criadoEm"), limite));
            return cb.or(cb.greaterThanOrEqualTo(produto.get("criadoEm"), limite), cb.exists(sub));
        };
    }

    private static Specification<Product> comEstoque() {
        return (produto, consulta, cb) -> {
            Subquery<Integer> sub = consulta.subquery(Integer.class);
            Root<ProductVariant> variante = sub.from(ProductVariant.class);
            sub.select(cb.literal(1)).where(
                    cb.equal(variante.get("product"), produto),
                    cb.greaterThan(variante.get("quant"), 0));
            return cb.exists(sub);
        };
    }
}
