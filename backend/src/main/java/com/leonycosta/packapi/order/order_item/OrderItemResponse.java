package com.leonycosta.packapi.order.order_item;

import lombok.*;
import java.math.BigDecimal;
import java.util.UUID;

@Getter @Setter @NoArgsConstructor @AllArgsConstructor
public class OrderItemResponse {
    private UUID id;
    private String variantSku;
    private Integer quantidade;
    private BigDecimal precoUnit;
    private BigDecimal subtotal;
}
