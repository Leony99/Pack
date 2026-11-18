package com.leonycosta.packapi.order.order_item;

import lombok.*;
import java.math.BigDecimal;
import java.util.UUID;

@Getter @Setter @NoArgsConstructor @AllArgsConstructor
public class OrderItemResponse {
    private UUID id;
    private String variantSku;
    // da variante, para a tela mostrar a peça: o produto, a foto principal, o tamanho e a cor
    private UUID produtoId;
    private String imagem;
    private String tamanho;
    private String cor;
    // o nome do produto na compra
    private String produtoNome;
    // false: o produto foi desativado depois; a loja mostra "produto indisponível"
    private boolean disponivel;
    private Integer quantidade;
    private BigDecimal precoUnit;
    private BigDecimal subtotal;
}
