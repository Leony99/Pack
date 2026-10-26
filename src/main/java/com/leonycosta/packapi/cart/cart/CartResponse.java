package com.leonycosta.packapi.cart.cart;

import com.leonycosta.packapi.cart.cart_item.CartItemResponse;
import lombok.*;
import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

@Getter @Setter @NoArgsConstructor @AllArgsConstructor
public class CartResponse {
    private UUID id;
    private List<CartItemResponse> itens;
    private BigDecimal total;
    private LocalDateTime atualizadoEm;
}
