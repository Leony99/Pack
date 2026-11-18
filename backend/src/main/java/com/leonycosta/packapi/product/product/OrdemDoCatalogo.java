package com.leonycosta.packapi.product.product;

import com.leonycosta.packapi.exception.ParametroInvalidoException;
import org.springframework.data.domain.Sort;

import java.util.Arrays;

// A ordem do catálogo (GET /products?ordem=...). O id no fim desempata: sem ele, dois produtos com o mesmo
// preço podiam trocar de lugar entre uma página e outra e aparecer duas vezes (ou nenhuma).
public enum OrdemDoCatalogo {
    NOME("nome", Sort.by("nome", "id")),
    RECENTES("recentes", Sort.by(Sort.Order.desc("criadoEm"), Sort.Order.asc("id"))),
    MENOR_PRECO("menor-preco", Sort.by(Sort.Order.asc("preco"), Sort.Order.asc("id"))),
    MAIOR_PRECO("maior-preco", Sort.by(Sort.Order.desc("preco"), Sort.Order.asc("id")));

    private final String naUrl;
    private final Sort sort;

    OrdemDoCatalogo(String naUrl, Sort sort) {
        this.naUrl = naUrl;
        this.sort = sort;
    }

    public Sort sort() {
        return sort;
    }

    // "menor-preco" → MENOR_PRECO; vazio → NOME (a ordem de sempre da listagem)
    public static OrdemDoCatalogo daUrl(String valor) {
        if (valor == null || valor.isBlank()) return NOME;
        return Arrays.stream(values())
                .filter(o -> o.naUrl.equals(valor.strip()))
                .findFirst()
                .orElseThrow(() -> new ParametroInvalidoException(
                        "Ordem inválida: use nome, recentes, menor-preco ou maior-preco"));
    }
}
