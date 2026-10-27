package com.leonycosta.packapi.cart.cart_item;

import com.leonycosta.packapi.product.product_variant.ProductVariantResponse;
import lombok.*;
import java.math.BigDecimal;
import java.util.UUID;

@Getter @Setter @NoArgsConstructor @AllArgsConstructor
public class CartItemResponse {
    private UUID id;
    private ProductVariantResponse variant;
    private Integer quantidade;
    private BigDecimal precoUnitario;
    private BigDecimal subtotal;
}
