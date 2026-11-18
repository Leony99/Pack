package com.leonycosta.packapi.cart.cart_item;

import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotNull;

// PATCH .../cart/items/{itemId}: a nova quantidade do item (para tirar, DELETE)
public record QuantidadeRequest(
        @NotNull(message = "Quantidade é obrigatória")
        @Min(value = 1, message = "Quantidade deve ser pelo menos 1")
        @Max(value = CartItemRequest.MAXIMO_POR_ITEM, message = "Quantidade deve ser no máximo " + CartItemRequest.MAXIMO_POR_ITEM)
        Integer quantidade) {
}
