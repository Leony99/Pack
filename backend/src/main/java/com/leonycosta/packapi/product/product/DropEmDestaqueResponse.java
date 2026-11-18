package com.leonycosta.packapi.product.product;

import java.util.List;

// O drop em destaque da loja (GET /products/drop-em-destaque): a coleção da peça cadastrada mais recentemente
// entre as que estão em alguma coleção, com as peças dela (as mais novas primeiro).
// Nenhuma peça em coleção → colecao nula e lista vazia (a loja mostra o EM BREVE).
public record DropEmDestaqueResponse(String colecao, List<ProductResponse> produtos) {
}
