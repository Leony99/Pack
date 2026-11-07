package com.leonycosta.packapi.cart.cart_item;

import jakarta.validation.constraints.*;
import lombok.*;
import java.util.UUID;

@Getter @Setter @NoArgsConstructor @AllArgsConstructor
public class CartItemRequest {

    // Teto de unidades de uma mesma variante no carrinho (vale para o pedido e para a soma com o que já está lá)
    public static final int MAXIMO_POR_ITEM = 99;

    @NotNull(message = "Variante é obrigatória")
    private UUID variantId;

    @NotNull(message = "Quantidade é obrigatória")
    @Min(value = 1, message = "Quantidade deve ser pelo menos 1")
    @Max(value = MAXIMO_POR_ITEM, message = "Quantidade deve ser no máximo " + MAXIMO_POR_ITEM)
    private Integer quantidade;
}
