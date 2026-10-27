package com.leonycosta.packapi.cart.cart_item;

import jakarta.validation.constraints.*;
import lombok.*;
import java.util.UUID;

@Getter @Setter @NoArgsConstructor @AllArgsConstructor
public class CartItemRequest {

    @NotNull(message = "Variante é obrigatória")
    private UUID variantId;

    @NotNull(message = "Quantidade é obrigatória")
    @Min(value = 1, message = "Quantidade deve ser pelo menos 1")
    private Integer quantidade;
}
