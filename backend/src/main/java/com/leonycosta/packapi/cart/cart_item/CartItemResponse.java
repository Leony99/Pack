package com.leonycosta.packapi.cart.cart_item;

import com.leonycosta.packapi.product.product_variant.ProductVariantResponse;
import lombok.*;
import java.math.BigDecimal;
import java.util.UUID;

@Getter @Setter @NoArgsConstructor @AllArgsConstructor
public class CartItemResponse {
    private UUID id;
    private ProductVariantResponse variant;
    // o produto da variante, para a tela mostrar a peça sem outra chamada
    private UUID produtoId;
    private String produtoNome;
    private String imagem;
    private boolean ativo;
    private Integer quantidade;
    private BigDecimal precoUnitario;
    private BigDecimal subtotal;
}
