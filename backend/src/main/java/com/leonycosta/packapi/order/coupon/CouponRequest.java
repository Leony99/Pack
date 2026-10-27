package com.leonycosta.packapi.order.coupon;

import com.leonycosta.packapi.enums.CouponTipo;
import jakarta.validation.constraints.*;
import lombok.*;
import java.math.BigDecimal;
import java.time.LocalDateTime;

@Getter @Setter @NoArgsConstructor @AllArgsConstructor
public class CouponRequest {

    @NotBlank(message = "Código é obrigatório")
    private String codigo;

    @NotNull(message = "Desconto é obrigatório")
    @DecimalMin(value = "0.01", message = "Desconto deve ser maior que zero")
    private BigDecimal desconto;

    @NotNull(message = "Tipo é obrigatório")
    private CouponTipo tipo;

    @NotNull(message = "Validade é obrigatória")
    private LocalDateTime validade;
}
