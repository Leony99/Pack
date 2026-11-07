package com.leonycosta.packapi.config;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;

import java.util.List;

// Resposta das listagens paginadas: os itens da página pedida e os totais, para o frontend montar a navegação.
// GET /products?pagina=0&tamanho=20 →
//   {"itens": [...], "pagina": 0, "tamanho": 20, "totalItens": 347, "totalPaginas": 18}
public record Pagina<T>(List<T> itens, int pagina, int tamanho, long totalItens, int totalPaginas) {

    public static final String TAMANHO_PADRAO = "20";
    public static final int TAMANHO_MAXIMO = 100;

    public static <T> Pagina<T> de(Page<T> page) {
        return new Pagina<>(page.getContent(), page.getNumber(), page.getSize(), page.getTotalElements(), page.getTotalPages());
    }

    // Monta o pedido ao banco (LIMIT/OFFSET). A ordem é fixa, definida por quem chama, e não vem da URL.
    // Valores fora do intervalo são ajustados em vez de virar erro: página negativa vira 0; tamanho, de 1 a 100.
    // A página também tem teto: o banco recebe o deslocamento (página × tamanho) como int, e
    // pagina=2147483647 passava do maior int e dava 500. Uma página além do fim só volta vazia.
    public static Pageable pedido(int pagina, int tamanho, Sort ordem) {
        int tam = Math.clamp(tamanho, 1, TAMANHO_MAXIMO);
        return PageRequest.of(Math.clamp(pagina, 0, Integer.MAX_VALUE / tam), tam, ordem);
    }
}
