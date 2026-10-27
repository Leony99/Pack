package com.leonycosta.packapi.order.coupon;

import com.leonycosta.packapi.enums.CouponTipo;
import lombok.*;
import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.UUID;

@Getter @Setter @NoArgsConstructor @AllArgsConstructor
public class CouponResponse {
    private UUID id;
    private String codigo;
    private BigDecimal desconto;
    private CouponTipo tipo;
    private LocalDateTime validade;
}
