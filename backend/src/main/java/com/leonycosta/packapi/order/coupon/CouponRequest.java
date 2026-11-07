package com.leonycosta.packapi.order.coupon;

import com.leonycosta.packapi.enums.CouponTipo;
import jakarta.validation.constraints.*;
import lombok.*;
import java.math.BigDecimal;
import java.time.LocalDateTime;

@Getter @Setter @NoArgsConstructor @AllArgsConstructor
public class CouponRequest {

    @NotBlank(message = "Código é obrigatório")
    @Size(max = 30, message = "Código deve ter no máximo 30 caracteres")
    private String codigo;

    @NotNull(message = "Desconto é obrigatório")
    @DecimalMin(value = "0.01", message = "Desconto deve ser maior que zero")
    @DecimalMax(value = "1000000.00", message = "Desconto deve ser no máximo 1.000.000,00")
    @Digits(integer = 7, fraction = 2, message = "Desconto deve ter no máximo 2 casas decimais")
    private BigDecimal desconto;

    @NotNull(message = "Tipo é obrigatório")
    private CouponTipo tipo;

    @NotNull(message = "Validade é obrigatória")
    private LocalDateTime validade;
}
